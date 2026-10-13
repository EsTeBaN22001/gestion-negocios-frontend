import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('Guards', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('authGuard', () => {
    it('should allow access if authenticated', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      const route = {} as ActivatedRouteSnapshot;
      const state = { url: '/dashboard' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));
      expect(result).toBeTrue();
    });

    it('should redirect to /login if not authenticated', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(false);
      const route = {} as ActivatedRouteSnapshot;
      const state = { url: '/dashboard' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));
      expect(result.toString()).toContain('/login');
    });
  });

  describe('roleGuard', () => {
    it('should allow access if user has required role', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'hasRole').and.returnValue(true);
      const route = { data: { role: 'Administrador' } } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/admin' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => roleGuard(route, state));
      expect(result).toBeTrue();
    });

    it('should redirect to / if user does not have required role', () => {
      spyOn(authService, 'isAuthenticated').and.returnValue(true);
      spyOn(authService, 'hasRole').and.returnValue(false);
      const route = { data: { role: 'Administrador' } } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/admin' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => roleGuard(route, state));
      expect(result.toString()).toEqual('/');
    });
  });
});
