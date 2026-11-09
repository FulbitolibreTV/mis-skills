# becario-kit

Plugin para Claude Code con un solo comando, **`/kit`**, que instala y comprueba paso a paso estos 5 plugins:

1. **Playwright** (de Microsoft): Claude abre el navegador, mira la web que ha hecho y prueba los botones.
2. **Frontend Design** (de Anthropic): interfaces con criterio, que no parecen todas la misma plantilla.
3. **MemPalace**: memoria de tu proyecto guardada en tu ordenador.
4. **Headroom**: recorta lo que sobra antes de mandarlo a Claude (se usa desde la terminal).
5. **MODS** (becario-mods v1.3, viene dentro): portero, vigilante de caché y panel `/consumo`.

Pide permiso antes de cada paso, se salta lo que ya tienes y termina con una tabla de lo que ha quedado instalado. `/kit comprobar` solo revisa; `/kit deshacer` lo quita.

Instalación y todos los detalles (qué lee y qué guarda cada uno): `GUIA.md`.

Licencia MIT. Hecho por El Becario de Murphy IA.
