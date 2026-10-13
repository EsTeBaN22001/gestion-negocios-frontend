import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with invalid empty form', () => {
    expect(component.loginForm.valid).toBeFalse();
    expect(component.loginForm.get('email')?.valid).toBeFalse();
    expect(component.loginForm.get('password')?.valid).toBeFalse();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTrue();

    emailControl?.setValue('valid@example.com');
    expect(emailControl?.hasError('email')).toBeFalse();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  it('should submit valid credentials and redirect', () => {
    spyOn(authService, 'login').and.returnValue(of({
      token: 'fake-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: {
        id: 1,
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@gestionnegocios.local',
        rol: 'Administrador'
      }
    }));
    spyOn(router, 'navigateByUrl');

    component.loginForm.setValue({
      email: 'admin@gestionnegocios.local',
      password: 'Password123*'
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should display error message on 401 unauthorized', () => {
    spyOn(authService, 'login').and.returnValue(throwError(() => ({ status: 401 })));

    component.loginForm.setValue({
      email: 'admin@gestionnegocios.local',
      password: 'WrongPassword*'
    });

    component.onSubmit();

    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toContain('Credenciales incorrectas');
  });
});
