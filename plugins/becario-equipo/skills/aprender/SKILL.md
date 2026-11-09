---
name: aprender
description: Propone de 0 a 3 lecciones de esta sesión y las guarda si dices que sí.
disable-model-invocation: true
argument-hint: "[lección concreta, opcional]"
---

# Equipo · apuntar lo aprendido

Si la persona ha escrito una lección concreta, propón esa (bien redactada): $ARGUMENTS

Si no, repasa esta conversación. Hablas en español claro, de tú.

## Apuntar lo aprendido

Claude Code carga al abrir cada sesión los archivos de `.claude/rules/` del proyecto. Por eso las lecciones van en `.claude/rules/lecciones-equipo.md`: la próxima vez, Claude las tiene delante sin que nadie se las recuerde.

**Qué es una lección:** algo propio de **este proyecto** que ha costado descubrir y que volvería a pasar. Por ejemplo:
- «Las pruebas se ejecutan con `npm run test:unit`; `npm test` también lanza las de navegador y tarda 4 minutos.»
- «Las pruebas solo se encuentran con `python3 -m unittest discover -s tests`; sin `-s tests` ejecuta 0 pruebas.»
- «Las fechas de la API llegan en UTC; el formulario las enseña en hora local.»
- «No tocar `config/legacy.js`: lo usa la app móvil antigua.»

**No es una lección:** un fallo del código que se va a corregir (eso va en pendientes, no en lecciones), lo que ya dice el código a simple vista, conocimiento general del lenguaje («`\d` acepta dígitos Unicode»), una opinión, algo de un solo día, rutas absolutas o nombres de tu ordenador, ni ningún secreto (claves, contraseñas, datos personales). En un proyecto recién creado, lo normal es **ninguna** lección.

**Cada lección necesita una prueba de esta sesión:** algo que has visto fallar, que has comprobado ejecutándolo o que te ha dicho la persona. Nada de afirmaciones del tipo «no hay X» o «no existe Y» si no lo has comprobado.

**Cómo se apunta:**
1. Propón **de 0 a 3 lecciones**, de una línea cada una. Si no hay nada que valga la pena, di «No hay lecciones nuevas» y termina.
2. Pregunta con esta frase, **literal**: «¿Guardo estas lecciones en `.claude/rules/lecciones-equipo.md`? (sí / no / solo algunas)». Solo después de un sí, escríbelas. Esa pregunta es lo último que escribes.
3. Si el archivo no existe, créalo (y la carpeta `.claude/rules/` si hace falta) con esta cabecera:

```markdown
# Lecciones del equipo
Lo propio de este proyecto que hemos aprendido. Una línea por lección, la más reciente arriba. Máximo 30 lecciones.

```

4. Cada lección, en una línea: `- AAAA-MM-DD · <lección>` (la fecha de hoy). La más reciente, arriba.
5. **Máximo 30 lecciones** (sin contar la cabecera). Si ya hay 30, propón cuáles juntar o quitar antes de añadir. Así el archivo no crece ni se come el contexto.
6. Si una lección nueva contradice una antigua, sustituye la antigua.
7. Si el proyecto usa git, el archivo se puede subir al repositorio para que lo tenga todo el equipo. Si la persona no quiere, que lo añada a `.gitignore`.
