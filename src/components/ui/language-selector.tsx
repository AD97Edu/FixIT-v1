import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { GlobeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSelectorProps {
  collapsed?: boolean;
  inSheet?: boolean;
}

export function LanguageSelector({ collapsed = false, inSheet = false }: LanguageSelectorProps) {
  const { t, changeLanguage, currentLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (          <Button
            variant="ghost"
            size="icon"
            className="w-full flex justify-center items-center p-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-primary/80 transition-colors"
          >
            <GlobeIcon className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-primary/80 transition-colors justify-start",
              inSheet && "justify-start"
            )}
          >
            <GlobeIcon className="h-5 w-5 flex-shrink-0" />
            <span className="text-base">{t('language')}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => changeLanguage('en')}
          className={cn(currentLanguage === 'en' && "bg-primary/10 text-primary font-medium")}
        >
          {t('en')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('es')}
          className={cn(currentLanguage === 'es' && "bg-primary/10 text-primary font-medium")}
        >
          {t('es')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 