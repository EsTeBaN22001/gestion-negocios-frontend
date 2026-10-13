import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Interceptor HTTP funcional de Angular para adjuntar el token JWT Bearer
 * y manejar respuestas 401 Unauthorized de forma centralizada.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Adjuntar token si la solicitud apunta al backend y no es el endpoint de login
  const isApiUrl = req.url.startsWith(environment.apiBaseUrl);
  const isLoginUrl = req.url.includes('/api/auth/login');
  const token = authService.getToken();

  let authReq = req;
  if (isApiUrl && !isLoginUrl && token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si la API responde 401 Unauthorized y no estábamos ya en el login
      if (error.status === 401 && !isLoginUrl) {
        // Limpiar sesión expirada o no autorizada
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
