import { useState, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkWikiLink from "@flowershow/remark-wiki-link";
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
  Image,
  Settings,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import { Sidebar } from "./components/Sidebar";
import { GitPanel } from "./components/GitPanel";
import { GitStatusBar } from "./components/GitStatusBar";
import { cn } from "./lib/utils";
import type { FileNode } from "../preload/index";
import { SettingsModal } from "./components/SettingsModal";
import { WindowControls } from "./components/WindowControls";

function LocalImage({ src, alt }: { src: string; alt: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const result = await window.api.getImageBase64(src);
        if (result.success && result.dataUrl) {
          setDataUrl(result.dataUrl);
        }
      } catch (err) {
        console.error("Error loading image:", err);
      }
    };
    loadImage();
  }, [src]);

  if (!dataUrl) {
    return null;
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      className="max-w-full h-auto rounded-md my-2"
    />
  );
}

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
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundMaterial, setBackgroundMaterial] =
    useState<string>("acrylic");
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("system-ui");

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

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

  const applyCustomTheme = useCallback(
    (config: {
      colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: { primary: string; secondary: string; disabled: string };
        border: string;
        error: string;
        success: string;
        warning: string;
      };
      blur: number;
      fontSize: number;
      fontFamily: string;
    }) => {
      const root = document.documentElement;
      root.style.setProperty("--theme-primary", config.colors.primary);
      root.style.setProperty("--theme-secondary", config.colors.secondary);
      root.style.setProperty("--theme-background", config.colors.background);
      root.style.setProperty("--theme-surface", config.colors.surface);
      root.style.setProperty(
        "--theme-text-primary",
        config.colors.text.primary,
      );
      root.style.setProperty(
        "--theme-text-secondary",
        config.colors.text.secondary,
      );
      root.style.setProperty(
        "--theme-text-disabled",
        config.colors.text.disabled,
      );
      root.style.setProperty("--theme-border", config.colors.border);
      root.style.setProperty("--theme-error", config.colors.error);
      root.style.setProperty("--theme-success", config.colors.success);
      root.style.setProperty("--theme-warning", config.colors.warning);
      setBlur(config.blur);
      setFontSize(config.fontSize);
      setFontFamily(config.fontFamily);
    },
    [],
  );

  const loadThemeConfig = useCallback(async () => {
    try {
      const config = await window.api.themeGetConfig();
      if (config) {
        applyCustomTheme(config);
        if (config.backgroundMaterial) {
          setBackgroundMaterial(config.backgroundMaterial);
          window.api.setBackgroundMaterial(config.backgroundMaterial);
        }
      } else {
        window.api.setBackgroundMaterial("acrylic");
      }
    } catch (err) {
      console.error("Error loading theme config:", err);
      window.api.setBackgroundMaterial("acrylic");
    }
  }, [applyCustomTheme]);

  useEffect(() => {
    loadThemeConfig();
  }, [loadThemeConfig]);

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

  const handleRefreshTree = useCallback(async () => {
    if (folderPath) {
      const tree = await window.api.getFolderTree(folderPath);
      setFileTree(tree);
    }
  }, [folderPath]);

  const handleCreateFolder = useCallback(
    async (parentPath: string, folderName: string) => {
      const result = await window.api.createFolder(parentPath, folderName);
      if (result.success) {
        await handleRefreshTree();
      }
      return result;
    },
    [handleRefreshTree],
  );

  const handleCreateFile = useCallback(
    async (parentPath: string, fileName: string) => {
      const result = await window.api.createFile(parentPath, fileName);
      if (result.success && result.path) {
        await handleRefreshTree();
        const existingIndex = tabs.findIndex((t) => t.path === result.path);
        if (existingIndex >= 0) {
          setActiveTab(existingIndex);
        } else {
          const content = await window.api.readFile(result.path);
          if (content !== null) {
            const fileName = result.path.split(/[\\/]/).pop() || "Sin título";
            const newTab: FileTab = {
              name: fileName,
              path: result.path,
              content,
              modified: false,
            };
            setTabs([...tabs, newTab]);
            setActiveTab(tabs.length);
          }
        }
      }
      return result;
    },
    [handleRefreshTree, tabs],
  );

  const handleDeleteItem = useCallback(
    async (itemPath: string, isDirectory: boolean) => {
      const result = await window.api.deleteItem(itemPath, isDirectory);
      if (result.success) {
        if (!isDirectory && activeFile?.path === itemPath) {
          setTabs(tabs.filter((t) => t.path !== itemPath));
          if (activeTab >= tabs.length) {
            setActiveTab(Math.max(0, tabs.length - 1));
          }
        }
        await handleRefreshTree();
      }
      return result;
    },
    [handleRefreshTree, activeFile, tabs, activeTab],
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

  const handleInsertImage = useCallback(async () => {
    if (!activeFile || !folderPath) return;

    const imagePath = await window.api.openImageDialog();
    if (!imagePath) return;

    const relativePath = imagePath
      .replace(folderPath, "")
      .replace(/^[\\/]/, "");
    const markdownImage = `![[${relativePath}]]`;

    const textarea = document.querySelector("textarea");
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = activeFile.content;
      const newContent =
        content.slice(0, start) + markdownImage + content.slice(end);
      setTabs(
        tabs.map((t, i) =>
          i === activeTab ? { ...t, content: newContent, modified: true } : t,
        ),
      );
    }
  }, [activeFile, activeTab, folderPath, tabs]);

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
    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const result = await window.api.gitPull(folderPath);
    if (result.success) {
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
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "error", message: `Pull falló: ${result.error}` },
      ]);
    }
    setGitLoading(false);
  }, [folderPath]);

  const handlePush = useCallback(async () => {
    if (!folderPath) return;
    setGitLoading(true);
    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Obtener status para ver los archivos modificados
    const status = await window.api.gitStatus(folderPath);

    if (!status) {
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "error", message: "No es repositorio Git" },
      ]);
      setGitLoading(false);
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
        setGitLogs((prev) => [
          ...prev.slice(-19),
          {
            time,
            type: "error",
            message: `Commit falló: ${commitResult.error}`,
          },
        ]);
        setGitLoading(false);
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
      setGitLogs((prev) => [
        ...prev.slice(-19),
        { time, type: "error", message: `Push falló: ${result.error}` },
      ]);
    }
    setGitLoading(false);
  }, [folderPath]);

  return (
    <div className={cn("h-screen flex flex-col", theme === "dark" && "dark")}>
      {/* Title bar */}
      <div
        className="flex items-center justify-between h-8 px-2 bg-muted/50 border-b cursor-default"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-xs font-medium text-muted-foreground px-2">
          Markdaun
        </span>
        <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <WindowControls theme={theme} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card/80 text-card-foreground backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          className="dark:text-white dark:hover:bg-accent"
          onClick={handleNewFile}
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="dark:text-white dark:hover:bg-accent"
          onClick={handleOpenFolder}
        >
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
          className="dark:text-white dark:hover:bg-accent"
          onClick={handlePull}
          disabled={!folderPath || gitLoading}
        >
          <Download className="w-4 h-4 mr-1" />
          Pull
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="dark:text-white dark:hover:bg-accent"
          onClick={handlePush}
          disabled={!folderPath || gitLoading}
        >
          <Upload className="w-4 h-4 mr-1" />
          Push
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="dark:text-white dark:hover:bg-accent"
          title="Insertar imagen"
          onClick={handleInsertImage}
          disabled={!activeFile}
        >
          <Image className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1 rounded-md bg-muted p-1">
          <Button
            variant={viewMode === "edit" ? "secondary" : "ghost"}
            size="sm"
            className={
              viewMode !== "edit" ? "dark:text-white dark:hover:bg-accent" : ""
            }
            onClick={() => setViewMode("edit")}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            className={
              viewMode !== "split" ? "dark:text-white dark:hover:bg-accent" : ""
            }
            onClick={() => setViewMode("split")}
          >
            <Columns className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="sm"
            className={
              viewMode !== "preview"
                ? "dark:text-white dark:hover:bg-accent"
                : ""
            }
            onClick={() => setViewMode("preview")}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="dark:text-white dark:hover:bg-accent"
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
          className="dark:text-white dark:hover:bg-accent"
          onClick={() => setShowGitPanel(true)}
        >
          <GitBranch className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="dark:text-white dark:hover:bg-accent"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          folderPath={folderPath}
          tree={fileTree}
          activeFilePath={activeFile?.path || null}
          onFileSelect={handleFileSelect}
          onCreateFolder={handleCreateFolder}
          onCreateFile={handleCreateFile}
          onDeleteItem={handleDeleteItem}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-muted/80 backdrop-blur-sm border-b overflow-x-auto">
              {tabs.map((tab, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 text-sm rounded cursor-pointer transition-colors",
                    index === activeTab
                      ? "bg-background/80 backdrop-blur-sm text-foreground"
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
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-background/50 backdrop-blur-sm">
                <div className="text-center bg-card/80 backdrop-blur-sm p-8 rounded-lg border border-border/30">
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
                    ref={editorRef}
                    className="flex-1 p-4 border-r resize-none focus:outline-none bg-background/80 backdrop-blur-sm text-foreground"
                    style={{
                      fontSize: `${fontSize}px`,
                      fontFamily: fontFamily,
                    }}
                    value={activeFile.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Escribe tu markdown aquí..."
                    onScroll={(e) => {
                      if (viewMode !== "split" || isSyncingRef.current) return;
                      isSyncingRef.current = true;
                      const target = e.currentTarget;
                      const scrollRatio =
                        target.scrollTop /
                        (target.scrollHeight - target.clientHeight);
                      if (previewRef.current) {
                        const previewScrollHeight =
                          previewRef.current.scrollHeight -
                          previewRef.current.clientHeight;
                        previewRef.current.scrollTop =
                          scrollRatio * previewScrollHeight;
                      }
                      setTimeout(() => {
                        isSyncingRef.current = false;
                      }, 50);
                    }}
                  />
                )}
                {(viewMode === "preview" || viewMode === "split") && (
                  <ScrollArea
                    ref={previewRef}
                    className={cn(
                      "flex-1 p-4 bg-background/80 backdrop-blur-sm",
                      viewMode === "split" && "border-l",
                    )}
                    onScroll={(e) => {
                      if (viewMode !== "split" || isSyncingRef.current) return;
                      isSyncingRef.current = true;
                      const target = e.currentTarget;
                      const scrollRatio =
                        target.scrollTop /
                        (target.scrollHeight - target.clientHeight);
                      if (editorRef.current) {
                        const editorScrollHeight =
                          editorRef.current.scrollHeight -
                          editorRef.current.clientHeight;
                        editorRef.current.scrollTop =
                          scrollRatio * editorScrollHeight;
                      }
                      setTimeout(() => {
                        isSyncingRef.current = false;
                      }, 50);
                    }}
                  >
                    <div className={cn("preview", theme === "dark" && "dark")}>
                      <ReactMarkdown
                        remarkPlugins={[
                          remarkGfm,
                          [
                            remarkWikiLink,
                            {
                              hrefTemplate: (permalink: string) =>
                                `./${permalink}`,
                              pageResolver: (name: string) => [
                                name.replace(/ /g, "-"),
                              ],
                              aliasDivider: "|",
                              embed: true,
                            },
                          ],
                        ]}
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
                          a({ href, children }) {
                            if (href && !href.startsWith("http")) {
                              const imageExtensions = [
                                ".png",
                                ".jpg",
                                ".jpeg",
                                ".gif",
                                ".webp",
                                ".svg",
                                ".bmp",
                              ];
                              const isImage =
                                imageExtensions.some((ext) =>
                                  href.toLowerCase().includes(ext),
                                ) || href.includes(".");
                              if (
                                isImage ||
                                href.startsWith("/") ||
                                href.startsWith("./") ||
                                href.startsWith("../")
                              ) {
                                const fullPath = href.startsWith("/")
                                  ? `${folderPath}${href}`
                                  : href.startsWith("./")
                                    ? `${folderPath}/${href.slice(2)}`
                                    : href.startsWith("../")
                                      ? `${folderPath}/${href.slice(3)}`
                                      : `${folderPath}/${href}`;
                                return (
                                  <img
                                    src={`file://${fullPath.replace(/\\/g, "/")}`}
                                    alt={String(children)}
                                    className="max-w-full h-auto rounded-md my-2"
                                  />
                                );
                              }
                            }
                            return (
                              <a
                                href={href}
                                className="text-blue-500 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            );
                          },
                          img({ src, alt }) {
                            if (!src) return null;

                            if (
                              src.startsWith("http://") ||
                              src.startsWith("https://")
                            ) {
                              return (
                                <img
                                  src={src}
                                  alt={alt || ""}
                                  className="max-w-full h-auto rounded-md my-2"
                                />
                              );
                            }

                            let fullPath: string;
                            if (src.startsWith("/")) {
                              fullPath = `${folderPath}${src}`;
                            } else if (src.startsWith("./")) {
                              fullPath = `${folderPath}/${src.slice(2)}`;
                            } else if (src.startsWith("../")) {
                              fullPath = `${folderPath}/${src.slice(3)}`;
                            } else {
                              fullPath = `${folderPath}/${src}`;
                            }

                            return (
                              <LocalImage src={fullPath} alt={alt || ""} />
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
          <div className="flex items-center justify-between px-4 py-1 text-xs text-muted-foreground border-t bg-muted/80 backdrop-blur-sm">
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

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onThemeChange={setTheme}
        currentTheme={theme}
        currentBackgroundMaterial={backgroundMaterial}
        onBackgroundMaterialChange={(material) => {
          setBackgroundMaterial(material);
          window.api.setBackgroundMaterial(material);
        }}
        currentFontSize={fontSize}
        onFontSizeChange={setFontSize}
        currentFontFamily={fontFamily}
        onFontFamilyChange={setFontFamily}
      />
    </div>
  );
}

export default App;
