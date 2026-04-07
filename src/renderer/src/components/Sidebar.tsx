import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FolderClosed,
  Search,
  FolderPlus,
  FilePlus,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

type SidebarProps = {
  folderPath: string | null;
  tree: FileNode[];
  activeFilePath: string | null;
  onFileSelect: (path: string) => void;
  onCreateFolder: (
    parentPath: string,
    folderName: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onCreateFile: (
    parentPath: string,
    fileName: string,
  ) => Promise<{ success: boolean; error?: string }>;
};

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  nodePath: string | null;
  nodeName: string | null;
  isDirectory: boolean;
};

function TreeNode({
  node,
  depth,
  activeFilePath,
  isOpen,
  expandedPaths,
  onToggle,
  onFileSelect,
  onContextMenu,
}: {
  node: FileNode;
  depth: number;
  activeFilePath: string | null;
  isOpen: boolean;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onFileSelect: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}) {
  if (node.isDirectory) {
    return (
      <div>
        <div
          className="flex items-center gap-1 py-1 cursor-pointer hover:bg-accent rounded-md mx-1"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onToggle(node.path)}
          onContextMenu={(e) => onContextMenu(e, node)}
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform text-muted-foreground",
              isOpen && "rotate-90",
            )}
          />
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-yellow-500" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-sm truncate text-foreground whitespace-nowrap">
            {node.name}
          </span>
        </div>
        {isOpen &&
          node.children?.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              isOpen={expandedPaths.has(child.path)}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
              onFileSelect={onFileSelect}
              onContextMenu={onContextMenu}
            />
          ))}
      </div>
    );
  }

  const isActive = activeFilePath === node.path;
  const isMd = node.name.endsWith(".md") || node.name.endsWith(".markdown");

  if (!isMd) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 py-1 cursor-pointer hover:bg-accent rounded-md mx-1",
        isActive && "bg-accent",
      )}
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
      onClick={() => onFileSelect(node.path)}
    >
      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm truncate text-foreground whitespace-nowrap">
        {node.name}
      </span>
    </div>
  );
}

function getAllFilePaths(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (!node.isDirectory) {
      paths.push(node.path);
    }
    if (node.children) {
      paths.push(...getAllFilePaths(node.children));
    }
  }
  return paths;
}

function findPathToFile(tree: FileNode[], targetPath: string): string[] {
  const targetFileName = targetPath.split(/[\\/]/).pop() || "";

  function search(nodes: FileNode[]): string[] | null {
    for (const node of nodes) {
      if (node.isDirectory && node.children) {
        const result = search(node.children);
        if (result !== null) {
          return [node.path, ...result];
        }
      } else if (!node.isDirectory && node.name === targetFileName) {
        return [];
      }
    }
    return null;
  }

  const result = search(tree);
  return result || [];
}

function InputDialog({
  title,
  placeholder,
  defaultValue,
  onConfirm,
  onCancel,
}: {
  title: string;
  placeholder: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue || "");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onConfirm(value);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg p-4 w-80 shadow-lg">
        <h3 className="text-sm font-medium mb-3 text-foreground">{title}</h3>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(value)}
            disabled={!value.trim()}
          >
            Crear
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  folderPath,
  tree,
  activeFilePath,
  onFileSelect,
  onCreateFolder,
  onCreateFile,
}: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodePath: null,
    nodeName: null,
    isDirectory: false,
  });
  const [dialog, setDialog] = useState<{
    type: "folder" | "file" | null;
    parentPath: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const allMdFiles = useMemo(() => getAllFilePaths(tree), [tree]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleToggle = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCollapseAll = () => {
    setExpandedPaths(new Set());
  };

  const handleFindFile = () => {
    if (!activeFilePath) return;
    const pathsToExpand = findPathToFile(tree, activeFilePath);
    setExpandedPaths(new Set(pathsToExpand));
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      nodePath: node.path,
      nodeName: node.name,
      isDirectory: node.isDirectory,
    });
  };

  const handleCreateFolderHere = () => {
    const path = contextMenu.nodePath || folderPath;
    if (path) {
      setDialog({ type: "folder", parentPath: path });
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCreateFileHere = () => {
    const path = contextMenu.nodePath || folderPath;
    if (path) {
      setDialog({ type: "file", parentPath: path });
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleConfirmCreate = async (name: string) => {
    if (!dialog) return;

    if (dialog.type === "folder") {
      await onCreateFolder(dialog.parentPath, name);
    } else if (dialog.type === "file") {
      await onCreateFile(dialog.parentPath, name);
    }

    setDialog(null);
  };

  const folderName = folderPath?.split(/[\\/]/).pop() || null;

  return (
    <div className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col relative">
      {folderName ? (
        <div className="p-2 border-b border-border flex gap-2">
          <Button
            onClick={handleCollapseAll}
            size="sm"
            variant="outline"
            title="Cerrar todas las carpetas"
          >
            <FolderClosed className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleFindFile}
            size="sm"
            variant="outline"
            title="Encontrar archivo actual"
            disabled={!activeFilePath || allMdFiles.length <= 1}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      ) : null}

      {folderName && (
        <div
          className="px-3 py-2 text-sm font-medium text-foreground border-b border-border flex items-center gap-2 cursor-pointer hover:bg-accent"
          onClick={() =>
            setContextMenu({
              visible: true,
              x: 100,
              y: 100,
              nodePath: folderPath,
              nodeName: folderName,
              isDirectory: true,
            })
          }
        >
          <Folder className="w-4 h-4 text-yellow-500" />
          {folderName}
        </div>
      )}

      <ScrollArea className="flex-1 min-w-0">
        <div className="py-1 min-w-0">
          {tree.length === 0 ? (
            <div className="px-3 py-4 text-center text-muted-foreground text-sm">
              {folderPath
                ? "No hay archivos markdown"
                : "Abre una carpeta para comenzar"}
            </div>
          ) : (
            tree.map((node, index) => (
              <TreeNode
                key={`${node.path}-${index}`}
                node={node}
                depth={0}
                activeFilePath={activeFilePath}
                isOpen={expandedPaths.has(node.path)}
                expandedPaths={expandedPaths}
                onToggle={handleToggle}
                onFileSelect={onFileSelect}
                onContextMenu={handleContextMenu}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed bg-card border rounded-md shadow-lg py-1 z-50 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 text-foreground"
            onClick={handleCreateFolderHere}
          >
            <FolderPlus className="w-4 h-4" />
            Crear nueva carpeta
          </button>
          <button
            className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 text-foreground"
            onClick={handleCreateFileHere}
          >
            <FilePlus className="w-4 h-4" />
            Crear nuevo archivo
          </button>
        </div>
      )}

      {dialog && (
        <InputDialog
          title={dialog.type === "folder" ? "Nueva carpeta" : "Nuevo archivo"}
          placeholder={
            dialog.type === "folder"
              ? "Nombre de la carpeta"
              : "Nombre del archivo"
          }
          defaultValue={
            dialog.type === "file" ? "nuevo-archivo" : "nueva-carpeta"
          }
          onConfirm={handleConfirmCreate}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
