import { useState, useEffect } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type WindowControlsProps = {
  theme: "light" | "dark";
};

export function WindowControls({ theme }: WindowControlsProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.api.windowIsMaximized().then(setIsMaximized);

    const unsubscribe = window.api.onWindowMaximizedChange((maximized) => {
      setIsMaximized(maximized);
    });

    return unsubscribe;
  }, []);

  const handleMinimize = () => {
    window.api.windowMinimize();
  };

  const handleMaximize = () => {
    window.api.windowMaximize();
  };

  const handleClose = () => {
    window.api.windowClose();
  };

  return (
    <div className="flex items-center h-full">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-none hover:bg-accent/50",
          theme === "dark" ? "text-foreground/70" : "text-foreground/60",
        )}
        onClick={handleMinimize}
      >
        <Minus className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-none hover:bg-accent/50",
          theme === "dark" ? "text-foreground/70" : "text-foreground/60",
        )}
        onClick={handleMaximize}
      >
        {isMaximized ? (
          <Maximize2 className="w-4 h-4" />
        ) : (
          <Square className="w-3.5 h-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-none hover:bg-red-500 hover:text-white",
          theme === "dark" ? "text-foreground/70" : "text-foreground/60",
        )}
        onClick={handleClose}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
