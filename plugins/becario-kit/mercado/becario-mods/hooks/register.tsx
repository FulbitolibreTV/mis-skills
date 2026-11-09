// becario-mods v1.3 · tres mods para gastar menos límite en Claude Code.
//   Portero:   pone el subagente Explore (busca y lee, no puede modificar archivos) a trabajar con Haiku.
//              No toca ningún otro subagente ni el modelo de tu conversación (eso obliga a releerla sin caché).
//   Vigilante: si vuelves cuando la caché ya caducó y la conversación es grande, te avisa antes de enviar.
//              Y antes de que caduque, te recuerda que un /compact con la caché caliente sale barato.
//   Panel:     límites de 5 h y semanal, contexto, caché y lo que gasta cada agente (/consumo).
// Ajustes: /mods (se guardan entre sesiones).
import { atom, read, update } from 'claude-code'
import type { Register, EngineInterface } from 'claude-code'
import type { Paso, Limites } from '../types'

const PANEL = 'becario-mods-panel'
const pasos = atom({ plugin: 'becario-mods', key: 'pasos' } as const, [], { shape: 'pasos-1' })
const limites = atom(
  { plugin: 'becario-mods', key: 'limites' } as const,
  { ctx: 0, ventana: 0, pct: 0, cinco: null, semana: null, usd: null, modelo: '' },
  { shape: 'limites-1' },
)
const porteroLog = atom({ plugin: 'becario-mods', key: 'portero' } as const, [], { shape: 'portero-1' })

type Cfg = {
  portero: boolean
  explorar: string // modelo para el subagente Explore: haiku | sonnet | igual
  vigilante: boolean
  umbral: number // tokens a partir de los que avisa (10.000 a 1.000.000)
  ttl: number // minutos de vida de la caché (1 a 120); 0 = automático
  recordatorio: boolean // aviso 5 min antes de que caduque la caché
  panel: boolean // abrir el panel solo al empezar
}
const DEF: Cfg = {
  portero: true,
  explorar: 'haiku',
  vigilante: true,
  umbral: 50000,
  ttl: 0,
  recordatorio: true,
  panel: false,
}
async function cfg($: EngineInterface): Promise<Cfg> {
  try {
    const g = ((await $.store.get('cfg')) ?? {}) as Partial<Cfg>
    return { ...DEF, ...g }
  } catch {
    return { ...DEF }
  }
}

// Estado de la sesión: se vacía con /clear, /resume y /compact.
// La hora y el tamaño de la última petición se guardan también por sesión, para avisar al volver otro día.
let ultimoMain: number | null = null
let ultimoCtx = 0
let creditos = false
let sinLimites = false // la sesión no trae límites de plan: API o pasarela (caché de 5 min)
let timer: { cancel: () => void } | null = null
let ultimoPaso = 0 // última petición de cualquier agente: si Claude sigue trabajando, no se recuerda nada
const tipos: Record<string, string> = {}

function olvidar() {
  ultimoMain = null
  ultimoCtx = 0
  timer?.cancel()
  timer = null
}

