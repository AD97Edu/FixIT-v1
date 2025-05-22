import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface ThemeToggleProps {
  collapsed?: boolean;
  inSheet?: boolean;
}

export function ThemeToggle({ collapsed = false, inSheet = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const ThemeIcon = theme === "dark" ? Sun : Moon;
  
  const handleToggle = () => {
    toggleTheme();
  };

  if (inSheet) {
    return (
      <SheetClose asChild>
        <button
          onClick={handleToggle}
          className="flex items-center gap-3 p-3 rounded-md w-full text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-primary/80 transition-colors"
        >
          <ThemeIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-base">{theme === "dark" ? t('lightMode') : t('darkMode')}</span>
        </button>
      </SheetClose>
    );
  }
  
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggle}
            className="flex items-center justify-center p-3 rounded-md w-full text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-primary/80 transition-colors"
          >
            <ThemeIcon className="h-5 w-5 flex-shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {theme === "dark" ? t('lightMode') : t('darkMode')}
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-3 p-3 rounded-md w-full text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-primary/80 transition-colors"
    >
      <ThemeIcon className="h-5 w-5 flex-shrink-0" />
      <span className="text-base">{theme === "dark" ? t('lightMode') : t('darkMode')}</span>
    </button>
  );
}
