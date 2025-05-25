import { UserRole } from '@/hooks/useUserRole';

/**
 * Determina la ruta a la que se debe redirigir a un usuario después del inicio de sesión,
 * basado en su rol.
 */
export function getHomeRouteForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/'; // Los administradores van al dashboard
    case 'user':
    default:
      return '/how-it-works'; // Los usuarios normales van a la página "Cómo funciona"
  }
}
