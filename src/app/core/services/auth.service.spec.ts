import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
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

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created and start without authenticated user', () => {
    expect(service).toBeTruthy();
    expect(service.currentUserValue).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('should login, save token and user, and update currentUser', () => {
    const mockCredentials: LoginRequest = {
      email: 'admin@gestionnegocios.local',
      password: 'Password123*'
    };

    const mockResponse: LoginResponse = {
      token: 'jwt-test-token-xyz',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: {
        id: 1,
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@gestionnegocios.local',
        rol: 'Administrador',
        sucursalId: null
      }
    };

    service.login(mockCredentials).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getToken()).toBe('jwt-test-token-xyz');
      expect(service.hasRole('Administrador')).toBeTrue();
      expect(service.hasRole('Empleado')).toBeFalse();
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout, clear localStorage and redirect to /login', () => {
    spyOn(router, 'navigate');

    // Simulate saved session
    localStorage.setItem('gn_token', 'token-123');
    localStorage.setItem('gn_expires_at', new Date(Date.now() + 3600000).toISOString());
    localStorage.setItem('gn_user', JSON.stringify({ id: 1, email: 'test@local', rol: 'Administrador' }));

    service.logout();

    expect(localStorage.getItem('gn_token')).toBeNull();
    expect(localStorage.getItem('gn_user')).toBeNull();
    expect(service.currentUserValue).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
