import { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  GitPullRequest,
  GitCommit,
  Save,
  RefreshCw,
  Upload,
  Download,
  X,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  Terminal,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type GitConfig = {
  sshKeyPath: string;
  sshKeyContent: string;
  repoUrl: string;
  lastFolderPath?: string;
};

type GitStatus = {
  current: string | null;
  tracking: string | null;
  staged: string[];
  modified: string[];
  deleted: string[];
  untracked: string[];
  ahead: number;
  behind: number;
};

type GitPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string | null;
  onFolderChange: (path: string) => void;
  onRefreshTree: () => void;
  onGitConnectSuccess?: () => void;
};

export function GitPanel({
  isOpen,
  onClose,
  currentFolder,
  onFolderChange,
  onRefreshTree,
  onGitConnectSuccess,
}: GitPanelProps) {
  const [config, setConfig] = useState<GitConfig>({
    sshKeyPath: "",
    repoUrl: "",
  });
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitInput, setShowCommitInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && currentFolder) {
      loadStatus();
    }
  }, [isOpen, currentFolder]);

  const loadConfig = async () => {
    const savedConfig = await window.api.gitGetConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  };

  const loadStatus = async () => {
    if (!currentFolder) return;
    const gitStatus = await window.api.gitStatus(currentFolder);
    setStatus(gitStatus);
  };

  const saveConfig = async () => {
    const success = await window.api.gitSetConfig({
      ...config,
      lastFolderPath: currentFolder || undefined,
    });
    if (success) {
      setMessage({ type: "success", text: "Configuración guardada" });
    } else {
      setMessage({ type: "error", text: "Error al guardar configuración" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const testConnection = async () => {
    setLoading(true);
    setMessage(null);
    const result = await window.api.gitTestConnection(
      currentFolder || undefined,
    );
    if (result.connected) {
      setMessage({
        type: "success",
        text:
          result.message ||
          `Conectado. Rama: ${result.currentBranch?.current || "?"}`,
      });
      // Notificar a App.tsx que la conexión fue exitosa
      if (onGitConnectSuccess) {
        setTimeout(() => onGitConnectSuccess(), 500);
      }
    } else {
      setMessage({
        type: "error",
        text: result.error || "Error de conexión",
      });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
    if (result.connected && currentFolder) {
      loadStatus();
    }
  };

  const handleClone = async () => {
    if (!config.repoUrl) {
      setMessage({ type: "error", text: "Ingresa la URL del repositorio" });
      return;
    }

    const result = await window.api.openFolder();
    if (!result?.folderPath) return;

    setLoading(true);
    setMessage(null);
    const cloneResult = await window.api.gitClone(
      config.repoUrl,
      result.folderPath,
    );

    if (cloneResult.success) {
      setMessage({ type: "success", text: "Repositorio clonado exitosamente" });
      onFolderChange(result.folderPath);
      onRefreshTree();
    } else {
      setMessage({
        type: "error",
        text: cloneResult.error || "Error al clonar",
      });
    }

    setLoading(false);
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePull = async () => {
    if (!currentFolder) return;

    setLoading(true);
    setMessage(null);
    const result = await window.api.gitPull(currentFolder);

    if (result.success) {
      setMessage({ type: "success", text: "Pull completado" });
      onRefreshTree();
    } else {
      setMessage({
        type: "error",
        text: result.error || "Error al hacer pull",
      });
    }

    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
    await loadStatus();
  };

  const handlePush = async () => {
    if (!currentFolder) return;

    setLoading(true);
    setMessage(null);
    const result = await window.api.gitPush(currentFolder);

    if (result.success) {
      setMessage({ type: "success", text: "Push completado" });
    } else {
      setMessage({
        type: "error",
        text: result.error || "Error al hacer push",
      });
    }

    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
    await loadStatus();
  };

  const handleCommit = async () => {
    if (!currentFolder || !commitMessage) return;

    setLoading(true);
    setMessage(null);
    const result = await window.api.gitCommit(currentFolder, commitMessage);

    if (result.success) {
      setMessage({ type: "success", text: "Commit realizado" });
      setCommitMessage("");
      setShowCommitInput(false);
      onRefreshTree();
    } else {
      setMessage({
        type: "error",
        text: result.error || "Error al hacer commit",
      });
    }

    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
    await loadStatus();
  };

  const handleSelectSshKey = async () => {
    const result = await window.api.openFile();
    if (result) {
      setConfig({ ...config, sshKeyPath: result.filePath });
    }
  };

  const isGitRepo = currentFolder ? status !== null : false;
  const hasChanges =
    isGitRepo &&
    ((status?.staged.length ?? 0) > 0 ||
      (status?.modified.length ?? 0) > 0 ||
      (status?.deleted.length ?? 0) > 0 ||
      (status?.untracked.length ?? 0) > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background/80 backdrop-blur-sm border rounded-lg w-[600px] max-h-[80vh] overflow-hidden flex flex-col border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Git</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Config Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Configuración
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ruta a clave SSH (ej: C:\Users\...\.ssh\id_rsa)"
                value={config.sshKeyPath}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sshKeyPath: e.target.value,
                    sshKeyContent: "",
                  })
                }
                className="flex-1 px-3 py-2 text-sm border rounded bg-background"
              />
              <Button variant="outline" size="sm" onClick={handleSelectSshKey}>
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">o</div>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Pegar clave SSH directamente (contenido del archivo)"
                value={config.sshKeyContent}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sshKeyContent: e.target.value,
                    sshKeyPath: "",
                  })
                }
                className="flex-1 px-3 py-2 text-sm border rounded bg-background"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="URL del repositorio (git@github.com:user/repo.git)"
                value={config.repoUrl}
                onChange={(e) =>
                  setConfig({ ...config, repoUrl: e.target.value })
                }
                className="flex-1 px-3 py-2 text-sm border rounded bg-background"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={saveConfig}>
                <Save className="w-4 h-4 mr-1" />
                Guardar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={loading}
              >
                <Terminal className="w-4 h-4 mr-1" />
                Probar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClone}
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-1" />
                Clonar
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded text-sm",
                message.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
              )}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}

          {/* Git Status */}
          {currentFolder && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Estado del repositorio
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadStatus}
                  disabled={loading}
                >
                  <RefreshCw
                    className={cn("w-4 h-4", loading && "animate-spin")}
                  />
                </Button>
              </div>

              {isGitRepo ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Rama: <strong>{status?.current}</strong>
                    </span>
                    {status?.ahead !== 0 && (
                      <span className="text-muted-foreground">
                        ↑{status?.ahead}
                      </span>
                    )}
                    {status?.behind !== 0 && (
                      <span className="text-muted-foreground">
                        ↓{status?.behind}
                      </span>
                    )}
                  </div>

                  {/* Changes */}
                  {(status?.staged.length ?? 0) > 0 && (
                    <div className="text-green-600">
                      Preparados: {status?.staged.join(", ")}
                    </div>
                  )}
                  {(status?.modified.length ?? 0) > 0 && (
                    <div className="text-yellow-600">
                      Modificados: {status?.modified.join(", ")}
                    </div>
                  )}
                  {(status?.untracked.length ?? 0) > 0 && (
                    <div className="text-gray-500">
                      Sin rastrear: {status?.untracked.join(", ")}
                    </div>
                  )}
                  {(status?.deleted.length ?? 0) > 0 && (
                    <div className="text-red-600">
                      Eliminados: {status?.deleted.join(", ")}
                    </div>
                  )}

                  {!hasChanges && (
                    <div className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Sin cambios
                    </div>
                  )}

                  {/* Commit Input */}
                  {showCommitInput ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Mensaje del commit"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border rounded bg-background"
                      />
                      <Button
                        size="sm"
                        onClick={handleCommit}
                        disabled={loading || !commitMessage}
                      >
                        <GitCommit className="w-4 h-4 mr-1" />
                        Commit
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCommitInput(true)}
                      disabled={!hasChanges}
                      className="mt-2"
                    >
                      <GitCommit className="w-4 h-4 mr-1" />
                      Commit
                    </Button>
                  )}

                  {/* Pull/Push */}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={handlePull} disabled={loading}>
                      <Download className="w-4 h-4 mr-1" />
                      Pull
                    </Button>
                    <Button size="sm" onClick={handlePush} disabled={loading}>
                      <Upload className="w-4 h-4 mr-1" />
                      Push
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  La carpeta actual no es un repositorio Git
                </div>
              )}
            </div>
          )}

          {!currentFolder && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Abre una carpeta para ver el estado de Git
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
