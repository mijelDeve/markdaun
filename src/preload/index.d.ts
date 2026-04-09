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

export interface ElectronAPI {
  openFile: () => Promise<FileData | null>;
  openFolder: () => Promise<FolderData | null>;
  openImageDialog: () => Promise<string | null>;
  getFolderTree: (folderPath: string) => Promise<FileNode[]>;
  createFolder: (
    parentPath: string,
    folderName: string,
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  createFile: (
    parentPath: string,
    fileName: string,
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  deleteItem: (
    itemPath: string,
    isDirectory: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  getImageBase64: (
    imagePath: string,
  ) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  saveFile: (filePath: string, content: string) => Promise<boolean>;
  readFile: (filePath: string) => Promise<string | null>;
  saveFileDialog: (defaultPath?: string) => Promise<string | null>;

  // Git API
  gitGetConfig: () => Promise<GitConfig | null>;
  gitSetConfig: (config: GitConfig) => Promise<boolean>;
  gitTestConnection: () => Promise<GitConnectionTest>;
  gitClone: (
    repoUrl: string,
    targetPath: string,
  ) => Promise<{ success: boolean; error?: string }>;
  gitPull: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
  gitPush: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
  gitStatus: (repoPath: string) => Promise<GitStatus | null>;
  gitCommit: (
    repoPath: string,
    message: string,
  ) => Promise<{ success: boolean; error?: string }>;
  gitDiff: (repoPath: string) => Promise<string>;
  gitBranches: (repoPath: string) => Promise<GitBranchResult | null>;
  execCommand: (
    command: string,
    cwd?: string,
  ) => Promise<{ success: boolean; output: string; error?: string }>;

  // Theme API
  themeGetConfig: () => Promise<ThemeConfig | null>;
  themeSetConfig: (config: ThemeConfig) => Promise<boolean>;
  themeGetConfigPath: () => Promise<string | null>;

  // Window controls
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  windowIsMaximized: () => Promise<boolean>;
  onWindowMaximizedChange: (
    callback: (isMaximized: boolean) => void,
  ) => () => void;

  // Desktop background
  getDesktopBackground: () => Promise<string | null>;

  // Background material (Mica/Acrylic/Tabbed)
  setBackgroundMaterial: (material: string) => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
