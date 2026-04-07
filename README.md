# Markdaun

Editor y visor de Markdown para escritorio con integración Git.

![Electron](https://img.shields.io/badge/Electron-3B4252?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)

## Características

- **Editor de Markdown**: Edita y visualiza archivos .md con vista dividida (editor + preview)
- **Explorador de archivos**: Navega por tu carpeta de documentos en una barra lateral al estilo Obsidian
- **Integración Git**: Clone, pull, push y commit directamente desde la aplicación
- **Autenticación SSH**: Configura tu clave SSH paraGit (ruta o contenido)
- **Terminal integrada**: Ejecuta comandos PowerShell directamente en la barra de estado
- **Soporte GFM**: Tablas, checkboxes, código con resaltado de sintaxis
- **Temas claro/oscuro**: Cambio de tema con persistencia de preferencias
- **Múltiples pestañas**: Trabaja con varios archivos simultáneamente

## Capturas de pantalla

### Modo Claro

```
┌─────────────────────────────────────────────────────────┐
│ 📁 MiRepositorio  🌿 main → origin/main  ✓  🖥️        │
├────────────┬────────────────────────────────────────────┤
│ 📂 raíz    │  # Título del Documento                    │
│ └─ 📄 uno  │                                            │
│ └─ 📄 dos  │  Este es un **texto** con markdown.       │
│            │                                            │
│            │ ## Sección                               │
│            │ - Item 1                                  │
│            │ - Item 2                                  │
├────────────┴────────────────────────────────────────────┤
│ [Editar] [Vista Previa]                                 │
└─────────────────────────────────────────────────────────┘
```

### Modo Oscuro

El modo oscuro utiliza una paleta de colores optimizada para reducir la fatiga visual durante sesiones de trabajo prolongadas.

## Instalación

### Windows

#### Opción 1: Ejecutable portable (recomendado)

1. Descarga el archivo `Markdaun-1.0.0-Portable.zip` o el ejecutable `Markdaun.exe` de la sección de releases
2. Extrae el ZIP si es necesario
3. Ejecuta `Markdaun.exe` directamente - no requiere instalación

#### Opción 2: Construir desde código fuente

1. Asegúrate de tener instalado:
   - [Node.js 18+](https://nodejs.org/)
   - [Git](https://git-scm.com/)
2. Clona el repositorio:
   ```bash
   git clone https://github.com/markdaun/markdaun.git
   cd markdaun
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Construye la aplicación:
   ```bash
   npm run build
   ```
5. El ejecutable se encontrará en `dist/win-unpacked/Markdaun.exe`

### Linux

#### Requisitos previos

- Node.js 18+
- Git
- npm o yarn

#### Pasos para instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/markdaun/markdaun.git
   cd markdaun
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Construye la aplicación:

   ```bash
   npm run build
   ```

4. Genera el ejecutable para Linux:

   ```bash
   npm run build:linux
   ```

5. El archivo AppImage se encontrará en la carpeta `dist/`

#### Ejecutar en modo desarrollo

```bash
npm run dev
```

#### Notas adicionales para Linux

- En algunas distribuciones puede ser necesario instalar dependencias adicionales:

  ```bash
  # Debian/Ubuntu
  sudo apt-get install libgtk-3-0 libnss3 libxss1 libasound2

  # Fedora
  sudo dnf install gtk3 nss xss alsa-lib
  ```

- Para hacer el ejecutable portable, puedes ejecutar directamente:
  ```bash
  ./dist/linux-unpacked/Markdaun
  ```

### macOS

1. Clona el repositorio:

   ```bash
   git clone https://github.com/markdaun/markdaun.git
   cd markdaun
   ```

2. Instala las dependencias y construye:

   ```bash
   npm install
   npm run build:mac
   ```

3. El archivo .dmg se encontrará en la carpeta `dist/`

## Uso

### Abrir archivos/carpetas

1. Haz clic en "Abrir archivo" o "Abrir carpeta" desde el menú
2. Navega por el explorador lateral para seleccionar archivos .md

### Integración Git

1. Abre el panel de Git desde el menú o la barra de estado
2. Configura la URL del repositorio remoto
3. Ingresa tu clave SSH (ruta al archivo o contenido directo)
4. Ejecuta operaciones Git:
   - **Clone**: Clona un repositorio remoto
   - **Pull**: Descarga cambios del remoto
   - **Push**: Sube cambios al remoto
   - **Commit**: Guarda cambios locales

### Terminal

1. Haz clic en el ícono de terminal en la barra de estado
2. Escribe comandos PowerShell
3. Usa las flechas ↑↓ para navegar el historial

### Temas

- Haz clic en el ícono de sol/luna para alternar entre modo claro y oscuro
- El tema se guarda automáticamente en localStorage

## Comandos disponibles

| Comando               | Descripción                |
| --------------------- | -------------------------- |
| `npm run dev`         | Iniciar desarrollo         |
| `npm run build`       | Construir aplicación       |
| `npm run build:win`   | Generar instalador Windows |
| `npm run build:mac`   | Generar instalador macOS   |
| `npm run build:linux` | Generar instalador Linux   |
| `npm run lint`        | Verificar código           |
| `npm run typecheck`   | Verificar tipos            |

## Estructura del proyecto

```
markdaun/
├── src/
│   ├── main/           # Proceso principal Electron
│   │   └── index.ts   # Entry point, handlers IPC, logging
│   ├── preload/       # Scripts de preload para IPC
│   │   └── index.ts   # API expuesta al renderer
│   └── renderer/      # Aplicación React
│       ├── src/
│       │   ├── App.tsx          # Componente principal
│       │   ├── index.css        # Variables CSS y temas
│       │   ├── main.tsx         # Entry point React
│       │   └── components/
│       │       ├── Sidebar.tsx      # Explorador de archivos
│       │       ├── Editor.tsx       # Editor markdown
│       │       ├── Preview.tsx      # Vista previa
│       │       ├── GitPanel.tsx     # Panel de configuración Git
│       │       └── GitStatusBar.tsx # Barra de estado con terminal
│       └── index.html
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## Tecnologías utilizadas

- **Electron**: Framework de escritorio
- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool
- **TailwindCSS**: Estilos
- **react-markdown**: Renderizado de markdown
- **remark-gfm**: Soporte GitHub Flavored Markdown
- **react-syntax-highlighter**: Resaltado de sintaxis
- **simple-git**: Cliente Git
- **electron-log**: Logging
- **lucide-react**: Iconos

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## Licencia

MIT
