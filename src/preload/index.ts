import { contextBridge, ipcRenderer } from "electron";

export type FileData = {
  filePath: string;
  content: string;
};

export type FolderData = {
  folderPath: string;
};

export type FileNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
};

export type GitConfig = {
  sshKeyPath: string;
  sshKeyContent: string;
  repoUrl: string;
  lastFolderPath?: string;
};

export type GitStatus = {
  current: string | null;
  tracking: string | null;
  staged: string[];
  modified: string[];
  deleted: string[];
  untracked: string[];
  ahead: number;
  behind: number;
};

export type GitBranchResult = {
  current: string;
  all: string[];
  branches: Record<string, { current: boolean; name: string; commit: string }>;
};

export type GitConnectionTest = {
  connected: boolean;
  currentBranch?: GitBranchResult | null;
  error?: string;
  initialized?: boolean;
  message?: string;
};

export type ThemeConfig = {
  theme: "light" | "dark";
  backgroundMaterial: string;
  fontSize: number;
  fontFamily: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
    error: string;
    success: string;
    warning: string;
  };
};

const api = {
  openFile: (): Promise<FileData | null> =>
    ipcRenderer.invoke("dialog:openFile"),
  openFolder: (): Promise<FolderData | null> =>
    ipcRenderer.invoke("dialog:openFolder"),
  openImageDialog: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:openImage"),
  getFolderTree: (folderPath: string): Promise<FileNode[]> =>
    ipcRenderer.invoke("folder:getTree", folderPath),
  createFolder: (
    parentPath: string,
    folderName: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke("folder:create", parentPath, folderName),
  createFile: (
    parentPath: string,
    fileName: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke("file:create", parentPath, fileName),
  deleteItem: (
    itemPath: string,
    isDirectory: boolean,
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("item:delete", itemPath, isDirectory),
  getImageBase64: (
    imagePath: string,
  ): Promise<{ success: boolean; dataUrl?: string; error?: string }> =>
    ipcRenderer.invoke("image:getBase64", imagePath),
  saveFile: (filePath: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke("file:save", filePath, content),
  readFile: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke("file:read", filePath),
  saveFileDialog: (defaultPath?: string): Promise<string | null> =>
    ipcRenderer.invoke("dialog:saveFile", defaultPath),

  // Git API
  gitGetConfig: (): Promise<GitConfig | null> =>
    ipcRenderer.invoke("git:getConfig"),
  gitSetConfig: (config: GitConfig): Promise<boolean> =>
    ipcRenderer.invoke("git:setConfig", config),
  gitTestConnection: (folderPath?: string): Promise<GitConnectionTest> =>
    ipcRenderer.invoke("git:testConnection", folderPath),
  gitClone: (
    repoUrl: string,
    targetPath: string,
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("git:clone", repoUrl, targetPath),
  gitPull: (repoPath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("git:pull", repoPath),
  gitPush: (repoPath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("git:push", repoPath),
  gitStatus: (repoPath: string): Promise<GitStatus | null> =>
    ipcRenderer.invoke("git:status", repoPath),
  gitCommit: (
    repoPath: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("git:commit", repoPath, message),
  gitDiff: (repoPath: string): Promise<string> =>
    ipcRenderer.invoke("git:diff", repoPath),
  gitBranches: (repoPath: string): Promise<GitBranchResult | null> =>
    ipcRenderer.invoke("git:branches", repoPath),

  // System commands
  execCommand: (
    command: string,
    cwd?: string,
  ): Promise<{ success: boolean; output: string; error?: string }> =>
    ipcRenderer.invoke("system:exec", command, cwd),

  // Theme API
  themeGetConfig: (): Promise<ThemeConfig | null> =>
    ipcRenderer.invoke("theme:getConfig"),
  themeSetConfig: (config: ThemeConfig): Promise<boolean> =>
    ipcRenderer.invoke("theme:setConfig", config),
  themeGetConfigPath: (): Promise<string | null> =>
    ipcRenderer.invoke("theme:getConfigFile"),

  // Window controls
  windowMinimize: (): void => ipcRenderer.send("window:minimize"),
  windowMaximize: (): void => ipcRenderer.send("window:maximize"),
  windowClose: (): void => ipcRenderer.send("window:close"),
  windowIsMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke("window:isMaximized"),
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: any, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on("window:maximized-changed", handler);
    return () =>
      ipcRenderer.removeListener("window:maximized-changed", handler);
  },

  // Desktop background
  getDesktopBackground: (): Promise<string | null> =>
    ipcRenderer.invoke("desktop:getBackground"),

  // Background material (Mica/Acrylic/Tabbed)
  setBackgroundMaterial: (material: string): void =>
    ipcRenderer.send("window:setBackgroundMaterial", material),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api;
}
