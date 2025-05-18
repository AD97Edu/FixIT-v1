import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, FileText, Calendar, Search, User, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/hooks/useLanguage";

// Definimos los navItems pero usaremos las traducciones para los títulos
const navItems = [
  {
    titleKey: "dashboard",
    icon: Home,
    path: "/"
  },
  {
    titleKey: "tickets",
    icon: FileText,
    path: "/tickets"
  },
  {
    titleKey: "newTicket",
    icon: Calendar,
    path: "/tickets/new"
  },
  {
    titleKey: "search",
    icon: Search,
    path: "/search"
  },
  {
    titleKey: "profile",
    icon: User,
    path: "/profile"
  }
];

interface AppSidebarProps {
  hideHeader?: boolean;
  inSheet?: boolean;
  collapsed?: boolean;
}

export function AppSidebar({ hideHeader, inSheet = false, collapsed = false }: AppSidebarProps) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { t } = useLanguage();

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Renderizado condicional del NavItem según si está dentro de un Sheet o no
  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    // Si está en Sheet, siempre mostrar con texto y envolver con SheetClose
    if (inSheet) {
      return (
        <SheetClose asChild>
          <NavLink 
            to={item.path} 
            className={({isActive}) => cn(
              "flex items-center gap-3 p-3 rounded-md w-full transition-colors", 
              isActive 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-gray-600 hover:bg-gray-100 hover:text-primary/80"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-base">{t(item.titleKey)}</span>
          </NavLink>
        </SheetClose>
      );
    }
    
    // Si está colapsado en desktop, mostrar solo iconos con tooltip
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink 
              to={item.path} 
              className={({isActive}) => cn(
                "flex items-center justify-center p-3 rounded-md w-full transition-colors", 
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-primary/80"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{t(item.titleKey)}</TooltipContent>
        </Tooltip>
      );
    }
    
    // Modo normal en desktop, con texto e icono
    return (
      <NavLink 
        to={item.path} 
        className={({isActive}) => cn(
          "flex items-center gap-3 p-3 rounded-md w-full transition-colors", 
          isActive 
            ? "bg-primary/10 text-primary font-medium" 
            : "text-gray-600 hover:bg-gray-100 hover:text-primary/80"
        )}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-base">{t(item.titleKey)}</span>
      </NavLink>
    );
  };

  // Especial para el botón de Logout
  const LogoutButton = () => {
    // Si está en Sheet, envolver con SheetClose
    if (inSheet) {
      return (
        <SheetClose asChild>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-md w-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="text-base">{t('logout')}</span>
          </button>
        </SheetClose>
      );
    }
    
    // Si está colapsado en desktop, mostrar solo iconos con tooltip
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-3 rounded-md w-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('logout')}</TooltipContent>
        </Tooltip>
      );
    }
    
    // Modo normal en desktop, con texto e icono
    return (
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 rounded-md w-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
      >
        <LogOut className="h-5 w-5 flex-shrink-0" />
        <span className="text-base">{t('logout')}</span>
      </button>
    );
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "shrink-0 bg-white h-full flex flex-col",
        collapsed ? "w-[64px]" : "w-64"
      )}>
        {/* Encabezado - solo visible si no está oculto */}
        {!hideHeader && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between md:justify-center">
              <img src="https://i.postimg.cc/W4bh4T86/Fixit-LOGO.png" alt="Logo FixIT" width={150} style={{ display: "block" }} />
              {isMobile && inSheet && (
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              )}
            </div>
            {!collapsed && (
              <p className="text-xs text-gray-500 text-center mt-1">{t('quickIssueResolution')}</p>
            )}
          </div>
        )}

        {/* Navegación */}
        <div className={cn(
          "p-2 flex-1 flex flex-col",
          collapsed ? "px-1" : "p-4"
        )}>
          {!collapsed && (
            <div className="mb-4 text-sm font-medium text-gray-500 px-2">{t('navigation')}</div>
          )}
          <nav className="space-y-2 flex-1 flex flex-col">
            {navItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
            {/* Añadimos el selector de idioma antes del botón de logout */}
            <LanguageSelector collapsed={collapsed} inSheet={inSheet} />
          </nav>
          {/* Botón de logout siempre abajo */}
          <div className={cn(
            "mt-auto pt-2",
            collapsed ? "flex justify-center" : ""
          )}>
            <LogoutButton />
          </div>
        </div>

        {/* Footer - solo visible si no está colapsado */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-500">
            {t('version')}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
