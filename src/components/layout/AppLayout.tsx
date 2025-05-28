import React, { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { Menu, ArrowLeftToLine, ArrowRightToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Overlay difuminado para móvil cuando el sidebar está abierto */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent backdrop-blur-md z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar en desktop (plegable) */}
      <div
        className={cn(
          "border-r border-sidebar-border bg-sidebar-background transition-all duration-300 ease-in-out hidden md:flex flex-col overflow-hidden",
          sidebarCollapsed ? "w-[64px]" : "w-64"
        )}
      >
        {/* Botón para plegar/desplegar en desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 self-end m-2"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ArrowRightToLine className="h-5 w-5 text-sidebar-foreground" />
          ) : (
            <ArrowLeftToLine className="h-5 w-5 text-sidebar-foreground" />
          )}
        </Button>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AppSidebar
            hideHeader={sidebarCollapsed}
            collapsed={sidebarCollapsed}
          />
        </div>
      </div>
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-auto bg-background min-w-0">
        {/* Header con botón hamburguesa (visible en móvil y escritorio) */}
        <header
          className={`sticky top-0 z-50 flex items-center p-4 border-b border-border bg-background/80 backdrop-blur-sm transition-all duration-200 ${
            isScrolled ? "opacity-70" : "opacity-100"
          }`}
        >
          {" "}
          {/* Mobile burger menu */}
          <div className="md:hidden">
            <Sheet
              open={isMobileSidebarOpen}
              onOpenChange={setIsMobileSidebarOpen}
            >
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-6 w-6 text-foreground" />
                </Button>
              </SheetTrigger>{" "}
              <SheetContent
                side="left"
                className="p-0 max-w-[230px] overflow-x-hidden z-50 border-r-0"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Use the navigation menu to access different sections of the
                  app.
                </SheetDescription>
                <div className="h-full flex flex-col overflow-x-hidden bg-sidebar-background/95 backdrop-blur-sm">
                  <AppSidebar hideHeader={false} inSheet={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <h1 className="ml-3 text-xl font-bold text-primary truncate">
            FixIT
          </h1>
        </header>
        <div className="flex-1 py-6 px-4 md:px-6 overflow-x-hidden">
          <div className="w-full h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
