# Prompt para generar documentación de Markdaun

Crea una documentación completa y profesional para un proyecto de escritorio llamado "Markdaun" - un editor y visor de Markdown con integración Git. El proyecto está construido con Electron, React, TypeScript y TailwindCSS.

## Descripción del proyecto

Markdaun es un editor de Markdown de escritorio inspirado en Obsidian, con funcionalidades avanzadas de edición, gestión de archivos y control de versiones con Git.

## Características principales

### Editor y Vista Previa

- Editor de Markdown con vista dividida (editor + preview)
- Scroll sincronizado bidireccional entre editor y preview
- Soporte completo de GitHub Flavored Markdown (GFM): tablas, checkboxes, código con resaltado de sintaxis
- Múltiples pestañas para trabajar con varios archivos simultáneamente

### Explorador de Archivos (Sidebar)

- Navegación al estilo Obsidian con estructura de árbol
- Botón para cerrar todas las carpetas expandidas
- Botón para encontrar y expandir automáticamente hasta el archivo activo
- Click derecho (menú contextual) con opciones:
  - Crear nueva carpeta
  - Crear nuevo archivo
  - Eliminar (con diálogo de confirmación)
- Muestra todos los tipos de archivos (no solo .md)

### Gestión de Imágenes

- Imágenes desde URLs externas: `![alt](https://...)`
- Wiki-links embebidos (estilo Obsidian): `![[imagen.png]]`
- Botón integrado en la toolbar para insertar imágenes
- Selector de archivos nativo del sistema
- Las imágenes locales se cargan como base64 para evitar restricciones de seguridad
- Las rutas de imágenes se resuelven desde la raíz del proyecto

### Integración Git

- Clone: Clonar repositorios remotos
- Pull: Descargar cambios del remoto
- Push: Subir cambios al remoto
- Commit: Guardar cambios locales con mensaje
- Autenticación SSH: Configurar clave SSH (ruta al archivo o contenido directo)

### Terminal Integrada

- Ejecuta comandos PowerShell directamente desde la barra de estado
- Historial de comandos con flechas ↑↓

### Temas

- Modo claro y modo oscuro
- Persistencia de preferencias en localStorage

## Stack tecnológico

- Electron (framework de escritorio)
- React 18 (biblioteca UI)
- TypeScript (tipado estático)
- Vite (build tool)
- TailwindCSS (estilos)
- react-markdown + remark-gfm (renderizado Markdown)
- react-syntax-highlighter (resaltado de código)
- @flowershow/remark-wiki-link (soporte wiki-links)
- simple-git (cliente Git)
- electron-log (logging)
- lucide-react (iconos)

## Estructura del proyecto

```
markdaun/
├── src/
│   ├── main/           # Proceso principal Electron
│   │   └── index.ts    # Handlers IPC, logging
│   ├── preload/        # Scripts preload para IPC
│   │   ├── index.ts    # API expuesta al renderer
│   │   └── index.d.ts  # Definiciones de tipos
│   └── renderer/      # Aplicación React
│       └── src/
│           ├── App.tsx      # Componente principal
│           ├── components/
│           │   ├── Sidebar.tsx    # Explorador de archivos
│           │   ├── GitPanel.tsx   # Panel de configuración Git
│           │   └── GitStatusBar.tsx
│           └── lib/utils.ts
├── electron-builder.json
├── package.json
└── README.md
```

## Instalación

- Windows: Ejecutable portable o build desde código fuente
- Linux: AppImage, .deb, .rpm
- macOS: .dmg

## Comandos

- `npm run dev` - Modo desarrollo
- `npm run build` - Build producción
- `npm run build:unpack` - Generar ejecutable sin empaquetar
- `npm run build:win` - Generar instalador Windows

## Audiencia objetivo

Editores de texto, escritores, desarrolladores y usuarios que necesitan un editor de Markdown con gestión de archivos al estilo Obsidian y control de versiones integrado.

---

Genera una documentación en formato Markdown que incluya:

1. Una página de inicio atractiva con badges y descripción
2. Una sección de características con explicación detallada
3. Guía de uso con capturas de pantalla o diagramas ASCII
4. Guía de instalación para cada plataforma
5. Sección de configuración y atajos de teclado
6. FAQ o preguntas frecuentes
7. Cómo contribuir al proyecto
8. Licencia

La documentación debe ser clara, concisa y útil tanto para principiantes como para usuarios avanzados. Usa un tono profesional pero accesible.
