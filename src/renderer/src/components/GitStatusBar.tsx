import { useState, useRef, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  GitBranch,
  RefreshCw,
  Terminal,
  Play,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type GitLogEntry = {
  time: string;
  type: "success" | "error" | "info";
  message: string;
};

type TerminalOutput = {
  command: string;
  output: string;
  success: boolean;
  time: string;
};

type GitStatusBarProps = {
  repoUrl: string | null;
  branch: string | null;
  isClean: boolean;
  modifiedCount: number;
  logs: GitLogEntry[];
  onRefresh: () => void;
  folderPath: string | null;
  onExecuteCommand: (
    command: string,
  ) => Promise<{ success: boolean; output: string; error?: string }>;
};

export function GitStatusBar({
  repoUrl,
  branch,
  isClean,
  modifiedCount,
  logs,
  onRefresh,
  folderPath,
  onExecuteCommand,
}: GitStatusBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current && terminalOutput.length > 0) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  useEffect(() => {
    if (showTerminal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTerminal]);

  const getRepoName = (url: string | null): string => {
    if (!url) return "Sin remoto";
    const match = url.match(/[:\/]([^.]+)\.git$/);
    return match ? match[1] : url;
  };

  const executeCommand = async () => {
    if (!commandInput.trim() || isExecuting) return;

    const cmd = commandInput.trim();
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    setIsExecuting(true);
    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const result = await onExecuteCommand(cmd);

    setTerminalOutput((prev) => [
      ...prev,
      {
        command: cmd,
        output: result.success ? result.output : result.error || result.output,
        success: result.success,
        time,
      },
    ]);

    setCommandInput("");
    setIsExecuting(false);
  };

  const clearTerminal = () => {
    setTerminalOutput([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommandInput("");
        } else {
          setHistoryIndex(newIndex);
          setCommandInput(commandHistory[newIndex]);
        }
      }
    }
  };

  return (
    <div className="border-t bg-card/80 backdrop-blur-sm">
      {/* Barra resumida - siempre visible */}
      <div
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <GitBranch className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {branch || "Sin rama"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-[10px]">origin</span>
            <span>:</span>
            <span className="max-w-[200px] truncate">
              {getRepoName(repoUrl)}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1",
              isClean ? "text-green-600" : "text-yellow-600",
            )}
          >
            <span>•</span>
            <span>{isClean ? "✓ Clean" : `⚠ ${modifiedCount} cambios`}</span>
          </div>

          {folderPath && (
            <div className="flex items-center gap-1 text-muted-foreground ml-2">
              <span className="max-w-[150px] truncate text-[10px]">
                {folderPath.split(/[\\/]/).slice(-2).join("/")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {logs[logs.length - 1].message}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Panel expandido con historial y terminal */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Historial de Git */}
          <div className="px-3 py-2 max-h-32 overflow-auto bg-muted/20">
            <div className="text-xs space-y-1">
              <div className="font-medium text-muted-foreground mb-2">
                Historial de Git
              </div>
              {logs.length === 0 ? (
                <div className="text-muted-foreground italic">
                  Sin operaciones recientes
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-2",
                      log.type === "success" && "text-green-600",
                      log.type === "error" && "text-red-600",
                      log.type === "info" && "text-blue-600",
                    )}
                  >
                    <span className="text-muted-foreground shrink-0">
                      [{log.time}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Toggle terminal */}
          <button
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/30 border-t border-border"
            onClick={() => setShowTerminal(!showTerminal)}
          >
            <div className="flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              <span>Terminal</span>
              {isExecuting && (
                <span className="text-yellow-500 animate-pulse">•</span>
              )}
            </div>
            <ChevronRight
              className={cn(
                "w-3 h-3 transition-transform",
                showTerminal && "rotate-90",
              )}
            />
          </button>

          {/* Terminal */}
          {showTerminal && (
            <div className="border-t border-border">
              {/* Output de la terminal */}
              <div
                ref={terminalRef}
                className="max-h-48 overflow-auto p-3 font-mono text-xs bg-[#0d1117] text-[#8b949e]"
              >
                {terminalOutput.length === 0 ? (
                  <div className="text-[#484f58] italic">
                    Escribe un comando y presiona Enter...
                  </div>
                ) : (
                  terminalOutput.map((entry, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[#3fb950]">$</span>
                        <span className="text-[#e6edf3]">{entry.command}</span>
                      </div>
                      <pre
                        className={cn(
                          "whitespace-pre-wrap break-all mt-1 ml-4",
                          entry.success ? "text-[#8b949e]" : "text-[#f85149]",
                        )}
                      >
                        {entry.output || "(sin salida)"}
                      </pre>
                    </div>
                  ))
                )}
                {isExecuting && (
                  <div className="text-[#d29922] animate-pulse">
                    Ejecutando...
                  </div>
                )}
              </div>

              {/* Input de la terminal */}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-[#30363d] bg-[#0d1117]">
                <span className="text-[#3fb950] shrink-0">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un comando..."
                  className="flex-1 px-2 py-1.5 text-xs bg-transparent text-[#e6edf3] border border-[#30363d] rounded focus:border-[#58a6ff] focus:outline-none font-mono placeholder-[#484f58]"
                  disabled={isExecuting}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={executeCommand}
                  disabled={isExecuting || !commandInput.trim()}
                  className="h-7 w-7 p-0 text-[#3fb950] hover:text-[#56d364] hover:bg-[#21262d]"
                >
                  <Play className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearTerminal}
                  className="h-7 w-7 p-0 text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#21262d]"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
