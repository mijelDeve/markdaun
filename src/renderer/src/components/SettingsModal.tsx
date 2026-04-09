import { useState, useEffect } from "react";
import {
  X,
  Moon,
  Sun,
  Palette,
  Type,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type ThemeConfig = {
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

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onThemeChange: (theme: "light" | "dark") => void;
  currentTheme: "light" | "dark";
  currentBackgroundMaterial: string;
  onBackgroundMaterialChange: (material: string) => void;
  currentFontSize: number;
  onFontSizeChange: (value: number) => void;
  currentFontFamily: string;
  onFontFamilyChange: (value: string) => void;
};

const defaultColors: ThemeConfig["colors"] = {
  primary: "#4f46e5",
  secondary: "#06b6d4",
  background: "#0f172a",
  surface: "#1e293b",
  text: {
    primary: "#ffffff",
    secondary: "#94a3b8",
    disabled: "#64748b",
  },
  border: "#334155",
  error: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
};

const defaultConfig: ThemeConfig = {
  theme: "dark",
  backgroundMaterial: "none",
  fontSize: 14,
  fontFamily: "monospace",
  colors: defaultColors,
};

const fontFamilies = [
  { value: "monospace", label: "Monospace" },
  { value: "sans-serif", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
  { value: "system-ui", label: "System UI" },
];

const backgroundMaterialOptions = [
  { value: "none", label: "Ninguno", description: "Sin efecto de fondo" },
  {
    value: "acrylic",
    label: "Acrylic",
    description: "Efecto translúcido (Windows 10+)",
  },
  {
    value: "mica",
    label: "Mica",
    description: "Material dinámico (Windows 11)",
  },
  {
    value: "tabbed",
    label: "Tabbed",
    description: "Similar a Mica (Windows 11)",
  },
];

export function SettingsModal({
  isOpen,
  onClose,
  onThemeChange,
  currentTheme,
  currentBackgroundMaterial,
  onBackgroundMaterialChange,
  currentFontSize,
  onFontSizeChange,
  currentFontFamily,
  onFontFamilyChange,
}: SettingsModalProps) {
  const [config, setConfig] = useState<ThemeConfig>(defaultConfig);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"appearance" | "editor">(
    "appearance",
  );

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    const savedConfig = await window.api.themeGetConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      if (savedConfig.theme) onThemeChange(savedConfig.theme);
      if (savedConfig.backgroundMaterial)
        onBackgroundMaterialChange(savedConfig.backgroundMaterial);
      if (savedConfig.fontSize) onFontSizeChange(savedConfig.fontSize);
      if (savedConfig.fontFamily) onFontFamilyChange(savedConfig.fontFamily);
    }
  };

  const saveConfig = async (newConfig: ThemeConfig) => {
    setConfig(newConfig);
    await window.api.themeSetConfig(newConfig);
  };

  const handleBackgroundMaterialChange = (material: string) => {
    onBackgroundMaterialChange(material);
    saveConfig({ ...config, backgroundMaterial: material });
  };

  const handleColorsJsonChange = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setJsonError(null);
      saveConfig({ ...config, colors: parsed });
    } catch (e) {
      setJsonError("JSON inválido");
    }
  };

  const handleCopyConfig = () => {
    const markdownContent = `# Markdaun Theme Configuration

\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`
`;
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[800px] h-[600px] bg-background/80 backdrop-blur-md rounded-lg shadow-xl flex flex-col overflow-hidden border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Configuración</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r p-2 space-y-1">
            <button
              onClick={() => setActiveSection("appearance")}
              className={cn(
                "w-full text-left px-3 py-2 rounded text-sm",
                activeSection === "appearance"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
            >
              <Palette className="w-4 h-4 inline-block mr-2" />
              Apariencia
            </button>
            <button
              onClick={() => setActiveSection("editor")}
              className={cn(
                "w-full text-left px-3 py-2 rounded text-sm",
                activeSection === "editor"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
            >
              <Type className="w-4 h-4 inline-block mr-2" />
              Editor
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeSection === "appearance" && (
              <div className="space-y-6">
                {/* Tema */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tema</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={currentTheme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onThemeChange("light")}
                    >
                      <Sun className="w-4 h-4 mr-1" />
                      Claro
                    </Button>
                    <Button
                      variant={currentTheme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onThemeChange("dark")}
                    >
                      <Moon className="w-4 h-4 mr-1" />
                      Oscuro
                    </Button>
                  </div>
                </div>

                {/* Background Material */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Efecto de fondo (Windows)
                  </label>
                  <div className="space-y-2">
                    {backgroundMaterialOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleBackgroundMaterialChange(option.value)
                        }
                        className={cn(
                          "w-full text-left p-3 rounded border transition-colors",
                          currentBackgroundMaterial === option.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent/50",
                        )}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colores JSON */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Colores (JSON)
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyConfig}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      {copied ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                  <textarea
                    value={JSON.stringify(config.colors, null, 2)}
                    onChange={(e) => handleColorsJsonChange(e.target.value)}
                    className={cn(
                      "w-full h-48 p-2 text-sm font-mono bg-muted rounded border resize-none",
                      jsonError && "border-red-500",
                    )}
                    spellCheck={false}
                  />
                  {jsonError && (
                    <p className="text-xs text-red-500">{jsonError}</p>
                  )}
                </div>
              </div>
            )}

            {activeSection === "editor" && (
              <div className="space-y-6">
                {/* Tamaño de fuente */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tamaño de fuente: {currentFontSize}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    step="1"
                    value={currentFontSize}
                    onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Familia de fuente */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipografía</label>
                  <select
                    value={currentFontFamily}
                    onChange={(e) => onFontFamilyChange(e.target.value)}
                    className="w-full p-2 rounded border bg-background"
                  >
                    {fontFamilies.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
