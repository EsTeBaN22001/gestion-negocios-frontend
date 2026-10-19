import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { CategoriaService } from '../../core/services/categoria.service';
import { Categoria } from '../../core/models/categoria.model';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Encabezado y botón nuevo -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 class="fw-bold mb-1"><i class="bi bi-tags text-primary me-2"></i>Gestión de Categorías</h2>
          <p class="text-muted small mb-0">Clasificación de productos del inventario</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="bi bi-plus-lg me-1"></i> Nueva Categoría
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
                  placeholder="Buscar categoría por nombre o descripción..."
                  [value]="searchTerm"
                  (input)="onSearchInput($event)"
                />
              </div>
            </div>
            <div class="col-md-4 col-lg-3">
              <select class="form-select" [value]="filterActivas" (change)="onFilterChange($event)">
                <option value="all">Todas las categorías</option>
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

      <!-- Tabla de categorías -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 70px;">ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Productos</th>
                <th>Estado</th>
                <th style="width: 140px;" class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="6" class="text-center py-5">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Cargando categorías...
                </td>
              </tr>
              <tr *ngIf="!loading && categorias.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No se encontraron categorías con los criterios especificados.
                </td>
              </tr>
              <tr *ngFor="let c of categorias">
                <td class="fw-semibold text-muted">#{{ c.id }}</td>
                <td class="fw-bold">{{ c.nombre }}</td>
                <td>{{ c.descripcion || '—' }}</td>
                <td>
                  <span class="badge bg-light text-dark border">
                    <i class="bi bi-box me-1"></i>{{ c.productosCount || 0 }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="c.activa ? 'bg-success' : 'bg-secondary'">
                    {{ c.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="openEditModal(c)" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    (click)="confirmDelete(c)"
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
                {{ isEditing ? 'Editar Categoría' : 'Nueva Categoría' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <form [formGroup]="categoriaForm" (ngSubmit)="saveCategoria()">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="nombre"
                    [class.is-invalid]="submitted && f['nombre'].errors"
                    placeholder="Ej: Bebidas"
                  />
                  <div *ngIf="submitted && f['nombre'].errors" class="invalid-feedback">
                    <span *ngIf="f['nombre'].errors['required']">El nombre es obligatorio.</span>
                    <span *ngIf="f['nombre'].errors['maxlength']">Máximo 100 caracteres.</span>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea
                    class="form-control"
                    formControlName="descripcion"
                    rows="3"
                    placeholder="Descripción breve de la categoría..."
                  ></textarea>
                </div>

                <div class="form-check form-switch mb-3" *ngIf="isEditing">
                  <input class="form-check-input" type="checkbox" id="catActivaSwitch" formControlName="activa" />
                  <label class="form-check-label" for="catActivaSwitch">Categoría Activa</label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  {{ isEditing ? 'Guardar Cambios' : 'Crear Categoría' }}
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
export class CategoriasComponent implements OnInit, OnDestroy {
  categorias: Categoria[] = [];
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
  currentCategoriaId: number | null = null;
  categoriaForm!: FormGroup;

  // Alertas
  alertMessage: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  constructor(
    private categoriaService: CategoriaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategorias();

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.page = 1;
        this.loadCategorias();
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  initForm(): void {
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      activa: [true]
    });
  }

  get f() {
    return this.categoriaForm.controls;
  }

  loadCategorias(): void {
    this.loading = true;
    let soloActivas: boolean | undefined = undefined;
    if (this.filterActivas === 'active') soloActivas = true;
    if (this.filterActivas === 'inactive') soloActivas = false;

    this.categoriaService.getPaged(this.page, this.pageSize, this.searchTerm, soloActivas).subscribe({
      next: (res) => {
        this.categorias = res.items;
        this.page = res.page;
        this.pageSize = res.pageSize;
        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error al cargar la lista de categorías.', 'danger');
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
    this.loadCategorias();
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
      this.page = newPage;
      this.loadCategorias();
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
    this.currentCategoriaId = null;
    this.submitted = false;
    this.categoriaForm.reset({
      nombre: '',
      descripcion: '',
      activa: true
    });
    this.showModal = true;
  }

  openEditModal(categoria: Categoria): void {
    this.isEditing = true;
    this.currentCategoriaId = categoria.id;
    this.submitted = false;
    this.categoriaForm.patchValue({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      activa: categoria.activa
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCategoria(): void {
    this.submitted = true;
    if (this.categoriaForm.invalid) return;

    this.saving = true;
    const formVal = this.categoriaForm.value;

    if (this.isEditing && this.currentCategoriaId) {
      this.categoriaService.update(this.currentCategoriaId, formVal).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showAlert('Categoría actualizada exitosamente.', 'success');
          this.loadCategorias();
        },
        error: (err) => {
          this.saving = false;
          this.showAlert(err.error?.detail || 'Error al actualizar la categoría.', 'danger');
        }
      });
    } else {
      this.categoriaService.create(formVal).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showAlert('Categoría creada exitosamente.', 'success');
          this.loadCategorias();
        },
        error: (err) => {
          this.saving = false;
          this.showAlert(err.error?.detail || 'Error al crear la categoría.', 'danger');
        }
      });
    }
  }

  confirmDelete(categoria: Categoria): void {
    const confirmMsg = `¿Está seguro de que desea eliminar la categoría "${categoria.nombre}"? Si posee productos asociados, será desactivada para proteger la integridad.`;
    if (!confirm(confirmMsg)) return;

    this.categoriaService.delete(categoria.id).subscribe({
      next: (res) => {
        this.showAlert(res.message, 'success');
        this.loadCategorias();
      },
      error: (err) => {
        this.showAlert(err.error?.detail || 'No se pudo eliminar la categoría.', 'danger');
      }
    });
  }

  private showAlert(message: string, type: 'success' | 'danger'): void {
    this.alertMessage = message;
    this.alertType = type;
  }
}
