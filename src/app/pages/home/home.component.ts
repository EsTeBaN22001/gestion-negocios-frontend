import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

/**
 * Pantalla inicial de infraestructura.
 * Demuestra que Angular funciona y puede comunicarse con la API.
 * No es una funcionalidad de negocio.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">

          <div class="text-center mb-4">
            <h1 class="display-5 fw-bold">Sistema de Gestión de Negocios</h1>
            <p class="text-muted">Infraestructura Fase 0 — Verificación de conectividad</p>
          </div>

          <!-- Estado de la API -->
          <div class="card mb-3">
            <div class="card-header d-flex align-items-center">
              <i class="bi bi-server me-2"></i>
              <strong>API Backend</strong>
            </div>
            <div class="card-body">
              <div *ngIf="apiLoading" class="d-flex align-items-center text-muted">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Verificando conexión...
              </div>
              <div *ngIf="!apiLoading && apiStatus" class="d-flex align-items-center text-success">
                <i class="bi bi-check-circle-fill me-2 fs-5"></i>
                <div>
                  <strong>Conectado</strong>
                  <div class="small text-muted">Ambiente: {{ apiStatus.environment }} — {{ apiStatus.timestamp | date:'medium' }}</div>
                </div>
              </div>
              <div *ngIf="!apiLoading && apiError" class="d-flex align-items-center text-danger">
                <i class="bi bi-x-circle-fill me-2 fs-5"></i>
                <div>
                  <strong>Sin conexión</strong>
                  <div class="small">{{ apiError }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado de MySQL -->
          <div class="card mb-3">
            <div class="card-header d-flex align-items-center">
              <i class="bi bi-database me-2"></i>
              <strong>Base de Datos (MySQL)</strong>
            </div>
            <div class="card-body">
              <div *ngIf="dbLoading" class="d-flex align-items-center text-muted">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Verificando base de datos...
              </div>
              <div *ngIf="!dbLoading && dbStatus" class="d-flex align-items-center text-success">
                <i class="bi bi-check-circle-fill me-2 fs-5"></i>
                <div>
                  <strong>Conectada</strong>
                  <div class="small text-muted">Estado: {{ dbStatus.database }}</div>
                </div>
              </div>
              <div *ngIf="!dbLoading && dbError" class="d-flex align-items-center text-warning">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>
                  <strong>No disponible</strong>
                  <div class="small">{{ dbError }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Acción de re-verificar -->
          <div class="text-center">
            <button class="btn btn-primary" (click)="checkConnectivity()" [disabled]="apiLoading || dbLoading">
              <i class="bi bi-arrow-clockwise me-1"></i>
              Verificar conectividad
            </button>
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

  constructor(private apiService: ApiService) {}

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
}
