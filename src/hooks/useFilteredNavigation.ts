import { useUserRole } from '@/hooks/useUserRole';

/**
 * Hook para filtrar los elementos de navegación según el rol del usuario
 * @param items Array de items de navegación
 * @returns Array filtrado según permisos de usuario
 */
export function useFilteredNavigation(items: any[]) {
  const { role, loading } = useUserRole();
  // Si está cargando o no hay rol definido, no mostrar nada
  if (loading || !role) {
    return [];
  }
    // Los usuarios normales solo pueden acceder a tickets, nueva ticket, sugerencias, perfil, ayuda y language
  if (role === 'user') {
    return items.filter(item => {
      // Filtrar para mostrar solo Tickets, NewTicket, Suggestions, Profile, HowItWorks y Language
      // Excluir dashboard y search
      return !['dashboard', 'search'].includes(item.titleKey);
    });
  }
  
  // Los administradores y agentes pueden acceder a todo excepto "How it Works" y "Suggestions"
  return items.filter(item => !['howItWorks', 'suggestions'].includes(item.titleKey));
}

export default useFilteredNavigation;
