import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, FileText, Calendar, Search, User, LogOut, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLanguage } from "@/hooks/useLanguage";
import { useFilteredNavigation } from "@/hooks/useFilteredNavigation";

// Definimos los navItems pero usaremos las traducciones para los títulos
const navItems = [
	{
		titleKey: "howItWorks",
		icon: HelpCircle,
		path: "/how-it-works",
	},
	{
		titleKey: "adminHowItWorks",
		icon: HelpCircle,
		path: "/admin/how-it-works",
		adminOnly: true,
	},
	{
		titleKey: "dashboard",
		icon: Home,
		path: "/",
	},
	{
		titleKey: "tickets",
		icon: FileText,
		path: "/tickets",
	},
	{
		titleKey: "newTicket",
		icon: Calendar,
		path: "/tickets/new",
	},
	{
		titleKey: "suggestions",
		icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
		path: "/suggestions",
	},
	{
		titleKey: "adminSuggestions",
		icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
		path: "/admin/suggestions",
		adminOnly: true,
	},
	{
		titleKey: "profile",
		icon: User,
		path: "/profile",
	},
];

interface AppSidebarProps {
	hideHeader?: boolean;
	inSheet?: boolean;
	collapsed?: boolean;
}

export function AppSidebar({
	hideHeader,
	inSheet = false,
	collapsed = false,
}: AppSidebarProps) {
	const navigate = useNavigate();
	const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
	const { t } = useLanguage();
	// Obtenemos los items de navegación filtrados según el rol del usuario
	const filteredNavItems = useFilteredNavigation(navItems);

	// Detectar cambios en el tamaño de pantalla
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 1000);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleLogout = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			toast.success("Logged out successfully");
			navigate("/auth");
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toast.error(errorMessage);
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
						className={({ isActive }) =>
							cn(
								"flex items-center gap-3 p-3 rounded-md w-full transition-colors",
								isActive
									? "bg-sidebar-accent text-sidebar-primary font-medium"
									: "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-primary/80"
							)
						}
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
							className={({ isActive }) =>
								cn(
									"flex items-center justify-center p-3 rounded-md w-full transition-colors",
									isActive
										? "bg-sidebar-accent text-sidebar-primary font-medium"
										: "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-primary/80"
								)
							}
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
				className={({ isActive }) =>
					cn(
						"flex items-center gap-3 p-3 rounded-md w-full transition-colors",
						isActive
							? "bg-sidebar-accent text-sidebar-primary font-medium"
							: "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-primary/80"
					)
				}
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
						className="flex items-center gap-3 p-3 rounded-md w-full text-destructive hover:bg-destructive/10 transition-colors"
					>
						<LogOut className="h-5 w-5 flex-shrink-0" />
						<span className="text-base">{t("logout")}</span>
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
							className="flex items-center justify-center p-3 rounded-md w-full text-destructive hover:bg-destructive/10 transition-colors"
						>
							<LogOut className="h-5 w-5 flex-shrink-0" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">{t("logout")}</TooltipContent>
				</Tooltip>
			);
		}

		// Modo normal en desktop, con texto e icono
		return (
			<button
				onClick={handleLogout}
				className="flex items-center gap-3 p-3 rounded-md w-full text-destructive hover:bg-destructive/10 transition-colors"
			>
				<LogOut className="h-5 w-5 flex-shrink-0" />
				<span className="text-base">{t("logout")}</span>
			</button>
		);
	};
	return (
		<TooltipProvider>
			<div
				className={cn(
					"shrink-0 bg-sidebar-background h-full flex flex-col text-sidebar-foreground",
					collapsed ? "w-[64px]" : "w-64"
				)}
			>				{/* Encabezado - solo visible si no está oculto */}
				{!hideHeader && (
					<div className="p-4 border-b border-sidebar-border">
						<div className="flex items-center justify-between md:justify-center">
							<img
								src="https://i.postimg.cc/W4bh4T86/Fixit-LOGO.png"
								alt="Logo FixIT"
								width={150}
								style={{ display: "block" }}
							/>
							{isMobile && inSheet && (
								<SheetClose asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 md:hidden"
									>
										<X className="h-5 w-5" />
									</Button>
								</SheetClose>
							)}
						</div>
						{!collapsed && (
							<p className="text-xs text-muted-foreground text-center mt-1">
								{t("quickIssueResolution")}
							</p>
						)}
					</div>
				)}				{/* Navegación */}
				<div
					className={cn(
						"p-2 flex-1 flex flex-col",
						collapsed ? "px-1" : "p-4"
					)}
				>
					{!collapsed && (
						<div className="mb-4 text-sm font-medium text-muted-foreground px-2">
							{t("navigation")}
						</div>
					)}<nav className="space-y-2 flex-1 flex flex-col">
						{filteredNavItems.map((item) => (
							<NavItem key={item.path} item={item} />
						))}
						{/* Añadimos el selector de idioma antes del botón de logout */}
						<LanguageSelector collapsed={collapsed} inSheet={inSheet} />
					</nav>					{/* Botón de logout siempre abajo */}
					<div
						className={cn(
							"mt-auto pt-2 space-y-1",
							collapsed ? "flex flex-col items-center" : ""
						)}
					>
						{/* Añadimos el botón para alternar el tema justo encima del botón de logout */}
						<ThemeToggle collapsed={collapsed} inSheet={inSheet} />
						<LogoutButton />
					</div>
				</div>				{/* Footer - solo visible si no está colapsado */}
				{!collapsed && (
					<div className="p-4 border-t border-sidebar-border text-xs text-center text-muted-foreground">
						{t("version")}
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}