// ---------- formato ----------
// número con punto de miles y coma decimal (sin depender de Intl)
function num(n: number, d = 0): string {
  const neg = n < 0
  const [ent, dec] = Math.abs(n).toFixed(d).split('.')
  const miles = (ent ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (neg ? '-' : '') + miles + (dec ? ',' + dec : '')
}
const k = (n: number) =>
  n >= 999500 ? num(n / 1e6, 1) + ' M' : n >= 1000 ? num(Math.round(n / 1000)) + ' mil' : num(n)
const pct = (x: number) => num(Math.round(x)) + ' %'
const plural = (n: number, uno: string, varios: string) => num(n) + ' ' + (n === 1 ? uno : varios)
const corto = (m: string) =>
  (m || '?').replace(/^claude-/, '').replace(/-(\d+)-(\d+).*$/, ' $1.$2').replace(/^(\w)/, c => c.toUpperCase())

// ---------- portero ----------
function familia(m: string): string | null {
  const x = (m || '').toLowerCase()
  if (x.includes('haiku')) return 'haiku'
  if (x.includes('sonnet')) return 'sonnet'
  if (x.includes('opus')) return 'opus'
  if (x.includes('fable') || x === 'best') return 'fable'
  return null // modelo desconocido (pasarela propia, modelo local…): no se toca
}
const ORDEN: Record<string, number> = { haiku: 1, sonnet: 2, opus: 3, fable: 4 }

// ---------- vigilante ----------
async function programarRecordatorio($: EngineInterface, entrada: number) {
  const c = await cfg($)
  timer?.cancel()
  timer = null
  const min = ttlMin(c)
  // con la caché de 5 min no hay recordatorio: no daría tiempo a usarlo
  if (c.vigilante && c.recordatorio && Math.max(entrada, ultimoCtx) >= c.umbral && min > 6) {
    timer = $.clock.after((min - 5) * 60000, () => {
      void (async () => {
        if ((await $.clock.now()) - ultimoPaso < 3 * 60000) return // un subagente sigue trabajando
        $.ui.toast('La caché de esta conversación caduca en 5 min. Si te vas a ir más rato, un /compact ahora sale barato.')
      })()
    })
  }
}
function ttlMin(c: Cfg): number {
  if (c.ttl > 0) return c.ttl
  if (creditos || sinLimites) return 5 // créditos de uso, API o pasarela: 5 min
  return 60 // suscripción dentro del plan: 1 hora
}
async function guardarSesion($: EngineInterface, t: number, ctx: number) {
  try {
    const id = await $.session.id()
    const s = ((await $.store.get('sesiones')) ?? {}) as Record<string, { t: number; ctx: number }>
    delete s[id] // al final de la lista: la usada más recientemente
    s[id] = { t, ctx }
    const ids = Object.keys(s)
    for (const viejo of ids.slice(0, Math.max(0, ids.length - 30))) delete s[viejo]
    await $.store.set('sesiones', s)
  } catch {
    // sin almacén: solo se recuerda mientras la sesión siga abierta
  }
}
async function borrarSesion($: EngineInterface, id?: string) {
  try {
    const cual = id ?? (await $.session.id())
    const s = ((await $.store.get('sesiones')) ?? {}) as Record<string, { t: number; ctx: number }>
    if (s[cual]) {
      delete s[cual]
      await $.store.set('sesiones', s)
    }
  } catch {
    // nada que borrar
  }
}
async function recuperarSesion($: EngineInterface) {
  if (ultimoMain !== null) return
  try {
    const id = await $.session.id()
    const s = ((await $.store.get('sesiones')) ?? {}) as Record<string, { t: number; ctx: number }>
    const g = s[id]
    if (g) {
      ultimoMain = g.t
      ultimoCtx = g.ctx
    }
  } catch {
    // nada guardado
  }
}

async function leerLimites($: EngineInterface, modelo?: string, trasRespuesta = false) {
  try {
    const u = await $.session.usage()
    const cinco = u.rateLimits.find(r => r.kind === 'five_hour')?.percentUsed ?? null
    const semana = u.rateLimits.find(r => r.kind === 'seven_day')?.percentUsed ?? null
    creditos = (cinco ?? 0) >= 100 || (semana ?? 0) >= 100
    if (trasRespuesta) sinLimites = cinco === null && semana === null // con suscripción llegan tras la primera respuesta
    await update($, limites, l => ({
      ctx: u.context.tokens ?? l.ctx,
      ventana: u.context.window ?? l.ventana,
      pct: u.context.percent ?? l.pct,
      cinco,
      semana,
      usd: u.cost?.usd ?? null,
      modelo: modelo ?? l.modelo,
    }))
  } catch {
    // sin datos de uso en este entorno: el panel enseña lo que tenga
  }
}

function resumenTexto(l: Limites, ps: Paso[], log: string[], c: Cfg, ahora: number): string {
  const lineas: string[] = []
  if (l.cinco !== null || l.semana !== null)
    lineas.push(`Tu límite de 5 h: ${l.cinco === null ? '?' : pct(l.cinco)} · semanal: ${l.semana === null ? '?' : pct(l.semana)}`)
  else if (l.usd !== null && ps.length) lineas.push(`Gasto estimado de la sesión: ${num(l.usd, 2)} $ (a precio de lista)`)
  if (l.ventana && ps.length) lineas.push(`Contexto: ${k(l.ctx)} de ${k(l.ventana)} tokens (${pct(l.pct)})`)
  const ult = [...ps].reverse().find(p => p.agente === 'principal')
  if (ult) lineas.push(`Última petición: ${corto(ult.modelo)} · ${k(ult.entrada)} tokens de entrada · ${pct(ult.cache)} desde la caché`)
  const grupos: Record<string, { tipo: string; modelo: string; n: number; ent: number; sal: number }> = {}
  for (const p of ps) {
    const g = (grupos[p.agente] ??= { tipo: p.tipo, modelo: p.modelo, n: 0, ent: 0, sal: 0 })
    g.n++
    g.ent += p.entrada
    g.sal += p.salida
    g.modelo = p.modelo
  }
  const filas = Object.entries(grupos).sort(([a], [b]) => (a === 'principal' ? -1 : b === 'principal' ? 1 : 0))
  if (filas.length) {
    lineas.push('Por agente (esta sesión):')
    for (const [id, g] of filas)
      lineas.push(
        `  ${id === 'principal' ? 'Principal' : g.tipo + ' ' + id.slice(0, 5)} · ${corto(g.modelo)} · ${plural(g.n, 'petición', 'peticiones')} · ${k(g.ent)} de entrada · ${k(g.sal)} de salida`,
      )
  }
  if (log.length) lineas.push('Portero: ' + log.slice(-3).join(' | '))
  const minutos = ultimoMain !== null ? Math.floor((ahora - ultimoMain) / 60000) : null
  if (minutos !== null)
    lineas.push(`Caché: ${minutos < ttlMin(c) ? 'caliente' : 'fría'} (última actividad hace ${plural(minutos, 'minuto', 'minutos')}; dura ${ttlMin(c)} min)`)
  if (!lineas.length) lineas.push('Aún no hay datos: manda un mensaje y vuelve a escribir /consumo.')
  return lineas.join('\n')
}

// Solo se vigilan los mensajes que escribe una persona (los avisos automáticos pasan sin preguntar)
const HUMANOS: string[] = ['composer', 'bridge', 'sdk']

// ---------- lectura de /mods ----------
const SI = ['on', 'si', 'sí', 'activar', 'activado', 'activa', 'encender', 'encendido', 'yes', 'true', '1']
const NO = ['off', 'no', 'desactivar', 'desactivado', 'desactiva', 'apagar', 'apagado', 'false', '0']
const CLAVES = ['portero', 'explorar', 'faciles', 'fáciles', 'vigilante', 'umbral', 'ttl', 'recordatorio', 'panel', 'ayuda', 'help']
const AYUDA =
  'Ejemplos: /mods portero off · /mods explorar sonnet · /mods vigilante off · /mods umbral 80000 · /mods ttl 60 · /mods recordatorio off · /mods panel on'
// «80000», «80.000», «80 000», «80k», «80 mil», «12,5k», «1,5m» (millones). Para minutos, sin unidades.
function numero(v: string, conUnidad = true): number | null {
  let t = v.trim().toLowerCase().replace(/\s+mil$/, 'k').replace(/\s+/g, '')
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '') // punto de miles
  t = t.replace(',', '.')
  const m = t.match(conUnidad ? /^(\d+(?:\.\d+)?)(k|mil|m)?$/ : /^(\d+(?:\.\d+)?)$/)
  if (!m) return null
  const base = Number(m[1])
  return Math.round(m[2] === 'k' || m[2] === 'mil' ? base * 1000 : m[2] === 'm' ? base * 1e6 : base)
}
const EXPLICA = [
  'Ajustes de becario-mods:',
  '  portero on/off · el portero pone el subagente Explore a trabajar con un modelo que gasta menos',
  '  explorar haiku/sonnet/igual · ese modelo (igual = el mismo que tu conversación)',
  '  vigilante on/off · aviso antes de enviar si la caché de una conversación grande ya caducó',
  '  umbral 80000 · desde cuántos tokens avisa (10.000 a 1.000.000; vale 80k o 80.000)',
  '  ttl 5/60/auto · minutos que dura la caché (auto = 60 con suscripción, 5 sin ella)',
  '  recordatorio on/off · aviso 5 min antes de que caduque la caché',
  '  panel on/off · abrir el panel al empezar (siempre puedes usar /consumo)',
].join('\n')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // si otro plugin ya usa el nombre, seguimos sin ese comando en vez de fallar
    await $.command
      .register({ name: 'consumo', description: 'Enseña lo que estás gastando: límites, contexto, caché y agentes' })
      .catch(() => $.ui.log('becario-mods: /consumo ya lo usa otro plugin'))
    await $.command
      .register({
        name: 'mods',
        description: 'Ajustes de becario-mods (portero, vigilante y panel)',
        argumentHint: '[ayuda] [portero|vigilante|recordatorio|panel on|off] [explorar haiku|sonnet|igual] [umbral N] [ttl 5|60|auto]',
      })
      .catch(() => $.ui.log('becario-mods: /mods ya lo usa otro plugin'))
    if ((await cfg($)).panel) void $.ui.open({ id: PANEL, title: 'Consumo' }).catch(() => undefined)
    return next(e)
  })

  // /clear, /resume y /branch cambian de conversación; /compact (también la automática) la resume y borra lo guardado
  on('session.end', async ($, e, next) => {
    // se olvida en memoria, pero lo guardado se queda: al volver con --resume sigue siendo cierto
    olvidar()
    return next(e)
  }).catch(($, e, next) => next(e))
  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    if (!('skip' in r && r.skip) && !e.agentId && e.trigger !== 'precompute') {
      olvidar()
      await borrarSesion($)
    }
    return r
  }).catch(($, e, next) => next(e))

  // ---------- PORTERO ----------
  on('agent.spawn', async ($, e, next) => {
    const c = await cfg($)
    const apuntar = (r: Awaited<ReturnType<typeof next>>) => {
      if ('agentId' in r && r.agentId) tipos[r.agentId] = e.subagentType
      return r
    }
    if (!c.portero || e.model || e.subagentType === 'fork' || e.resume) return apuntar(await next(e))
    // solo Explore: busca y lee, pero no puede escribir ni editar archivos, así que bajarle el modelo no rompe nada
    const destino = e.subagentType === 'Explore' ? c.explorar : undefined
    const padre = familia(e.parentModel)
    // solo baja de modelo, nunca sube, y nunca con modelos que no conoce
    if (destino && destino !== 'igual' && padre && (ORDEN[destino] ?? 9) < (ORDEN[padre] ?? 0)) {
      const nota = `«${e.description.slice(0, 40)}» → ${destino}`
      $.ui.log('portero: ' + nota)
      await update($, porteroLog, l => [...l, nota].slice(-20))
      return apuntar(await next({ ...e, model: destino }))
    }
    return apuntar(await next(e))
  }).catch(($, e, next) => next(e))

  // ---------- PANEL: apunta cada petición ----------
  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    const u = r.usage
    if (u) {
      const leido = u.cache_read_input_tokens ?? 0
      const entrada = (u.input_tokens ?? 0) + leido + (u.cache_creation_input_tokens ?? 0)
      const ahora = await $.clock.now()
      const p: Paso = {
        t: ahora,
        agente: e.agentId ?? 'principal',
        tipo: e.agentId ? tipos[e.agentId] ?? 'subagente' : 'principal',
        modelo: String(u.model ?? e.model),
        entrada,
        cache: entrada ? Math.round((100 * leido) / entrada) : 0,
        salida: u.output_tokens ?? 0,
      }
      await update($, pasos, l => [...l, p].slice(-300))
      if (!e.agentId) {
        ultimoMain = ahora
        ultimoCtx = entrada
        await leerLimites($, p.modelo, true)
        await guardarSesion($, ahora, entrada)
        const l = await read($, limites)
        const partes = [`ctx ${pct(l.pct)}`, `caché ${pct(p.cache)}`]
        if (l.cinco !== null) partes.push(`5 h ${pct(l.cinco)}`)
        $.ui.status(partes.join(' · '))
        await programarRecordatorio($, entrada)
      }
      ultimoPaso = ahora
    }
    return r
  })

  // ---------- VIGILANTE: aviso al volver ----------
  on('prompt.submit', async ($, e, next) => {
    const c = await cfg($)
    if (!c.vigilante) return next(e)
    // solo lo que escribe la persona: avisos de subagentes, tareas programadas u otros plugins pasan sin preguntar
    if (!HUMANOS.includes(e.origin.kind) || e.isMeta || e.command || e.turnId) return next(e)
    await recuperarSesion($)
    if (ultimoMain === null || ultimoCtx < c.umbral) return next(e)
    const parado = ((await $.clock.now()) - ultimoMain) / 60000
    if (parado < ttlMin(c)) return next(e)
    const tiempo =
      parado >= 2880 ? plural(Math.round(parado / 1440), 'día', 'días') : parado >= 120 ? `${num(Math.round(parado / 60))} h` : `${num(Math.round(parado))} min`
    let r = 'Enviar igual'
    try {
      r = await $.ui.ask(
        `La caché de esta conversación caducó (sin actividad ${tiempo}). ` +
          `Este mensaje releerá unos ${k(ultimoCtx)} tokens sin caché, y eso gasta mucho más límite. ¿Lo envío?`,
        ['Enviar igual', 'No enviar (abriré un chat nuevo o haré /clear)'],
      )
    } catch {
      $.ui.log(`vigilante: la caché caducó; este mensaje relee unos ${k(ultimoCtx)} tokens sin caché`)
      return next(e)
    }
    if (r.startsWith('No enviar')) {
      return {
        drop: 'Mensaje no enviado. Consejo: /clear para empezar con poco contexto y pega un resumen corto de lo que necesitas, o abre un chat nuevo.',
      }
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // ---------- PANEL: dibujo y comandos ----------
  on('ui.render', { component: 'Pane', requestId: PANEL }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const txt = resumenTexto(await read($, limites), await read($, pasos), await read($, porteroLog), await cfg($), await $.clock.now())
    return (
      <Box flexDirection="column">
        {txt.split('\n').map((ln, i) => (i === 0 ? <Text bold>{ln}</Text> : <Text>{ln}</Text>))}
      </Box>
    )
  })

  on('command.run', { command: 'consumo' }, async $ => {
    await leerLimites($)
    await recuperarSesion($)
    void $.ui.open({ id: PANEL, title: 'Consumo' }).catch(() => undefined)
    return { text: resumenTexto(await read($, limites), await read($, pasos), await read($, porteroLog), await cfg($), await $.clock.now()) }
  })

  on('command.run', { command: 'mods' }, async ($, e) => {
    const c = await cfg($)
    const a = e.args.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const avisos: string[] = []
    let cambiado = false
    let i = 0
    while (i < a.length) {
      const clave = (a[i] ?? '').replace('fáciles', 'faciles')
      // juntar «1 000 000», «80 000» y «80 mil»
      if (['umbral', 'ttl'].includes(clave) && /^\d+$/.test(a[i + 1] ?? '')) {
        while (/^\d{3}$/.test(a[i + 2] ?? '')) {
          a[i + 1] = (a[i + 1] ?? '') + a[i + 2]
          a.splice(i + 2, 1)
        }
        if (a[i + 2] === 'mil') {
          a[i + 1] = (a[i + 1] ?? '') + 'k'
          a.splice(i + 2, 1)
        }
      }
      const val = CLAVES.includes(a[i + 1] ?? '') ? '' : a[i + 1] ?? ''
      if (val === '' && a[i + 1] !== undefined) i -= 1 // el siguiente es otra clave: no se lo come
      if (['ayuda', 'help', '?'].includes(clave)) {
        i += 1
        avisos.push(EXPLICA)
        continue
      }

      i += 2
      if (['portero', 'vigilante', 'recordatorio', 'panel'].includes(clave)) {
        if (SI.includes(val)) (c as Record<string, unknown>)[clave] = true
        else if (NO.includes(val)) (c as Record<string, unknown>)[clave] = false
        else {
          avisos.push(`Falta decir si quieres «${clave}» encendido o apagado. Por ejemplo: /mods ${clave} off`)
          continue
        }
        cambiado = true
      } else if (clave === 'faciles') {
        avisos.push('Desde la v1.2 el portero solo toca el subagente Explore, que no puede modificar archivos. Su modelo se cambia con «explorar».')
      } else if (clave === 'explorar') {
        if (['haiku', 'sonnet', 'igual'].includes(val)) {
          c.explorar = val
          cambiado = true
        } else avisos.push('Para «explorar» elige haiku, sonnet o igual (igual = el mismo modelo que tu conversación).')
      } else if (clave === 'umbral') {
        const n = numero(val, true)
        if (n !== null) {
          c.umbral = Math.min(1000000, Math.max(10000, n))
          if (c.umbral !== n) avisos.push(`El umbral va de 10.000 a 1.000.000 tokens; lo dejo en ${num(c.umbral)}.`)
          cambiado = true
        } else avisos.push('El umbral es un número de tokens, por ejemplo: /mods umbral 80000 (o 80k).')
      } else if (clave === 'ttl') {
        const n = val === 'auto' ? 0 : numero(val, false)
        if (n === 0 || n === 5 || n === 60) {
          c.ttl = n
          if (n === 0 && val !== 'auto') avisos.push('ttl 0 = automático.')
          cambiado = true
        } else avisos.push('La caché de Claude Code dura 5 minutos o 1 hora: usa /mods ttl 5, /mods ttl 60 o /mods ttl auto.')
      } else {
        avisos.push(`No conozco «${clave}».`)
        i -= 1 // quizá era un valor suelto: sigue desde la palabra siguiente
      }
    }
    if (cambiado) {
      // solo se guarda lo que difiere de lo de serie, para que una versión nueva pueda mejorar los valores por defecto
      const guardar: Record<string, unknown> = {}
      for (const [clave, valor] of Object.entries(c)) if (clave in DEF && (DEF as Record<string, unknown>)[clave] !== valor) guardar[clave] = valor
      await $.store.set('cfg', guardar)
    }
    if (!c.vigilante || !c.recordatorio) {
      timer?.cancel()
      timer = null
    }
    const cache = c.ttl ? `${c.ttl} min (fijado por ti)` : `${ttlMin(c)} min (automático)`
    const estado = [
      `Portero: ${c.portero ? 'activado' : 'apagado'} · subagente Explore → ${c.explorar}`,
      `Vigilante: ${c.vigilante ? 'activado' : 'apagado'} · avisa desde ${num(c.umbral)} tokens · caché de ${cache} · recordatorio ${c.recordatorio ? 'sí' : 'no'}`,
      `Panel al empezar: ${c.panel ? 'sí' : 'no'} (ábrelo cuando quieras con /consumo)`,
      avisos.includes(EXPLICA) ? AYUDA : AYUDA + ' · /mods ayuda (qué hace cada uno)',
    ]
    return { text: [...avisos, ...estado].join('\n') }
  })
}
