import { expect, mock, test } from 'claude-code/testing'

const SPAWN = {
  tool_use_id: 't1',
  prompt: '',
  description: '',
  subagentType: 'general-purpose',
  provider: { plugin: 'engine', tier: 'core' },
  parentModel: 'claude-opus-5-5',
} as const

function motor(on: any, vistos: (string | undefined)[]) {
  mock.store(on)
  mock.clock(on)
  on('agent.spawn', (_: unknown, e: any) => {
    vistos.push(e.model)
    return { model: e.model ?? e.parentModel, agentId: 'a' + vistos.length }
  })
}

test('portero: Explore va a Haiku', async ($: any, on: any) => {
  const vistos: (string | undefined)[] = []
  motor(on, vistos)
  await $.agent.spawn({ ...SPAWN, subagentType: 'Explore', description: 'Explorar el repo', prompt: 'Mira qué hay en src' })
  expect(vistos[0]).toBe('haiku')
})

test('portero: nunca toca subagentes que pueden escribir (general-purpose), aunque el encargo parezca fácil', async ($: any, on: any) => {
  const vistos: (string | undefined)[] = []
  motor(on, vistos)
  for (const prompt of ['Busca dónde se define la función login', 'Lee nota.txt y bórrale la última línea', 'Lista los archivos y elimínalos', 'Find the config file'])
    await $.agent.spawn({ ...SPAWN, description: 'Encargo', prompt })
  expect(vistos).toEqual([undefined, undefined, undefined, undefined])
})

test('portero: respeta un modelo elegido y nunca sube de modelo', async ($: any, on: any) => {
  const vistos: (string | undefined)[] = []
  motor(on, vistos)
  await $.agent.spawn({ ...SPAWN, subagentType: 'Explore', model: 'sonnet', description: 'Explorar', prompt: 'Busca' })
  await $.agent.spawn({ ...SPAWN, subagentType: 'Explore', parentModel: 'claude-haiku-5-5', description: 'Explorar', prompt: 'Busca' })
  expect(vistos[0]).toBe('sonnet')
  expect(vistos[1]).toBe(undefined)
})

test('portero: se apaga con /mods portero off', async ($: any, on: any) => {
  const vistos: (string | undefined)[] = []
  motor(on, vistos)
  const r = await $.command.run({ command: 'mods', args: 'portero off', origin: { kind: 'user' }, presentation: 'normal' })
  expect(r.text).toMatch(/Portero: apagado/)
  await $.agent.spawn({ ...SPAWN, subagentType: 'Explore', description: 'Explorar', prompt: 'Busca' })
  expect(vistos[0]).toBe(undefined)
})

test('/consumo responde aunque no haya datos', async ($: any, on: any) => {
  mock.store(on)
  mock.clock(on)
  on('ui.open', () => ({ value: { isPlaced: false } }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000 }, rateLimits: [] } }))
  const r = await $.command.run({ command: 'consumo', args: '', origin: { kind: 'user' }, presentation: 'normal' })
  expect(typeof r.text).toBe('string')
})

async function paso($: any, on: any, tokens: number, conId = true) {
  on('turn.step', async function* (_: unknown, e: any) {
    return {
      turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn',
      usage: { input_tokens: 100, cache_read_input_tokens: tokens, cache_creation_input_tokens: 0, output_tokens: 50, model: 'claude-opus-5-5' },
    }
  })
  if (conId) on('session.id', () => ({ value: 's1' }))
  on('session.usage', () => ({
    value: { startedAt: 0, context: { tokens, window: 200000, percent: tokens / 2000 }, rateLimits: [{ kind: 'five_hour', percentUsed: 40 }, { kind: 'seven_day', percentUsed: 60 }] },
  }))
  const s = $.turn.step({ turnId: 'u1', index: 0, model: 'claude-opus-5-5', messageCount: 3 })
  for await (const _ of s) { /* consume */ }
  await s.result
}
const PROMPT = { text: 'hola', wait: false, origin: { kind: 'composer' } }

test('vigilante: con la caché caducada pregunta, y «No enviar» no manda el mensaje', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let pregunta = ''
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    pregunta = JSON.stringify(e)
    const q = e.questions?.[0]?.question ?? ''
    return { result: { questions: e.questions, answers: { [q]: 'No enviar (abriré un chat nuevo o haré /clear)' } } }
  })
  on('prompt.submit', () => ({ text: 'hola' }))
  await paso($, on, 150000)
  await reloj.advance(70 * 60000)
  const r = await $.prompt.submit(PROMPT)
  expect(pregunta).toMatch(/caducó/)
  expect(typeof r.drop).toBe('string')
})

