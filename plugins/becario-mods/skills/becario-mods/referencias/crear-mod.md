# Receta para crear tu propio mod

Hace falta Claude Code v2.1.287 o posterior (terminal o pestaña Code de la app de escritorio). Lo más fácil es pedírselo a Claude Code con tus palabras («hazme un mod que…»), porque trae la skill `plugin-authoring`, que sabe escribirlos y probarlos. Documentación oficial: https://code.claude.com/docs/es/plugins/mods/create

Si lo haces a mano, un mod son tres archivos dentro de una carpeta:

```
mi-mod/
├── .claude-plugin/plugin.json   { "name": "mi-mod", "version": "0.1.0", "description": "…" }
└── hooks/
    ├── hooks.json               { "modules": ["./register.js"] }
    └── register.js
```

Ejemplo de `register.js`, que cuenta las herramientas que usa Claude y lo enseña junto al indicador de actividad:

```js
let llamadas = 0
export function register(on) {
  on('tool.call', async ($, e, next) => {
    llamadas += 1
    $.ui.invalidate('ui.render')
    return next(e)
  })
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    return next({ ...e, props: { ...e.props, suffix: ' · herramientas: ' + llamadas + '…' } })
  })
}
```

Para probarlo:
1. `claude plugin validate ./mi-mod` revisa los archivos.
2. `claude --plugin-dir ./mi-mod` lo carga solo en esa sesión.

Ideas de mods útiles:
- Avisar antes de un comando peligroso.
- Enseñar el estado de algo junto al chat.
- Contar lo que gasta cada tarea.
- Añadir información al prompt cuando hable de cierto tema.

Seguridad: un mod corre con tus permisos y sin aislamiento. Puede leer tus archivos y tus claves, y gastar tu uso. Instala solo los de quien te fíes y, antes, revisa qué hace con `claude plugin validate`.
