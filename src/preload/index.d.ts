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
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
