import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Menu, ArrowLeftToLine, ArrowRightToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar en desktop (plegable) */}
      <div 
        className={cn(
          "border-r border-gray-200 bg-white transition-all duration-300 ease-in-out hidden md:flex flex-col",
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
            <ArrowRightToLine className="h-5 w-5 text-gray-600" />
          ) : (
            <ArrowLeftToLine className="h-5 w-5 text-gray-600" />
          )}
        </Button>

        <div className="flex-1 overflow-y-auto">
          <AppSidebar hideHeader={sidebarCollapsed} collapsed={sidebarCollapsed} />
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-auto bg-gradient-to-br from-blue-50/40 to-slate-50">
        {/* Header con botón hamburguesa (visible en móvil y escritorio) */}
        <header className="flex items-center p-4 border-b bg-white/80 backdrop-blur-sm">
          {/* Mobile burger menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-6 w-6 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-full max-w-[280px]">
                <div className="h-full flex flex-col">
                  <AppSidebar hideHeader={true} inSheet={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <h1 className="ml-3 text-xl font-bold text-primary">FixIT</h1>
        </header>
        
        <div className="w-full py-6 px-4 md:px-6 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
