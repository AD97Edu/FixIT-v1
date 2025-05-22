import { UserRole } from '@/types';

/**
 * Determina la ruta a la que se debe redirigir a un usuario después del inicio de sesión,
 * basado en su rol.
 */
export function getHomeRouteForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'admin':
    case 'agent':
      return '/'; // Los administradores y agentes van al dashboard
    case 'user':
    default:
      return '/tickets'; // Los usuarios normales van a la lista de tickets
  }
}
