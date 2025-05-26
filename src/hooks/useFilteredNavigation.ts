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
      // Excluir dashboard, search, adminSuggestions y adminHowItWorks
      return !['dashboard', 'search', 'adminSuggestions', 'adminHowItWorks'].includes(item.titleKey);
    });
  }

  // Los agentes pueden acceder a todo excepto "How it Works", "Suggestions", "adminSuggestions" y "adminHowItWorks"
  if (role === 'agent') {
    return items.filter(item => !['howItWorks', 'suggestions', 'adminSuggestions', 'adminHowItWorks'].includes(item.titleKey));
  }
  
  // Los administradores pueden acceder a todo excepto "How it Works" y "Suggestions" (pero sí a adminSuggestions y adminHowItWorks)
  return items.filter(item => {
    // No mostrar la vista de "How it Works" para usuarios normales, mostrar la vista de admin
    if (item.titleKey === 'howItWorks') {
      return false;
    }
    
    // No mostrar sugerencias de usuarios normales
    if (item.titleKey === 'suggestions') {
      return false;
    }
    
    // Solo mostrar elementos exclusivos para admin si el usuario es admin
    if (item.adminOnly === true && role !== 'admin') {
      return false;
    }
    
    return true;
  });
}

export default useFilteredNavigation;
