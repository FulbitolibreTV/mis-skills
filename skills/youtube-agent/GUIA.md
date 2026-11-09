# YouTube Agent — guía rápida (español)

Este paquete reúne 11 skills de ayuda editorial para YouTube: guiones, títulos y miniaturas, cortes, capítulos, retención, Shorts, SEO, comentarios, planeación, auditoría y análisis de vídeos destacados.

## Si instalas el paquete como plugin en Claude Code

Usa el archivo `youtube-agent-skill-main-corregido.zip`, que contiene `.claude-plugin/`, `skills/`, `templates/` y las herramientas originales. Alternativamente, extrae los archivos como un plugin de Claude Code. Los comandos dependen de la instalación y versión de Claude.

## Si lo subes como una skill individual a Claude (web o aplicación)

Usa **`youtube-agent-skill-claude.zip`**. Contiene un `SKILL.md` principal que remite a los once módulos. Si la aplicación no permite importar ZIP, abre sus opciones de personalización desde la web o consulta la ayuda actual de Claude.

## Cómo usarlo

Pide, por ejemplo: «Escribe cinco hooks para un video sobre [tema] y prepara un guion», «Analiza este CSV de retención», «Propón títulos y textos de miniatura», «Encuentra momentos aptos para Shorts en este SRT», o «Haz una auditoría de mi canal».

## Importante

- Este paquete no publica videos ni se conecta a tu cuenta de YouTube.
- Los scripts de Python se ejecutan solo cuando tu entorno de Claude tiene capacidad de ejecutar código. Sin ella, los módulos sirven como instrucciones y plantillas.
- Para analizar retención, subtítulos o métricas reales, aporta los archivos correspondientes. No se deben inventar cifras.
- El autor original del proyecto y la licencia MIT se conservan en `LICENSE` y `README.md`.
