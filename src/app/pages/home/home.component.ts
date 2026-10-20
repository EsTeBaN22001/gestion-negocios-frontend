import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Pantalla principal con verificación de conectividad y pruebas de autenticación de Fase 2.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container my-5">
      <div class="row justify-content-center">
        <div class="col-lg-10">

          <div class="text-center mb-5">
            <h1 class="display-6 fw-bold">Sistema de Gestión de Negocios</h1>
            <p class="text-muted">Fase 2 — Autenticación y Autorización con JWT</p>
          </div>

          <!-- 1. Estado de Sesión y Autenticación (Fase 2) -->
          <div class="card mb-4 border-primary shadow-sm">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <i class="bi bi-shield-lock-fill me-2 fs-5"></i>
                <strong>Estado de Autenticación (JWT)</strong>
              </div>
              <span class="badge" [ngClass]="authService.isAuthenticated() ? 'bg-success' : 'bg-warning text-dark'">
                {{ authService.isAuthenticated() ? 'Sesión Activa' : 'No Autenticado' }}
              </span>
            </div>
            <div class="card-body">
              <ng-container *ngIf="authService.currentUser$ | async as user; else noAuthCard">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <p class="mb-1 text-muted small">Usuario autenticado:</p>
                    <h5 class="fw-bold mb-0">{{ user.nombre }} {{ user.apellido }}</h5>
                    <div class="text-muted small">{{ user.email }}</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <p class="mb-1 text-muted small">Rol y Sucursal:</p>
                    <div>
                      <span class="badge" [ngClass]="user.rol === 'Administrador' ? 'bg-danger' : 'bg-primary'">
                        {{ user.rol }}
                      </span>
                      <span class="badge bg-secondary ms-2" *ngIf="user.sucursalId">
                        Sucursal ID: {{ user.sucursalId }}
                      </span>
                      <span class="badge bg-info ms-2" *ngIf="!user.sucursalId">
                        Todas las sucursales
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Botones de prueba de endpoints protegidos -->
                <div class="pt-3 border-top d-flex flex-wrap gap-2">
                  <button
                    class="btn btn-outline-primary"
                    (click)="testMeEndpoint()"
                    [disabled]="testingMe"
                  >
                    <span *ngIf="testingMe" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="!testingMe" class="bi bi-person-badge me-1"></i>
                    Probar GET /api/auth/me
                  </button>

                  <button
                    class="btn btn-outline-danger"
                    (click)="testAdminEndpoint()"
                    [disabled]="testingAdmin"
                  >
                    <span *ngIf="testingAdmin" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="!testingAdmin" class="bi bi-lock me-1"></i>
                    Probar GET /api/auth/admin-check (Solo Admin)
                  </button>

                  <button class="btn btn-outline-secondary" (click)="authService.logout()">
                    <i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión
                  </button>
                </div>

                <!-- Respuestas de pruebas -->
                <div *ngIf="meResult" class="mt-3 alert alert-info small mb-0">
                  <strong>Respuesta /api/auth/me:</strong>
                  <pre class="mb-0 mt-1"><code>{{ meResult | json }}</code></pre>
                </div>

                <div *ngIf="adminResult" class="mt-3 alert small mb-0" [ngClass]="adminResult.status === 200 ? 'alert-success' : 'alert-danger'">
                  <strong>Respuesta /api/auth/admin-check (Status {{ adminResult.status }}):</strong>
                  <pre class="mb-0 mt-1"><code>{{ adminResult.data | json }}</code></pre>
                </div>
              </ng-container>

              <ng-template #noAuthCard>
                <div class="text-center py-3">
                  <p class="text-muted mb-3">No hay un token JWT activo en este momento.</p>
                  <a routerLink="/login" class="btn btn-primary">
                    <i class="bi bi-box-arrow-in-right me-1"></i> Ir a Iniciar Sesión
                  </a>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- 2. Módulos de Catálogo y Stock (Fase 4) -->
          <div class="card mb-4 border-info shadow-sm" *ngIf="authService.isAuthenticated()">
            <div class="card-header bg-info text-dark">
              <i class="bi bi-box-seam-fill me-2"></i>
              <strong>Catálogo y Control de Stock (Fase 4)</strong>
            </div>
            <div class="card-body">
              <p class="text-muted small mb-3">Consulta de artículos, precios e inventario físico por sucursal:</p>
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="card h-100 border text-center p-3 shadow-none">
                    <i class="bi bi-box-seam text-primary fs-1 mb-2"></i>
                    <h5 class="fw-bold mb-1">Catálogo de Productos</h5>
                    <p class="text-muted small mb-3">Artículos registrados, categorías, precios y stock global</p>
                    <a routerLink="/productos" class="btn btn-outline-primary btn-sm mt-auto">
                      <i class="bi bi-arrow-right-circle me-1"></i> Ir a Productos
                    </a>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card h-100 border text-center p-3 shadow-none">
                    <i class="bi bi-boxes text-info fs-1 mb-2"></i>
                    <h5 class="fw-bold mb-1">Control de Stock</h5>
                    <p class="text-muted small mb-3">Existencias físicas, alertas de reposición y ajustes manuales</p>
                    <a routerLink="/stock" class="btn btn-outline-info btn-sm mt-auto">
                      <i class="bi bi-arrow-right-circle me-1"></i> Ir a Stock
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Módulos de Administración (Fase 3) -->
          <div class="card mb-4 border-success shadow-sm" *ngIf="authService.hasRole('Administrador')">
            <div class="card-header bg-success text-white">
              <i class="bi bi-grid-fill me-2"></i>
              <strong>Módulos de Gestión Base (Fase 3)</strong>
            </div>
            <div class="card-body">
              <p class="text-muted small mb-3">Acceso rápido a los módulos CRUD con paginación y búsqueda server-side:</p>
              <div class="row g-3">
                <div class="col-md-4">
                  <div class="card h-100 border text-center p-3 shadow-none">
                    <i class="bi bi-buildings text-primary fs-1 mb-2"></i>
                    <h5 class="fw-bold mb-1">Sucursales</h5>
                    <p class="text-muted small mb-3">Gestión de puntos de venta y asignación física</p>
                    <a routerLink="/sucursales" class="btn btn-outline-primary btn-sm mt-auto">
                      <i class="bi bi-arrow-right-circle me-1"></i> Ir a Sucursales
                    </a>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card h-100 border text-center p-3 shadow-none">
                    <i class="bi bi-tags text-success fs-1 mb-2"></i>
                    <h5 class="fw-bold mb-1">Categorías</h5>
                    <p class="text-muted small mb-3">Organización y catálogo de familias de productos</p>
                    <a routerLink="/categorias" class="btn btn-outline-success btn-sm mt-auto">
                      <i class="bi bi-arrow-right-circle me-1"></i> Ir a Categorías
                    </a>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card h-100 border text-center p-3 shadow-none">
                    <i class="bi bi-people text-info fs-1 mb-2"></i>
                    <h5 class="fw-bold mb-1">Usuarios</h5>
                    <p class="text-muted small mb-3">Gestión de cuentas, credenciales y roles</p>
                    <a routerLink="/usuarios" class="btn btn-outline-info btn-sm mt-auto">
                      <i class="bi bi-arrow-right-circle me-1"></i> Ir a Usuarios
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Estado de Infraestructura (Fase 0) -->
          <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <div>
                <i class="bi bi-server me-2"></i>
                <strong>Infraestructura Backend & Base de Datos</strong>
              </div>
              <button class="btn btn-sm btn-outline-secondary" (click)="checkConnectivity()" [disabled]="apiLoading || dbLoading">
                <i class="bi bi-arrow-clockwise"></i> Re-verificar
              </button>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <!-- API -->
                <div class="col-md-6">
                  <div class="p-3 border rounded bg-light">
                    <div class="fw-semibold mb-2"><i class="bi bi-hdd-network me-1"></i> API Backend (/api/health)</div>
                    <div *ngIf="apiLoading" class="text-muted small">
                      <div class="spinner-border spinner-border-sm me-1"></div> Verificando...
                    </div>
                    <div *ngIf="!apiLoading && apiStatus" class="text-success small">
                      <i class="bi bi-check-circle-fill me-1"></i> Activo ({{ apiStatus.environment }})
                    </div>
                    <div *ngIf="!apiLoading && apiError" class="text-danger small">
                      <i class="bi bi-x-circle-fill me-1"></i> {{ apiError }}
                    </div>
                  </div>
                </div>

                <!-- MySQL -->
                <div class="col-md-6">
                  <div class="p-3 border rounded bg-light">
                    <div class="fw-semibold mb-2"><i class="bi bi-database me-1"></i> MySQL (/api/health/db)</div>
                    <div *ngIf="dbLoading" class="text-muted small">
                      <div class="spinner-border spinner-border-sm me-1"></div> Verificando...
                    </div>
                    <div *ngIf="!dbLoading && dbStatus" class="text-success small">
                      <i class="bi bi-check-circle-fill me-1"></i> Conectado ({{ dbStatus.database }})
                    </div>
                    <div *ngIf="!dbLoading && dbError" class="text-warning small">
                      <i class="bi bi-exclamation-triangle-fill me-1"></i> {{ dbError }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  apiLoading = true;
  dbLoading = true;
  apiStatus: any = null;
  apiError: string | null = null;
  dbStatus: any = null;
  dbError: string | null = null;

  testingMe = false;
  meResult: any = null;

  testingAdmin = false;
  adminResult: { status: number; data: any } | null = null;

  constructor(
    private apiService: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkConnectivity();
  }

  checkConnectivity(): void {
    this.apiLoading = true;
    this.dbLoading = true;
    this.apiStatus = null;
    this.apiError = null;
    this.dbStatus = null;
    this.dbError = null;

    this.apiService.getHealth().subscribe({
      next: (response) => {
        this.apiStatus = response;
        this.apiLoading = false;
      },
      error: (err) => {
        this.apiError = err.message || 'No se pudo conectar con la API.';
        this.apiLoading = false;
      }
    });

    this.apiService.getHealthDb().subscribe({
      next: (response) => {
        this.dbStatus = response;
        this.dbLoading = false;
      },
      error: (err) => {
        this.dbError = 'La API no puede conectarse a la base de datos.';
        this.dbLoading = false;
      }
    });
  }

  testMeEndpoint(): void {
    this.testingMe = true;
    this.meResult = null;
    this.authService.getMe().subscribe({
      next: (data) => {
        this.meResult = data;
        this.testingMe = false;
      },
      error: (err) => {
        this.meResult = { error: err.status, message: err.message };
        this.testingMe = false;
      }
    });
  }

  testAdminEndpoint(): void {
    this.testingAdmin = true;
    this.adminResult = null;
    this.authService.checkAdmin().subscribe({
      next: (data) => {
        this.adminResult = { status: 200, data };
        this.testingAdmin = false;
      },
      error: (err) => {
        this.adminResult = {
          status: err.status,
          data: err.error || { message: err.statusText }
        };
        this.testingAdmin = false;
      }
    });
  }
}
