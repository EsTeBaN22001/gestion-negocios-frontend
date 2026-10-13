import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-sm-10 col-md-8 col-lg-5">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4 p-sm-5">
              <div class="text-center mb-4">
                <i class="bi bi-shield-lock text-primary" style="font-size: 3rem;"></i>
                <h2 class="fw-bold mt-2">Iniciar Sesión</h2>
                <p class="text-muted small">Sistema de Gestión de Negocios</p>
              </div>

              <!-- Alerta de Error -->
              <div *ngIf="errorMessage" class="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div class="small">{{ errorMessage }}</div>
              </div>

              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
                <!-- Email -->
                <div class="mb-3">
                  <label for="email" class="form-label">Correo electrónico</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                    <input
                      type="email"
                      id="email"
                      formControlName="email"
                      class="form-control"
                      [class.is-invalid]="submitted && f['email'].errors"
                      placeholder="ejemplo@negocio.com"
                      autocomplete="email"
                    />
                  </div>
                  <div *ngIf="submitted && f['email'].errors" class="invalid-feedback d-block">
                    <span *ngIf="f['email'].errors['required']">El correo electrónico es requerido.</span>
                    <span *ngIf="f['email'].errors['email']">Ingrese un correo electrónico válido.</span>
                  </div>
                </div>

                <!-- Password -->
                <div class="mb-4">
                  <label for="password" class="form-label">Contraseña</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-key"></i></span>
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      id="password"
                      formControlName="password"
                      class="form-control"
                      [class.is-invalid]="submitted && f['password'].errors"
                      placeholder="••••••••"
                      autocomplete="current-password"
                    />
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      (click)="togglePasswordVisibility()"
                      tabindex="-1"
                    >
                      <i [class]="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <div *ngIf="submitted && f['password'].errors" class="invalid-feedback d-block">
                    <span *ngIf="f['password'].errors['required']">La contraseña es requerida.</span>
                  </div>
                </div>

                <!-- Botón de Submit con Spinner -->
                <div class="d-grid mb-3">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg"
                    [disabled]="loading"
                  >
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span *ngIf="!loading">Ingresar</span>
                    <span *ngIf="loading">Iniciando sesión...</span>
                  </button>
                </div>
              </form>

              <!-- Información para pruebas en desarrollo -->
              <div class="mt-4 pt-3 border-top text-center text-muted small">
                <p class="mb-1"><strong>Credenciales de desarrollo:</strong></p>
                <div>Admin: <code>admin&#64;gestionnegocios.local</code> / <code>Admin123*</code></div>
                <div>Empleado: <code>empleado&#64;gestionnegocios.local</code> / <code>Empleado123*</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage: string | null = null;
  showPassword = false;
  returnUrl = '/';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // Obtener returnUrl de los query parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    this.authService.login({
      email: this.f['email'].value,
      password: this.f['password'].value
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = 'Credenciales incorrectas o la cuenta se encuentra desactivada.';
        } else if (err.status === 400) {
          this.errorMessage = 'Los datos enviados son inválidos. Verifique el formato del email y contraseña.';
        } else if (err.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifique que la API esté iniciada.';
        } else {
          this.errorMessage = err.error?.detail || err.error?.title || 'Ocurrió un error al intentar iniciar sesión.';
        }
      }
    });
  }
}
