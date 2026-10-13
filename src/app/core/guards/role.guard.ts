import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para restringir rutas según el rol del usuario (ej: Administrador).
 * Los guards de frontend son para experiencia de usuario y navegación;
 * la autorización real reside estrictamente en el backend.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const expectedRole = route.data?.['role'] as string | undefined;
  const expectedRoles = route.data?.['roles'] as string[] | undefined;

  if (expectedRole && authService.hasRole(expectedRole)) {
    return true;
  }

  if (expectedRoles && expectedRoles.some((r) => authService.hasRole(r))) {
    return true;
  }

  // Usuario autenticado pero sin rol suficiente
  return router.createUrlTree(['/']);
};