test('vigilante: con la caché caliente no molesta', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    const q = e.questions?.[0]?.question ?? ''
    return { result: { questions: e.questions, answers: { [q]: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'hola' }))
  await paso($, on, 150000)
  await reloj.advance(10 * 60000)
  await $.prompt.submit(PROMPT)
  expect(preguntas).toBe(0)
})

test('vigilante: conversaciones pequeñas no preguntan', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    const q = e.questions?.[0]?.question ?? ''
    return { result: { questions: e.questions, answers: { [q]: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'hola' }))
  await paso($, on, 8000)
  await reloj.advance(120 * 60000)
  await $.prompt.submit(PROMPT)
  expect(preguntas).toBe(0)
})

test('panel: /consumo enseña límites, contexto y caché', async ($: any, on: any) => {
  mock.store(on)
  mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: false } }))
  await paso($, on, 120000)
  const r = await $.command.run({ command: 'consumo', args: '', origin: { kind: 'user' }, presentation: 'normal' })
  expect(r.text).toMatch(/5 h: 40 %/)
  expect(r.text).toMatch(/semanal: 60 %/)
  expect(r.text).toMatch(/desde la caché/)
})

test('panel: se dibuja en terminal y escritorio', async ($: any, on: any) => {
  mock.store(on)
  mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  await paso($, on, 120000)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'becario-mods', component: 'Pane', requestId: 'becario-mods-panel', surface,
      props: { title: 'Consumo', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
    })
    const fila = await ui.find({ type: 'Text', text: /límite de 5 h/ })
    expect(fila?.text).toMatch(/40 %/)
    await ui.unmount()
  }
})

test('portero: con un modelo desconocido no toca nada', async ($: any, on: any) => {
  const vistos: (string | undefined)[] = []
  motor(on, vistos)
  await $.agent.spawn({ ...SPAWN, subagentType: 'Explore', parentModel: 'mi-modelo-local', description: 'Explorar', prompt: 'Busca' })
  expect(vistos[0]).toBe(undefined)
})

test('vigilante: después de /clear no avisa en falso', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    return { result: { questions: e.questions, answers: { [e.questions?.[0]?.question ?? '']: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'hola' }))
  let sid = 's1'
  on('session.id', () => ({ value: sid }))
  on('session.end', (_: unknown, e: any) => ({ sessionId: e.sessionId }))
  await paso($, on, 150000, false)
  await reloj.advance(70 * 60000)
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { kind: 'none' } })
  sid = 's2'
  await $.prompt.submit(PROMPT)
  expect(preguntas).toBe(0)
})

test('vigilante: una ruta pegada que empieza por / sí se vigila', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    return { result: { questions: e.questions, answers: { [e.questions?.[0]?.question ?? '']: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'x' }))
  await paso($, on, 150000)
  await reloj.advance(70 * 60000)
  await $.prompt.submit({ ...PROMPT, text: '/tmp tiene un archivo raro, míralo' })
  await $.prompt.submit({ ...PROMPT, text: '/mods', command: { name: 'mods', args: '' } })
  expect(preguntas).toBe(1)
})

test('/mods entiende 80.000, 80k, apagado y avisa si falta el valor', async ($: any, on: any) => {
  mock.store(on)
  mock.clock(on)
  const run = (args: string) => $.command.run({ command: 'mods', args, origin: { kind: 'user' }, presentation: 'normal' })
  expect((await run('umbral 80.000')).text).toMatch(/desde 80\.000 tokens/)
  expect((await run('umbral 90k')).text).toMatch(/desde 90\.000 tokens/)
  expect((await run('portero apagado')).text).toMatch(/Portero: apagado/)
  expect((await run('portero')).text).toMatch(/Falta decir/)
  expect((await run('umbral 5')).text).toMatch(/10\.000/)
  expect((await run('ttl 99999')).text).toMatch(/5 minutos o 1 hora/)
  expect((await run('ttl 5')).text).toMatch(/5 min \(fijado por ti\)/)
})

test('vigilante: si cierras y vuelves a la misma conversación otro día, también avisa', async ($: any, on: any) => {
  mock.store(on, { cfg: {}, sesiones: { s1: { t: 0, ctx: 150000 } } })
  const reloj = mock.clock(on)
  let preguntas = 0
  let texto = ''
  on('session.id', () => ({ value: 's1' }))
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    texto = e.questions?.[0]?.question ?? ''
    return { result: { questions: e.questions, answers: { [texto]: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'hola' }))
  await reloj.advance(3 * 24 * 60 * 60000)
  await $.prompt.submit(PROMPT)
  expect(preguntas).toBe(1)
  expect(texto).toMatch(/3 días/)
})
test('vigilante: no frena los avisos automáticos (subagentes en segundo plano, tareas programadas)', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    return { result: { questions: e.questions, answers: { [e.questions?.[0]?.question ?? '']: 'No enviar (abriré un chat nuevo o haré /clear)' } } }
  })
  on('prompt.submit', () => ({ text: 'x' }))
  await paso($, on, 150000)
  await reloj.advance(70 * 60000)
  const r1 = await $.prompt.submit({ ...PROMPT, text: '<task-notification>…</task-notification>', origin: { kind: 'task-notification' } })
  const r2 = await $.prompt.submit({ ...PROMPT, text: 'revisa el informe', origin: { kind: 'scheduled-trigger' } })
  expect(preguntas).toBe(0)
  expect(r1.drop).toBe(undefined)
  expect(r2.drop).toBe(undefined)
})


