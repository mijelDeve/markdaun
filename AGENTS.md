# Markdaun - Visor/Editor de Markdown

## Proyecto Electron + React + TypeScript

### Stack

- **electron-vite**: Build tool
- **React 18**: UI framework
- **TailwindCSS**: Estilos
- **react-markdown + remark-gfm**: Renderizado Markdown
- **react-syntax-highlighter**: Resaltado de código

### Comandos

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run build:win # Generar instalador Windows
```

### Estructura

```
src/
├── main/         # Proceso principal Electron
├── preload/     # Scripts IPC bridge
└── renderer/    # React app
```

### Características implementadas

- Abrir archivos/carpetas .md
- Editor + Vista previa (split view)
- Múltiples pestañas
- Temas light/dark
- Guardar archivos
- Resaltado de sintaxis en código
- Soporte GFM (tablas, checkboxes, etc)

### Notas

- Window management configurado en `src/main/index.ts`
- IPC handlers para dialogs y file system
- Logging con `electron-log` en main process
