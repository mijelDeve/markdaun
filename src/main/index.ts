import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  desktopCapturer,
  screen,
} from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import log from "electron-log/main";
import * as fs from "fs";
import simpleGit from "simple-git";
import { homedir } from "os";
import { exec, spawn } from "child_process";

function initialize(): void {
  log.initialize();
  log.transports.file.level = "info";
  log.transports.console.level = "debug";
}

initialize();

log.info("App starting...");

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    log.info("Main window shown");
  });

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:maximized-changed", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:maximized-changed", false);
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  ipcMain.on("window:minimize", () => {
    mainWindow.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on("window:close", () => {
    mainWindow.close();
  });

  ipcMain.handle("window:isMaximized", () => {
    return mainWindow.isMaximized();
  });

  ipcMain.on("window:setBackgroundMaterial", (_, material: string) => {
    try {
      mainWindow.setBackgroundMaterial(material as any);
      log.info(`Background material set to: ${material}`);
    } catch (error) {
      log.error("Error setting background material:", error);
    }
  });

  ipcMain.handle("desktop:getBackground", async () => {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const scaleFactor = primaryDisplay.scaleFactor;

      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: {
          width: Math.floor(width * scaleFactor),
          height: Math.floor(height * scaleFactor),
        },
      });

      if (sources.length > 0) {
        const primarySource = sources[0];
        return primarySource.thumbnail.toDataURL();
      }
      return null;
    } catch (error) {
      log.error("Error getting desktop background:", error);
      return null;
    }
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.markdaun.app");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.handle("dialog:openFile", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "txt"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const content = fs.readFileSync(filePath, "utf-8");
      return { filePath, content };
    }
    return null;
  });

  ipcMain.handle("dialog:openFolder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      return { folderPath };
    }
    return null;
  });

  ipcMain.handle("dialog:openImage", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"],
        },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle("folder:getTree", async (_, folderPath: string) => {
    try {
      interface FileNode {
        name: string;
        path: string;
        isDirectory: boolean;
        children?: FileNode[];
      }

      function getDirTree(dirPath: string): FileNode[] {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        return items
          .filter((item) => !item.name.startsWith("."))
          .sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          })
          .map((item) => {
            const fullPath = join(dirPath, item.name);
            const node: FileNode = {
              name: item.name,
              path: fullPath,
              isDirectory: item.isDirectory(),
            };
            if (item.isDirectory()) {
              node.children = getDirTree(fullPath);
            }
            return node;
          });
      }

      return getDirTree(folderPath);
    } catch (error) {
      log.error("Error reading folder tree:", error);
      return [];
    }
  });

  ipcMain.handle("file:read", async (_, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return content;
    } catch (error) {
      log.error("Error reading file:", error);
      return null;
    }
  });

  ipcMain.handle(
    "folder:create",
    async (_, parentPath: string, folderName: string) => {
      try {
        const newFolderPath = join(parentPath, folderName);
        if (fs.existsSync(newFolderPath)) {
          return {
            success: false,
            error: "Ya existe una carpeta con ese nombre",
          };
        }
        fs.mkdirSync(newFolderPath);
        return { success: true, path: newFolderPath };
      } catch (error) {
        log.error("Error creating folder:", error);
        return { success: false, error: "Error al crear la carpeta" };
      }
    },
  );

  ipcMain.handle(
    "file:create",
    async (_, parentPath: string, fileName: string) => {
      try {
        const fullFileName = fileName.endsWith(".md")
          ? fileName
          : `${fileName}.md`;
        const newFilePath = join(parentPath, fullFileName);
        if (fs.existsSync(newFilePath)) {
          return {
            success: false,
            error: "Ya existe un archivo con ese nombre",
          };
        }
        fs.writeFileSync(newFilePath, "", "utf-8");
        return { success: true, path: newFilePath };
      } catch (error) {
        log.error("Error creating file:", error);
        return { success: false, error: "Error al crear el archivo" };
      }
    },
  );

  ipcMain.handle(
    "item:delete",
    async (_, itemPath: string, isDirectory: boolean) => {
      try {
        if (!fs.existsSync(itemPath)) {
          return { success: false, error: "El elemento no existe" };
        }

        if (isDirectory) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(itemPath);
        }

        return { success: true };
      } catch (error) {
        log.error("Error deleting item:", error);
        return { success: false, error: "Error al eliminar el elemento" };
      }
    },
  );

  ipcMain.handle("image:getBase64", async (_, imagePath: string) => {
    try {
      if (!fs.existsSync(imagePath)) {
        return { success: false, error: "La imagen no existe" };
      }

      const ext = imagePath.split(".").pop()?.toLowerCase() || "png";
      const mimeType = ext === "jpg" ? "jpeg" : ext;
      const buffer = fs.readFileSync(imagePath);
      const base64 = buffer.toString("base64");
      return {
        success: true,
        dataUrl: `data:image/${mimeType};base64,${base64}`,
      };
    } catch (error) {
      log.error("Error reading image:", error);
      return { success: false, error: "Error al leer la imagen" };
    }
  });

  ipcMain.handle("file:save", async (_, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, "utf-8");
      return true;
    } catch (error) {
      log.error("Error saving file:", error);
      return false;
    }
  });

  ipcMain.handle("dialog:saveFile", async (_, defaultPath?: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePath) {
      return result.filePath;
    }
    return null;
  });

  // Git handlers
  const gitConfigPath = join(app.getPath("userData"), "git-config.json");

  ipcMain.handle("git:getConfig", async () => {
    try {
      if (fs.existsSync(gitConfigPath)) {
        return JSON.parse(fs.readFileSync(gitConfigPath, "utf-8"));
      }
      return null;
    } catch (error) {
      log.error("Error reading git config:", error);
      return null;
    }
  });

  ipcMain.handle(
    "git:setConfig",
    async (
      _,
      config: {
        sshKeyPath: string;
        sshKeyContent: string;
        repoUrl: string;
        lastFolderPath?: string;
      },
    ) => {
      try {
        // Si hay contenido de clave SSH, guardarlo en un archivo temporal
        if (config.sshKeyContent) {
          const sshDir = join(app.getPath("userData"), "ssh");
          if (!fs.existsSync(sshDir)) {
            fs.mkdirSync(sshDir, { recursive: true });
          }
          const keyPath = join(sshDir, "id_rsa");
          fs.writeFileSync(keyPath, config.sshKeyContent, { mode: 0o600 });
          config.sshKeyPath = keyPath;
          config.sshKeyContent = ""; // No guardar el contenido, solo la ruta
        }
        fs.writeFileSync(gitConfigPath, JSON.stringify(config, null, 2));
        return true;
      } catch (error) {
        log.error("Error saving git config:", error);
        return false;
      }
    },
  );

  // Función helper para obtener el comando SSH con la ruta correcta de Git for Windows
  function getGitSshCommand(keyPath: string): string {
    const normalizedKeyPath = keyPath.replace(/\\/g, "/");

    // Rutas comunes de Git SSH en Windows
    const gitSshPaths = [
      "C:/Program Files/Git/usr/bin/ssh.exe",
      "C:/Program Files (x86)/Git/usr/bin/ssh.exe",
      "C:/Git/usr/bin/ssh.exe",
    ];

    for (const sshPath of gitSshPaths) {
      if (fs.existsSync(sshPath)) {
        log.info("Usando SSH de Git for Windows:", sshPath);
        return `"${sshPath}" -i "${normalizedKeyPath}" -o StrictHostKeyChecking=no`;
      }
    }

    // Fallback: usar SSH del sistema (PATH)
    log.info("Usando SSH del sistema");
    return `ssh -i "${normalizedKeyPath}" -o StrictHostKeyChecking=no`;
  }

  ipcMain.handle("git:testConnection", async (_, folderPath?: string) => {
    try {
      const config = JSON.parse(fs.readFileSync(gitConfigPath, "utf-8"));
      const targetPath = folderPath || config.lastFolderPath;

      if (!targetPath || !fs.existsSync(targetPath)) {
        return {
          connected: false,
          error:
            "No hay carpeta seleccionada. Abre una carpeta o clona un repositorio primero.",
        };
      }

      const git = simpleGit(targetPath);

      if (config.sshKeyPath && fs.existsSync(config.sshKeyPath)) {
        const sshCommand = getGitSshCommand(config.sshKeyPath);
        log.info("Comando SSH configurado:", sshCommand);
        git.env("GIT_SSH_COMMAND", sshCommand);
      }

      const isRepo = await git.checkIsRepo();

      if (!isRepo) {
        // Hacer git init
        await git.init();
        log.info("Inicializado repositorio Git en: " + targetPath);
      }

      // Añadir remoto si hay URL configurada
      if (config.repoUrl) {
        try {
          await git.addRemote("origin", config.repoUrl);
        } catch (e) {
          // El remoto ya existe, está bien
        }

        // Intentar fetch para verificar conexión SSH
        try {
          await git.fetch("origin", "--dry-run");
          return {
            connected: true,
            initialized: !isRepo,
            currentBranch: await git.branch(),
            message: isRepo
              ? "Conectado al repositorio remoto"
              : "Repositorio inicializado y conectado al remoto",
          };
        } catch (fetchError) {
          const errorMsg = String(fetchError);
          if (
            errorMsg.includes("Authentication") ||
            errorMsg.includes("Permission")
          ) {
            return {
              connected: false,
              error: "Error de autenticación SSH. Verifica tu clave SSH.",
            };
          }
          return {
            connected: false,
            error: "No se puede conectar al remoto: " + errorMsg,
          };
        }
      }

      return {
        connected: true,
        initialized: !isRepo,
        currentBranch: await git.branch(),
        message: isRepo
          ? "Repositorio Git local"
          : "Repositorio Git inicializado",
      };
    } catch (error) {
      log.error("Error testing git connection:", error);
      return { connected: false, error: String(error) };
    }
  });

  ipcMain.handle(
    "git:clone",
    async (_, repoUrl: string, targetPath: string) => {
      try {
        const config = JSON.parse(fs.readFileSync(gitConfigPath, "utf-8"));
        const git = simpleGit();

        if (config.sshKeyPath && fs.existsSync(config.sshKeyPath)) {
          git.env("GIT_SSH_COMMAND", getGitSshCommand(config.sshKeyPath));
        }

        await git.clone(repoUrl, targetPath);
        log.info(`Cloned repo to ${targetPath}`);
        return { success: true };
      } catch (error) {
        log.error("Error cloning repo:", error);
        return { success: false, error: String(error) };
      }
    },
  );

  ipcMain.handle("git:pull", async (_, repoPath: string) => {
    try {
      const config = JSON.parse(fs.readFileSync(gitConfigPath, "utf-8"));
      const git = simpleGit(repoPath);

      if (config.sshKeyPath && fs.existsSync(config.sshKeyPath)) {
        git.env("GIT_SSH_COMMAND", getGitSshCommand(config.sshKeyPath));
      }

      const result = await git.pull();
      log.info(`Pulled to ${repoPath}`);
      return { success: true, result };
    } catch (error) {
      log.error("Error pulling:", error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle("git:push", async (_, repoPath: string) => {
    try {
      const config = JSON.parse(fs.readFileSync(gitConfigPath, "utf-8"));
      const git = simpleGit(repoPath);

      if (config.sshKeyPath && fs.existsSync(config.sshKeyPath)) {
        git.env("GIT_SSH_COMMAND", getGitSshCommand(config.sshKeyPath));
      }

      const result = await git.push();
      log.info(`Pushed from ${repoPath}`);
      return { success: true, result };
    } catch (error) {
      log.error("Error pushing:", error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle("git:status", async (_, repoPath: string) => {
    try {
      const git = simpleGit(repoPath);
      const status = await git.status();

      // Convertir a objeto simple para poder serializar por IPC
      return {
        current: status.current || null,
        tracking: status.tracking || null,
        staged: status.staged || [],
        modified: status.modified || [],
        deleted: status.deleted || [],
        untracked: status.untracked || [],
        ahead: status.ahead || 0,
        behind: status.behind || 0,
      };
    } catch (error) {
      log.error("Error getting status:", error);
      return null;
    }
  });

  ipcMain.handle("git:commit", async (_, repoPath: string, message: string) => {
    try {
      const git = simpleGit(repoPath);
      await git.add(".");
      const result = await git.commit(message);
      log.info(`Committed to ${repoPath}: ${message}`);
      return { success: true, result };
    } catch (error) {
      log.error("Error committing:", error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle("git:diff", async (_, repoPath: string) => {
    try {
      const git = simpleGit(repoPath);
      const diff = await git.diff();
      return diff;
    } catch (error) {
      log.error("Error getting diff:", error);
      return "";
    }
  });

  ipcMain.handle("git:branches", async (_, repoPath: string) => {
    try {
      const git = simpleGit(repoPath);
      const branches = await git.branch();

      // Convertir a objeto simple
      return {
        current: branches.current || "",
        all: branches.all || [],
        branches: branches.branches || {},
      };
    } catch (error) {
      log.error("Error getting branches:", error);
      return null;
    }
  });

  // Handler para ejecutar comandos del sistema
  ipcMain.handle("system:exec", async (_, command: string, cwd?: string) => {
    return new Promise((resolve) => {
      const workDir = cwd || process.cwd();
      log.info(`Executing command: ${command} in ${workDir}`);

      // Usar PowerShell en Windows, bash en Linux/Mac
      const isWindows = process.platform === "win32";

      let finalCommand: string;
      if (isWindows) {
        // Envolvemos el comando para PowerShell
        finalCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${command.replace(/"/g, '\\"')}"`;
      } else {
        finalCommand = command;
      }

      exec(
        finalCommand,
        { cwd: workDir, maxBuffer: 1024 * 1024 * 10 },
        (error, stdout, stderr) => {
          if (error) {
            log.error(`Command error: ${error.message}`);
            resolve({
              success: false,
              output: stderr || error.message,
              error: error.message,
            });
          } else {
            resolve({
              success: true,
              output: stdout,
            });
          }
        },
      );
    });
  });

  // Theme config handlers
  const themeConfigPath = join(app.getPath("userData"), "theme-config.json");

  ipcMain.handle("theme:getConfig", async () => {
    try {
      if (fs.existsSync(themeConfigPath)) {
        return JSON.parse(fs.readFileSync(themeConfigPath, "utf-8"));
      }
      return null;
    } catch (error) {
      log.error("Error reading theme config:", error);
      return null;
    }
  });

  ipcMain.handle("theme:setConfig", async (_, config) => {
    try {
      fs.writeFileSync(themeConfigPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      log.error("Error saving theme config:", error);
      return false;
    }
  });

  ipcMain.handle("theme:getConfigFile", async () => {
    try {
      const userDataPath = app.getPath("userData");
      return join(userDataPath, "theme-config.json");
    } catch (error) {
      log.error("Error getting config file path:", error);
      return null;
    }
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  log.info("All windows closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});