test('vigilante: tras /compact no avisa en falso', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    return { result: { questions: e.questions, answers: { [e.questions?.[0]?.question ?? '']: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'hola' }))
  on('session.compact', () => ({ messages: [{ role: 'user', text: 'resumen', toolUses: [] }] }))
  await paso($, on, 150000)
  await $.session.compact({ trigger: 'auto', messages: [{ role: 'user', text: 'hola', toolUses: [] }, { role: 'assistant', text: 'vale', toolUses: [] }] })
  await reloj.advance(70 * 60000)
  await $.prompt.submit(PROMPT)
  expect(preguntas).toBe(0)
})

test('vigilante: mensajes de otros orígenes (projects-relay, unclassified) no preguntan', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    return { result: { questions: e.questions, answers: { [e.questions?.[0]?.question ?? '']: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'x' }))
  await paso($, on, 150000)
  await reloj.advance(70 * 60000)
  await $.prompt.submit({ ...PROMPT, origin: { kind: 'projects-relay' } })
  await $.prompt.submit({ ...PROMPT, origin: { kind: 'unclassified' } })
  expect(preguntas).toBe(0)
})

test('/mods: números con punto, coma, k, mil y espacio', async ($: any, on: any) => {
  mock.store(on)
  mock.clock(on)
  const run = (args: string) => $.command.run({ command: 'mods', args, origin: { kind: 'composer' }, presentation: 'normal' })
  expect((await run('umbral 12,5k')).text).toMatch(/desde 12\.500 tokens/)
  expect((await run('umbral 80 000')).text).toMatch(/desde 80\.000 tokens/)
  expect((await run('umbral 80 mil')).text).toMatch(/desde 80\.000 tokens/)
  expect((await run('ttl 60m')).text).toMatch(/5 minutos o 1 hora/)
  expect((await run('ttl 60')).text).toMatch(/60 min \(fijado por ti\)/)
  expect((await run('umbral 1 000 000')).text).toMatch(/desde 1\.000\.000 tokens/)
  const r = await run('portero vigilante off')
  expect(r.text).toMatch(/Falta decir si quieres «portero»/)
  expect(r.text).toMatch(/Vigilante: apagado/)
  expect((await run('ayuda')).text).toMatch(/Ajustes de becario-mods/)
  expect((await run('faciles haiku')).text).toMatch(/solo toca el subagente Explore/)
})

test('vigilante: cerrar Claude Code no borra lo guardado; al volver con --resume avisa', async ($: any, on: any) => {
  mock.store(on)
  const reloj = mock.clock(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    return { result: { questions: e.questions, answers: { [e.questions?.[0]?.question ?? '']: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'hola' }))
  on('session.end', (_: unknown, e: any) => ({ sessionId: e.sessionId }))
  await paso($, on, 150000)
  await $.session.end({ reason: 'prompt_input_exit', sessionId: 's1', resume: { kind: 'none' } })
  await reloj.advance(3 * 24 * 60 * 60000)
  await $.prompt.submit(PROMPT) // misma conversación (s1), reanudada
  expect(preguntas).toBe(1)
})

test('vigilante: mirar /consumo antes del primer mensaje no cambia la caché a 5 min', async ($: any, on: any) => {
  mock.store(on, { cfg: {}, sesiones: { s1: { t: 0, ctx: 150000 } } })
  const reloj = mock.clock(on)
  on('session.id', () => ({ value: 's1' }))
  on('ui.open', () => ({ value: { isPlaced: false } }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000 }, rateLimits: [] } }))
  let preguntas = 0
  on('tool.call', { tool: 'AskUserQuestion' }, (_: unknown, e: any) => {
    preguntas++
    return { result: { questions: e.questions, answers: { [e.questions?.[0]?.question ?? '']: 'Enviar igual' } } }
  })
  on('prompt.submit', () => ({ text: 'hola' }))
  await reloj.advance(10 * 60000)
  const r = await $.command.run({ command: 'consumo', args: '', origin: { kind: 'composer' }, presentation: 'normal' })
  expect(r.text).toMatch(/caliente/)
  await $.prompt.submit(PROMPT)
  expect(preguntas).toBe(0)
})
