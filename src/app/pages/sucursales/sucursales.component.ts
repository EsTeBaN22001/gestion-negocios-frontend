import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SucursalService } from '../../core/services/sucursal.service';
import { Sucursal } from '../../core/models/sucursal.model';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Encabezado y botón nuevo -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 class="fw-bold mb-1"><i class="bi bi-buildings text-primary me-2"></i>Gestión de Sucursales</h2>
          <p class="text-muted small mb-0">Administración de sucursales físicas del negocio</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="bi bi-plus-lg me-1"></i> Nueva Sucursal
        </button>
      </div>

      <!-- Alertas de notificación -->
      <div *ngIf="alertMessage" class="alert alert-dismissible fade show" [ngClass]="alertType === 'success' ? 'alert-success' : 'alert-danger'" role="alert">
        <i class="bi" [ngClass]="alertType === 'success' ? 'bi-check-circle-fill me-2' : 'bi-exclamation-triangle-fill me-2'"></i>
        {{ alertMessage }}
        <button type="button" class="btn-close" (click)="alertMessage = null"></button>
      </div>

      <!-- Filtros y búsqueda server-side -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-center">
            <div class="col-md-6 col-lg-4">
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Buscar por nombre, dirección o teléfono..."
                  [value]="searchTerm"
                  (input)="onSearchInput($event)"
                />
              </div>
            </div>
            <div class="col-md-4 col-lg-3">
              <select class="form-select" [value]="filterActivas" (change)="onFilterChange($event)">
                <option value="all">Todas las sucursales</option>
                <option value="active">Solo activas</option>
                <option value="inactive">Solo inactivas</option>
              </select>
            </div>
            <div class="col-md-2 text-md-end ms-auto">
              <span class="text-muted small">Total: <strong>{{ totalItems }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de sucursales -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 70px;">ID</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Empleados</th>
                <th>Estado</th>
                <th style="width: 140px;" class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="7" class="text-center py-5">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Cargando sucursales...
                </td>
              </tr>
              <tr *ngIf="!loading && sucursales.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No se encontraron sucursales con los criterios especificados.
                </td>
              </tr>
              <tr *ngFor="let s of sucursales">
                <td class="fw-semibold text-muted">#{{ s.id }}</td>
                <td class="fw-bold">{{ s.nombre }}</td>
                <td>{{ s.direccion || '—' }}</td>
                <td>{{ s.telefono || '—' }}</td>
                <td>
                  <span class="badge bg-light text-dark border">
                    <i class="bi bi-people me-1"></i>{{ s.usuariosCount || 0 }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="s.activa ? 'bg-success' : 'bg-secondary'">
                    {{ s.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="openEditModal(s)" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    (click)="confirmDelete(s)"
                    title="Eliminar o Desactivar"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación Server-side -->
        <div class="card-footer bg-white d-flex justify-content-between align-items-center py-3" *ngIf="totalPages > 1">
          <div class="small text-muted">
            Página {{ page }} de {{ totalPages }}
          </div>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page <= 1">
              <button class="page-link" (click)="changePage(page - 1)" [disabled]="page <= 1">Anterior</button>
            </li>
            <li class="page-item" *ngFor="let p of getPageArray()" [class.active]="p === page">
              <button class="page-link" (click)="changePage(p)">{{ p }}</button>
            </li>
            <li class="page-item" [class.disabled]="page >= totalPages">
              <button class="page-link" (click)="changePage(page + 1)" [disabled]="page >= totalPages">Siguiente</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Modal para Crear / Editar -->
      <div class="modal fade" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">
                {{ isEditing ? 'Editar Sucursal' : 'Nueva Sucursal' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <form [formGroup]="sucursalForm" (ngSubmit)="saveSucursal()">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="nombre"
                    [class.is-invalid]="submitted && f['nombre'].errors"
                    placeholder="Ej: Sucursal Central"
                  />
                  <div *ngIf="submitted && f['nombre'].errors" class="invalid-feedback">
                    <span *ngIf="f['nombre'].errors['required']">El nombre es obligatorio.</span>
                    <span *ngIf="f['nombre'].errors['maxlength']">Máximo 100 caracteres.</span>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Dirección</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="direccion"
                    placeholder="Ej: Av. Corrientes 1234"
                  />
                </div>

                <div class="mb-3">
                  <label class="form-label">Teléfono</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="telefono"
                    placeholder="Ej: 011-4567-8900"
                  />
                </div>

                <div class="form-check form-switch mb-3" *ngIf="isEditing">
                  <input class="form-check-input" type="checkbox" id="activaSwitch" formControlName="activa" />
                  <label class="form-check-label" for="activaSwitch">Sucursal Activa</label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  {{ isEditing ? 'Guardar Cambios' : 'Crear Sucursal' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <!-- Backdrop del modal -->
      <div class="modal-backdrop fade show" *ngIf="showModal"></div>
    </div>
  `
})
export class SucursalesComponent implements OnInit, OnDestroy {
  sucursales: Sucursal[] = [];
  loading = false;
  saving = false;
  submitted = false;

  // Paginación y búsqueda
  page = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  filterActivas: string = 'all';

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Modal
  showModal = false;
  isEditing = false;
  currentSucursalId: number | null = null;
  sucursalForm!: FormGroup;

  // Alertas
  alertMessage: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  constructor(
    private sucursalService: SucursalService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSucursales();

    // Debounce de búsqueda de 300ms
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.page = 1;
        this.loadSucursales();
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  initForm(): void {
    this.sucursalForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      direccion: ['', [Validators.maxLength(200)]],
      telefono: ['', [Validators.maxLength(50)]],
      activa: [true]
    });
  }

  get f() {
    return this.sucursalForm.controls;
  }

  loadSucursales(): void {
    this.loading = true;
    let soloActivas: boolean | undefined = undefined;
    if (this.filterActivas === 'active') soloActivas = true;
    if (this.filterActivas === 'inactive') soloActivas = false;

    this.sucursalService.getPaged(this.page, this.pageSize, this.searchTerm, soloActivas).subscribe({
      next: (res) => {
        this.sucursales = res.items;
        this.page = res.page;
        this.pageSize = res.pageSize;
        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error al cargar la lista de sucursales.', 'danger');
        this.loading = false;
      }
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onFilterChange(event: Event): void {
    this.filterActivas = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadSucursales();
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
      this.page = newPage;
      this.loadSucursales();
    }
  }

  getPageArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentSucursalId = null;
    this.submitted = false;
    this.sucursalForm.reset({
      nombre: '',
      direccion: '',
      telefono: '',
      activa: true
    });
    this.showModal = true;
  }

  openEditModal(sucursal: Sucursal): void {
    this.isEditing = true;
    this.currentSucursalId = sucursal.id;
    this.submitted = false;
    this.sucursalForm.patchValue({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      activa: sucursal.activa
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveSucursal(): void {
    this.submitted = true;
    if (this.sucursalForm.invalid) return;

    this.saving = true;
    const formVal = this.sucursalForm.value;

    if (this.isEditing && this.currentSucursalId) {
      this.sucursalService.update(this.currentSucursalId, formVal).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showAlert('Sucursal actualizada exitosamente.', 'success');
          this.loadSucursales();
        },
        error: (err) => {
          this.saving = false;
          this.showAlert(err.error?.detail || 'Error al actualizar la sucursal.', 'danger');
        }
      });
    } else {
      this.sucursalService.create(formVal).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showAlert('Sucursal creada exitosamente.', 'success');
          this.loadSucursales();
        },
        error: (err) => {
          this.saving = false;
          this.showAlert(err.error?.detail || 'Error al crear la sucursal.', 'danger');
        }
      });
    }
  }

  confirmDelete(sucursal: Sucursal): void {
    const confirmMsg = `¿Está seguro de que desea eliminar la sucursal "${sucursal.nombre}"? Si posee usuarios o registros vinculados, será desactivada para proteger la integridad.`;
    if (!confirm(confirmMsg)) return;

    this.sucursalService.delete(sucursal.id).subscribe({
      next: (res) => {
        this.showAlert(res.message, 'success');
        this.loadSucursales();
      },
      error: (err) => {
        this.showAlert(err.error?.detail || 'No se pudo eliminar la sucursal.', 'danger');
      }
    });
  }

  private showAlert(message: string, type: 'success' | 'danger'): void {
    this.alertMessage = message;
    this.alertType = type;
  }
}
