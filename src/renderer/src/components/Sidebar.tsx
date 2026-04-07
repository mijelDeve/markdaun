import { useState, useMemo } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FolderClosed,
  Search,
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
};

function TreeNode({
  node,
  depth,
  activeFilePath,
  isOpen,
  expandedPaths,
  onToggle,
  onFileSelect,
}: {
  node: FileNode;
  depth: number;
  activeFilePath: string | null;
  isOpen: boolean;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onFileSelect: (path: string) => void;
}) {
  if (node.isDirectory) {
    return (
      <div>
        <div
          className="flex items-center gap-1 py-1 cursor-pointer hover:bg-accent rounded-md mx-1"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onToggle(node.path)}
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

export function Sidebar({
  folderPath,
  tree,
  activeFilePath,
  onFileSelect,
}: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const allMdFiles = useMemo(() => getAllFilePaths(tree), [tree]);

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

  const folderName = folderPath?.split(/[\\/]/).pop() || null;

  return (
    <div className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
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
        <div className="px-3 py-2 text-sm font-medium text-foreground border-b border-border flex items-center gap-2">
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
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
