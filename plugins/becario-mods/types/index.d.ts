export type Paso = {
  t: number
  agente: string
  tipo: string
  modelo: string
  entrada: number
  cache: number
  salida: number
}
export type Limites = {
  ctx: number
  ventana: number
  pct: number
  cinco: number | null
  semana: number | null
  usd: number | null
  modelo: string
}
declare module 'claude-code' {
  interface PluginState {
    'becario-mods': { pasos: Shaped<Paso[]>; limites: Shaped<Limites>; portero: Shaped<string[]> }
  }
}
