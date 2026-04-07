import { useState } from "react";
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";
import type { FileNode } from "../../preload/index";

type SidebarProps = {
  folderPath: string | null;
  tree: FileNode[];
  activeFilePath: string | null;
  onFileSelect: (path: string) => void;
  onOpenFolder: () => void;
};

function TreeNode({
  node,
  depth,
  activeFilePath,
  onFileSelect,
}: {
  node: FileNode;
  depth: number;
  activeFilePath: string | null;
  onFileSelect: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (node.isDirectory) {
    return (
      <div>
        <div
          className="flex items-center gap-1 py-1 cursor-pointer hover:bg-accent rounded-md mx-1"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
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
          <span className="text-sm truncate text-foreground">{node.name}</span>
        </div>
        {isOpen &&
          node.children?.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
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
      <FileText className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm truncate text-foreground">{node.name}</span>
    </div>
  );
}

export function Sidebar({
  folderPath,
  tree,
  activeFilePath,
  onFileSelect,
  onOpenFolder,
}: SidebarProps) {
  const folderName = folderPath?.split(/[\\/]/).pop() || null;

  return (
    <div className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
      <div className="p-2 border-b border-border">
        <Button onClick={onOpenFolder} className="w-full" size="sm">
          <Folder className="w-4 h-4 mr-2" />
          Abrir bóveda
        </Button>
      </div>

      {folderName && (
        <div className="px-3 py-2 text-sm font-medium text-foreground border-b border-border flex items-center gap-2">
          <Folder className="w-4 h-4 text-yellow-500" />
          {folderName}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="py-1">
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
                onFileSelect={onFileSelect}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
