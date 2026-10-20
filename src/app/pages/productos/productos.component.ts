import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductoList, ProductoCreate, ProductoUpdate } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/categoria.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Encabezado y botón nuevo -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 class="fw-bold mb-1"><i class="bi bi-box-seam text-primary me-2"></i>Catálogo de Productos</h2>
          <p class="text-muted small mb-0">Gestión de artículos y precios del sistema</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()" *ngIf="isAdmin">
          <i class="bi bi-plus-lg me-1"></i> Nuevo Producto
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
            <!-- Buscador -->
            <div class="col-md-5 col-lg-4">
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Buscar por código, nombre..."
                  [value]="searchTerm"
                  (input)="onSearchInput($event)"
                />
              </div>
            </div>

            <!-- Filtro Categoría -->
            <div class="col-md-4 col-lg-3">
              <select class="form-select" [value]="filterCategoriaId" (change)="onCategoriaFilterChange($event)">
                <option value="all">Todas las categorías</option>
                <option *ngFor="let c of categoriasList" [value]="c.id">{{ c.nombre }}</option>
              </select>
            </div>

            <!-- Filtro Estado -->
            <div class="col-md-3 col-lg-2">
              <select class="form-select" [value]="filterActivos" (change)="onEstadoFilterChange($event)">
                <option value="all">Todos los estados</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>

            <!-- Total de registros -->
            <div class="col-md-12 col-lg-3 text-lg-end">
              <span class="text-muted small">Total: <strong>{{ totalItems }}</strong> productos</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de productos -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 120px;">Código</th>
                <th>Nombre y Descripción</th>
                <th>Categoría</th>
                <th class="text-end">Precio Unitario</th>
                <th class="text-center">Stock Global</th>
                <th>Estado</th>
                <th style="width: 120px;" class="text-end" *ngIf="isAdmin">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td [attr.colspan]="isAdmin ? 7 : 6" class="text-center py-5">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Cargando catálogo...
                </td>
              </tr>
              <tr *ngIf="!loading && productos.length === 0">
                <td [attr.colspan]="isAdmin ? 7 : 6" class="text-center py-5 text-muted">
                  <i class="bi bi-box-seam fs-2 d-block mb-2"></i>
                  No se encontraron productos con los criterios especificados.
                </td>
              </tr>
              <tr *ngFor="let p of productos">
                <td>
                  <span class="badge bg-light text-dark border font-monospace">{{ p.codigo }}</span>
                </td>
                <td>
                  <div class="fw-bold">{{ p.nombre }}</div>
                  <small class="text-muted" *ngIf="p.descripcion">{{ p.descripcion }}</small>
                </td>
                <td>
                  <span class="badge bg-secondary-subtle text-secondary border">
                    <i class="bi bi-tag me-1"></i>{{ p.categoriaNombre }}
                  </span>
                </td>
                <td class="text-end fw-bold">
                  \${{ p.precio | number:'1.2-2' }}
                </td>
                <td class="text-center">
                  <span class="badge" [ngClass]="p.stockTotal > 0 ? 'bg-primary' : 'bg-danger'">
                    {{ p.stockTotal }} un.
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="p.activo ? 'bg-success' : 'bg-secondary'">
                    {{ p.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="text-end" *ngIf="isAdmin">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="openEditModal(p)" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(p)" title="Eliminar o Desactivar">
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
            <li class="page-item" *ngFor="let pg of getPageArray()" [class.active]="pg === page">
              <button class="page-link" (click)="changePage(pg)">{{ pg }}</button>
            </li>
            <li class="page-item" [class.disabled]="page >= totalPages">
              <button class="page-link" (click)="changePage(page + 1)" [disabled]="page >= totalPages">Siguiente</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Modal para Crear / Editar Producto -->
      <div class="modal fade" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">
                {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <form [formGroup]="prodForm" (ngSubmit)="saveProducto()">
              <div class="modal-body">
                <div class="row g-3">
                  <!-- Código -->
                  <div class="col-md-4">
                    <label class="form-label">Código Único <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="codigo"
                      [class.is-invalid]="submitted && f['codigo'].errors"
                      placeholder="Ej: ART-001"
                    />
                    <div *ngIf="submitted && f['codigo'].errors" class="invalid-feedback">
                      <span *ngIf="f['codigo'].errors['required']">El código es obligatorio.</span>
                      <span *ngIf="f['codigo'].errors['maxlength']">Máximo 50 caracteres.</span>
                    </div>
                  </div>

                  <!-- Nombre -->
                  <div class="col-md-8">
                    <label class="form-label">Nombre del Producto <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="nombre"
                      [class.is-invalid]="submitted && f['nombre'].errors"
                      placeholder="Ej: Alfajor Chocolate 60g"
                    />
                    <div *ngIf="submitted && f['nombre'].errors" class="invalid-feedback">
                      <span *ngIf="f['nombre'].errors['required']">El nombre es obligatorio.</span>
                      <span *ngIf="f['nombre'].errors['maxlength']">Máximo 150 caracteres.</span>
                    </div>
                  </div>

                  <!-- Categoría -->
                  <div class="col-md-6">
                    <label class="form-label">Categoría <span class="text-danger">*</span></label>
                    <select
                      class="form-select"
                      formControlName="categoriaId"
                      [class.is-invalid]="submitted && f['categoriaId'].errors"
                    >
                      <option [ngValue]="null">— Seleccionar Categoría —</option>
                      <option *ngFor="let c of categoriasList" [ngValue]="c.id">{{ c.nombre }}</option>
                    </select>
                    <div *ngIf="submitted && f['categoriaId'].errors" class="invalid-feedback">
                      <span>Debe seleccionar una categoría.</span>
                    </div>
                  </div>

                  <!-- Precio Unitario -->
                  <div class="col-md-6">
                    <label class="form-label">Precio Unitario (\$) <span class="text-danger">*</span></label>
                    <div class="input-group">
                      <span class="input-group-text">\$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        class="form-control"
                        formControlName="precio"
                        [class.is-invalid]="submitted && f['precio'].errors"
                        placeholder="0.00"
                      />
                      <div *ngIf="submitted && f['precio'].errors" class="invalid-feedback">
                        <span *ngIf="f['precio'].errors['required']">El precio es obligatorio.</span>
                        <span *ngIf="f['precio'].errors['min']">El precio debe ser mayor a 0.</span>
                      </div>
                    </div>
                  </div>

                  <!-- Descripción -->
                  <div class="col-12">
                    <label class="form-label">Descripción</label>
                    <textarea
                      class="form-control"
                      rows="2"
                      formControlName="descripcion"
                      placeholder="Detalles adicionales del artículo..."
                    ></textarea>
                  </div>

                  <!-- Estado Activo (solo en edición) -->
                  <div class="col-12" *ngIf="isEditing">
                    <div class="form-check form-switch mt-2">
                      <input class="form-check-input" type="checkbox" id="activoSwitch" formControlName="activo" />
                      <label class="form-check-label" for="activoSwitch">Producto Activo para la Venta</label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  {{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Backdrop de Modal -->
      <div class="modal-backdrop fade show" *ngIf="showModal || showDeleteModal"></div>

      <!-- Modal de Confirmación de Borrado / Desactivación -->
      <div class="modal fade" [class.show]="showDeleteModal" [style.display]="showDeleteModal ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header bg-light">
              <h5 class="modal-title fw-bold text-danger">Confirmar Eliminación</h5>
              <button type="button" class="btn-close" (click)="closeDeleteModal()"></button>
            </div>
            <div class="modal-body">
              <p>
                ¿Está seguro de que desea eliminar el producto <strong>{{ productToDelete?.nombre }}</strong> (Código: {{ productToDelete?.codigo }})?
              </p>
              <div class="alert alert-info small mb-0">
                <i class="bi bi-info-circle me-1"></i>
                Si el producto registra existencias de stock o ventas históricas, será <strong>desactivado de forma lógica</strong> para preservar la integridad del historial.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeDeleteModal()">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="executeDelete()" [disabled]="deleting">
                <span *ngIf="deleting" class="spinner-border spinner-border-sm me-1"></span>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class ProductosComponent implements OnInit, OnDestroy {
  productos: ProductoList[] = [];
  categoriasList: Categoria[] = [];
  loading = false;
  saving = false;
  deleting = false;

  // Paginación server-side
  page = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;

  // Filtros
  searchTerm = '';
  filterCategoriaId: string = 'all';
  filterActivos = 'all';

  // Búsqueda debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Modal Crear/Editar
  prodForm: FormGroup;
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  submitted = false;

  // Modal Borrado
  showDeleteModal = false;
  productToDelete: ProductoList | null = null;

  // Alertas
  alertMessage: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  // Rol
  isAdmin = false;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.prodForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: [''],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      categoriaId: [null, Validators.required],
      activo: [true]
    });
  }

  get f() {
    return this.prodForm.controls;
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('Administrador');
    this.loadCategorias();

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.page = 1;
        this.loadProductos();
      });

    this.loadProductos();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadCategorias(): void {
    this.categoriaService.getAll(true).subscribe({
      next: (data) => {
        this.categoriasList = data;
      },
      error: () => {}
    });
  }

  loadProductos(): void {
    this.loading = true;

    const catParam = this.filterCategoriaId !== 'all' ? Number(this.filterCategoriaId) : undefined;
    let activosParam: boolean | undefined = undefined;
    if (this.filterActivos === 'active') activosParam = true;
    if (this.filterActivos === 'inactive') activosParam = false;

    this.productoService.getPaged(
      this.page,
      this.pageSize,
      this.searchTerm,
      catParam,
      activosParam
    ).subscribe({
      next: (res) => {
        this.productos = res.items;
        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showAlert(err.error?.detail || 'Error al cargar los productos.', 'danger');
      }
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onCategoriaFilterChange(event: Event): void {
    this.filterCategoriaId = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadProductos();
  }

  onEstadoFilterChange(event: Event): void {
    this.filterActivos = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadProductos();
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
      this.page = newPage;
      this.loadProductos();
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
    this.editingId = null;
    this.submitted = false;

    this.prodForm.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      precio: null,
      categoriaId: null,
      activo: true
    });

    this.showModal = true;
  }

  openEditModal(p: ProductoList): void {
    this.isEditing = true;
    this.editingId = p.id;
    this.submitted = false;

    this.prodForm.patchValue({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: p.precio,
      categoriaId: p.categoriaId,
      activo: p.activo
    });

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.submitted = false;
    this.prodForm.reset();
  }

  saveProducto(): void {
    this.submitted = true;

    if (this.prodForm.invalid) {
      return;
    }

    this.saving = true;
    const formVal = this.prodForm.value;

    if (this.isEditing && this.editingId) {
      const updateDto: ProductoUpdate = {
        codigo: formVal.codigo,
        nombre: formVal.nombre,
        descripcion: formVal.descripcion,
        precio: Number(formVal.precio),
        categoriaId: Number(formVal.categoriaId),
        activo: formVal.activo
      };

      this.productoService.update(this.editingId, updateDto).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showAlert('Producto actualizado con éxito.', 'success');
          this.loadProductos();
        },
        error: (err) => {
          this.saving = false;
          this.showAlert(err.error?.detail || err.error?.message || 'Error al actualizar el producto.', 'danger');
        }
      });
    } else {
      const createDto: ProductoCreate = {
        codigo: formVal.codigo,
        nombre: formVal.nombre,
        descripcion: formVal.descripcion,
        precio: Number(formVal.precio),
        categoriaId: Number(formVal.categoriaId)
      };

      this.productoService.create(createDto).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.showAlert('Producto creado con éxito.', 'success');
          this.loadProductos();
        },
        error: (err) => {
          this.saving = false;
          this.showAlert(err.error?.detail || err.error?.message || 'Error al crear el producto.', 'danger');
        }
      });
    }
  }

  confirmDelete(p: ProductoList): void {
    this.productToDelete = p;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  executeDelete(): void {
    if (!this.productToDelete) return;

    this.deleting = true;
    this.productoService.delete(this.productToDelete.id).subscribe({
      next: (res) => {
        this.deleting = false;
        this.closeDeleteModal();
        this.showAlert(res.message, 'success');
        this.loadProductos();
      },
      error: (err) => {
        this.deleting = false;
        this.closeDeleteModal();
        this.showAlert(err.error?.detail || 'Error al eliminar el producto.', 'danger');
      }
    });
  }

  showAlert(message: string, type: 'success' | 'danger'): void {
    this.alertMessage = message;
    this.alertType = type;
  }
}
