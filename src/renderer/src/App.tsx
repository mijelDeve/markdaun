import { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Plus,
  FolderOpen,
  Save,
  Sun,
  Moon,
  FileText,
  X,
  Edit3,
  Columns,
  Eye,
  GitBranch,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import { Sidebar } from "./components/Sidebar";
import { GitPanel } from "./components/GitPanel";
import { GitStatusBar } from "./components/GitStatusBar";
import { cn } from "./lib/utils";
import type { FileNode } from "../preload/index";

type FileTab = {
  name: string;
  path: string;
  content: string;
  modified: boolean;
};

function App(): JSX.Element {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTab, setActiveTab] = useState<number>(-1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">(
    "split",
  );
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [gitLoading, setGitLoading] = useState(false);
  const [gitMessage, setGitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [gitStatus, setGitStatus] = useState<{
    branch: string | null;
    isClean: boolean;
    modifiedCount: number;
  }>({ branch: null, isClean: true, modifiedCount: 0 });
  const [gitRepoUrl, setGitRepoUrl] = useState<string | null>(null);
  const [gitLogs, setGitLogs] = useState<
    {
      time: string;
      type: "success" | "error" | "info";
      message: string;
    }[]
  >([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("markdaun-theme") as
      | "light"
      | "dark"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("markdaun-theme", theme);
  }, [theme]);

  const activeFile = activeTab >= 0 ? tabs[activeTab] : null;

  useEffect(() => {
    const savedPath = localStorage.getItem("markdaun-vault-path");
    if (savedPath) {
      setFolderPath(savedPath);
      window.api.getFolderTree(savedPath).then(setFileTree);
    }
  }, []);

  // Cargar estado de Git cuando cambia la carpeta
  useEffect(() => {
    if (!folderPath) return;

    const loadGitStatus = async () => {
      const status = await window.api.gitStatus(folderPath);
      if (status) {
        const modifiedCount =
          (status.modified?.length || 0) +
          (status.untracked?.length || 0) +
          (status.deleted?.length || 0);
        setGitStatus({
          branch: status.current,
          isClean: modifiedCount === 0,
          modifiedCount,
        });
      }

      const config = await window.api.gitGetConfig();
      if (config?.repoUrl) {
        setGitRepoUrl(config.repoUrl);
      }
    };

    loadGitStatus();
  }, [folderPath]);

  const handleOpenFolder = useCallback(async () => {
    const result = await window.api.openFolder();
    if (result && result.folderPath) {
      setFolderPath(result.folderPath);
      localStorage.setItem("markdaun-vault-path", result.folderPath);
      const tree = await window.api.getFolderTree(result.folderPath);
      setFileTree(tree);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (filePath: string) => {
      const existingIndex = tabs.findIndex((t) => t.path === filePath);
      if (existingIndex >= 0) {
        setActiveTab(existingIndex);
        return;
      }

      const content = await window.api.readFile(filePath);
      if (content !== null) {
        const fileName = filePath.split(/[\\/]/).pop() || "Sin título";
        const newTab: FileTab = {
          name: fileName,
          path: filePath,
          content,
          modified: false,
        };
        setTabs([...tabs, newTab]);
        setActiveTab(tabs.length);
      }
    },
    [tabs],
  );

  const handleSave = useCallback(async () => {
    if (!activeFile) return;

    let filePath = activeFile.path;
    if (!filePath) {
      const newPath = await window.api.saveFileDialog();
      if (!newPath) return;
      filePath = newPath;
    }

    const success = await window.api.saveFile(filePath, activeFile.content);
    if (success) {
      setTabs(
        tabs.map((t, i) =>
          i === activeTab
            ? {
                ...t,
                path: filePath,
                modified: false,
                name: filePath.split(/[\\/]/).pop() || t.name,
              }
            : t,
        ),
      );
      if (folderPath) {
        const tree = await window.api.getFolderTree(folderPath);
        setFileTree(tree);
      }
    }
  }, [activeFile, activeTab, tabs, folderPath]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (activeTab < 0) return;
      setTabs(
        tabs.map((t, i) =>
          i === activeTab ? { ...t, content: newContent, modified: true } : t,
        ),
      );
    },
    [activeTab, tabs],
  );

  const handleCloseTab = useCallback(
    (index: number) => {
      const newTabs = tabs.filter((_, i) => i !== index);
      setTabs(newTabs);
      if (activeTab >= index) {
        setActiveTab(Math.max(0, activeTab - 1));
      }
    },
    [tabs, activeTab],
  );

  const handleNewFile = useCallback(async () => {
    let filePath = folderPath;
    if (!filePath) {
      const result = await window.api.openFolder();
      if (result && result.folderPath) {
        filePath = result.folderPath;
        setFolderPath(filePath);
        localStorage.setItem("markdaun-vault-path", filePath);
        const tree = await window.api.getFolderTree(filePath);
        setFileTree(tree);
      } else {
        return;
      }
    }

    const fileName = `nuevo-${Date.now()}.md`;
    const newPath = `${filePath}\\${fileName}`;
    const content = "# Nuevo documento\n\nEscribe aquí tu markdown...";
    await window.api.saveFile(newPath, content);

    const tree = await window.api.getFolderTree(filePath);
    setFileTree(tree);

    const newTab: FileTab = {
      name: fileName,
      path: newPath,
      content,
      modified: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(tabs.length);
  }, [tabs, folderPath]);

  const handlePull = useCallback(async () => {
    if (!folderPath) return;
    setGitLoading(true);
    setGitMessage(null);
    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const result = await window.api.gitPull(folderPath);
    if (result.success) {
      setGitMessage({ type: "success", text: "Pull completado" });
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "success", message: "Pull completado" },
      ]);
      const tree = await window.api.getFolderTree(folderPath);
      setFileTree(tree);

      // Actualizar estado de Git
      const status = await window.api.gitStatus(folderPath);
      if (status) {
        const modifiedCount =
          (status.modified?.length || 0) +
          (status.untracked?.length || 0) +
          (status.deleted?.length || 0);
        setGitStatus({
          branch: status.current,
          isClean: modifiedCount === 0,
          modifiedCount,
        });
      }
    } else {
      setGitMessage({
        type: "error",
        text: result.error || "Error al hacer pull",
      });
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "error", message: `Pull falló: ${result.error}` },
      ]);
    }
    setGitLoading(false);
    setTimeout(() => setGitMessage(null), 3000);
  }, [folderPath]);

  const handlePush = useCallback(async () => {
    if (!folderPath) return;
    setGitLoading(true);
    setGitMessage(null);
    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Obtener status para ver los archivos modificados
    const status = await window.api.gitStatus(folderPath);

    if (!status) {
      setGitMessage({ type: "error", text: "No es un repositorio Git" });
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "error", message: "No es repositorio Git" },
      ]);
      setGitLoading(false);
      setTimeout(() => setGitMessage(null), 3000);
      return;
    }

    // Ver si hay cambios para commit
    const hasChanges =
      (status.modified?.length ?? 0) > 0 ||
      (status.staged?.length ?? 0) > 0 ||
      (status.untracked?.length ?? 0) > 0 ||
      (status.deleted?.length ?? 0) > 0;

    if (hasChanges) {
      // Crear mensaje de commit con los archivos modificados
      const changedFiles = [
        ...(status.modified || []),
        ...(status.untracked || []),
        ...(status.deleted || []),
      ].slice(0, 10);

      const commitMessage =
        changedFiles.length > 0
          ? `Update: ${changedFiles.join(", ")}${changedFiles.length > 10 ? "..." : ""}`
          : "Update files";

      // Hacer commit
      const commitResult = await window.api.gitCommit(
        folderPath,
        commitMessage,
      );
      if (!commitResult.success) {
        setGitMessage({
          type: "error",
          text: commitResult.error || "Error al hacer commit",
        });
        setGitLogs((prev) => [
          ...prev.slice(-19),
          {
            time,
            type: "error",
            message: `Commit falló: ${commitResult.error}`,
          },
        ]);
        setGitLoading(false);
        setTimeout(() => setGitMessage(null), 3000);
        return;
      }
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "info", message: `Commit: ${commitMessage}` },
      ]);
    }

    // Hacer push
    const result = await window.api.gitPush(folderPath);
    if (result.success) {
      setGitMessage({ type: "success", text: "Push completado" });
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "success", message: "Push completado" },
      ]);

      // Actualizar estado de Git
      const newStatus = await window.api.gitStatus(folderPath);
      if (newStatus) {
        const modifiedCount =
          (newStatus.modified?.length || 0) +
          (newStatus.untracked?.length || 0) +
          (newStatus.deleted?.length || 0);
        setGitStatus({
          branch: newStatus.current,
          isClean: modifiedCount === 0,
          modifiedCount,
        });
      }
    } else {
      setGitMessage({
        type: "error",
        text: result.error || "Error al hacer push",
      });
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "error", message: `Push falló: ${result.error}` },
      ]);
    }
    setGitLoading(false);
    setTimeout(() => setGitMessage(null), 3000);
  }, [folderPath]);

  return (
    <div className={cn("h-screen flex flex-col", theme === "dark" && "dark")}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card">
        <Button variant="ghost" size="sm" onClick={handleNewFile}>
          <Plus className="w-4 h-4 mr-1" />
          Nuevo
        </Button>
        <Button variant="ghost" size="sm" onClick={handleOpenFolder}>
          <FolderOpen className="w-4 h-4 mr-1" />
          Abrir bóveda
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={!activeFile}
        >
          <Save className="w-4 h-4 mr-1" />
          Guardar
        </Button>
        <div className="h-6 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePull}
          disabled={!folderPath || gitLoading}
        >
          <Download className="w-4 h-4 mr-1" />
          Pull
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePush}
          disabled={!folderPath || gitLoading}
        >
          <Upload className="w-4 h-4 mr-1" />
          Push
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-1 rounded-md bg-muted p-1">
          <Button
            variant={viewMode === "edit" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("edit")}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("split")}
          >
            <Columns className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowGitPanel(true)}
        >
          <GitBranch className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          folderPath={folderPath}
          tree={fileTree}
          activeFilePath={activeFile?.path || null}
          onFileSelect={handleFileSelect}
          onOpenFolder={handleOpenFolder}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-muted border-b overflow-x-auto">
              {tabs.map((tab, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 text-sm rounded cursor-pointer transition-colors",
                    index === activeTab
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:bg-background/50",
                  )}
                  onClick={() => setActiveTab(index)}
                >
                  <FileText className="w-3 h-3" />
                  <span className={cn(tab.modified && "text-orange-500")}>
                    {tab.name}
                    {tab.modified && " •"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(index);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Editor / Preview */}
          <div className="flex-1 flex overflow-hidden">
            {!activeFile ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-xl mb-4 font-medium">Markdaun</p>
                  <p className="text-sm mb-4">
                    Selecciona un archivo de la barra lateral
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleNewFile}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo archivo
                    </Button>
                    <Button variant="outline" onClick={handleOpenFolder}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Abrir bóveda
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {(viewMode === "edit" || viewMode === "split") && (
                  <textarea
                    className="flex-1 p-4 border-r resize-none focus:outline-none bg-background text-foreground"
                    value={activeFile.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Escribe tu markdown aquí..."
                  />
                )}
                {(viewMode === "preview" || viewMode === "split") && (
                  <ScrollArea
                    className={cn(
                      "flex-1 p-4",
                      viewMode === "split" && "border-l",
                    )}
                  >
                    <div className={cn("preview", theme === "dark" && "dark")}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(
                              className || "",
                            );
                            return match ? (
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {activeFile.content}
                      </ReactMarkdown>
                    </div>
                  </ScrollArea>
                )}
              </>
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-1 text-xs text-muted-foreground border-t bg-muted">
            <span className="truncate">
              {activeFile?.path || "Sin archivo"}
            </span>
            <span>{activeFile?.content.length || 0} caracteres</span>
          </div>
        </div>
      </div>

      <GitPanel
        isOpen={showGitPanel}
        onClose={() => setShowGitPanel(false)}
        currentFolder={folderPath}
        onFolderChange={(path) => {
          setFolderPath(path);
          localStorage.setItem("markdaun-vault-path", path);
        }}
        onRefreshTree={() => {
          if (folderPath) {
            window.api.getFolderTree(folderPath).then(setFileTree);
          }
        }}
        onGitConnectSuccess={async () => {
          if (!folderPath) return;
          // Recargar estado de Git
          const status = await window.api.gitStatus(folderPath);
          if (status) {
            const modifiedCount =
              (status.modified?.length || 0) +
              (status.untracked?.length || 0) +
              (status.deleted?.length || 0);
            setGitStatus({
              branch: status.current,
              isClean: modifiedCount === 0,
              modifiedCount,
            });
          }
          // Recargar configuración
          const config = await window.api.gitGetConfig();
          if (config?.repoUrl) {
            setGitRepoUrl(config.repoUrl);
          }
        }}
      />

      {folderPath && (
        <GitStatusBar
          repoUrl={gitRepoUrl}
          branch={gitStatus.branch}
          isClean={gitStatus.isClean}
          modifiedCount={gitStatus.modifiedCount}
          logs={gitLogs}
          folderPath={folderPath}
          onExecuteCommand={async (command: string) => {
            return await window.api.execCommand(command, folderPath);
          }}
          onRefresh={async () => {
            if (!folderPath) return;
            const status = await window.api.gitStatus(folderPath);
            if (status) {
              const modifiedCount =
                (status.modified?.length || 0) +
                (status.untracked?.length || 0) +
                (status.deleted?.length || 0);
              setGitStatus({
                branch: status.current,
                isClean: modifiedCount === 0,
                modifiedCount,
              });
            }
            const config = await window.api.gitGetConfig();
            if (config?.repoUrl) {
              setGitRepoUrl(config.repoUrl);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
