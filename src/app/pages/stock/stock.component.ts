import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { StockService } from '../../core/services/stock.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { StockList, StockCreate, StockAjuste } from '../../core/models/stock.model';
import { Sucursal } from '../../core/models/sucursal.model';
import { ProductoList } from '../../core/models/producto.model';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Encabezado y botón nuevo -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 class="fw-bold mb-1"><i class="bi bi-boxes text-primary me-2"></i>Control de Inventario y Stock</h2>
          <p class="text-muted small mb-0">Existencias físicas por sucursal y alertas de reposición</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()" *ngIf="isAdmin">
          <i class="bi bi-plus-lg me-1"></i> Asignar Stock a Sucursal
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
            <div class="col-md-4 col-lg-3">
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Buscar producto..."
                  [value]="searchTerm"
                  (input)="onSearchInput($event)"
                />
              </div>
            </div>

            <!-- Filtro Sucursal (solo Admin) -->
            <div class="col-md-4 col-lg-3" *ngIf="isAdmin">
              <select class="form-select" [value]="filterSucursalId" (change)="onSucursalFilterChange($event)">
                <option value="all">Todas las sucursales</option>
                <option *ngFor="let s of sucursalesList" [value]="s.id">{{ s.nombre }}</option>
              </select>
            </div>

            <!-- Indicador sucursal fija para Empleado -->
            <div class="col-md-4 col-lg-3" *ngIf="!isAdmin">
              <div class="badge bg-secondary text-wrap p-2 text-start w-100">
                <i class="bi bi-building me-1"></i>
                Sucursal asignada: <strong>{{ userSucursalName || 'Tu sucursal' }}</strong>
              </div>
            </div>

            <!-- Filtro Bajo Stock -->
            <div class="col-md-4 col-lg-3">
              <div class="form-check form-switch pt-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="bajoStockSwitch"
                  [checked]="filterBajoStock"
                  (change)="onBajoStockChange($event)"
                />
                <label class="form-check-label fw-semibold" for="bajoStockSwitch">
                  Solo alertas (Bajo/Agotado)
                </label>
              </div>
            </div>

            <!-- Total -->
            <div class="col-md-12 col-lg-3 text-lg-end">
              <span class="text-muted small">Total: <strong>{{ totalItems }}</strong> registros</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de inventario -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Sucursal</th>
                <th class="text-center" style="width: 140px;">Cantidad Actual</th>
                <th class="text-center" style="width: 120px;">Stock Mínimo</th>
                <th class="text-center" style="width: 130px;">Estado / Alerta</th>
                <th style="width: 100px;" class="text-end" *ngIf="isAdmin">Ajuste</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td [attr.colspan]="isAdmin ? 7 : 6" class="text-center py-5">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Consultando existencias de stock...
                </td>
              </tr>
              <tr *ngIf="!loading && stockList.length === 0">
                <td [attr.colspan]="isAdmin ? 7 : 6" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No se encontraron existencias con los criterios seleccionados.
                </td>
              </tr>
              <tr *ngFor="let s of stockList">
                <td>
                  <div class="fw-bold">{{ s.productoNombre }}</div>
                  <small class="text-muted font-monospace">{{ s.productoCodigo }}</small>
                </td>
                <td>
                  <span class="badge bg-light text-dark border">
                    {{ s.categoriaNombre }}
                  </span>
                </td>
                <td>
                  <span class="badge bg-light text-primary border">
                    <i class="bi bi-buildings me-1"></i>{{ s.sucursalNombre }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="fs-6 fw-bold" [ngClass]="getQuantityClass(s)">
                    {{ s.cantidad }}
                  </span>
                  <span class="text-muted small ms-1">un.</span>
                </td>
                <td class="text-center text-muted">
                  {{ s.stockMinimo }} un.
                </td>
                <td class="text-center">
                  <!-- Badges de Alerta de Reposición -->
                  <span *ngIf="s.alertaStock === 'Agotado'" class="badge bg-danger">
                    <i class="bi bi-x-circle me-1"></i>Agotado
                  </span>
                  <span *ngIf="s.alertaStock === 'Bajo'" class="badge bg-warning text-dark">
                    <i class="bi bi-exclamation-triangle me-1"></i>Bajo Stock
                  </span>
                  <span *ngIf="s.alertaStock === 'Normal'" class="badge bg-success">
                    <i class="bi bi-check-circle me-1"></i>Normal
                  </span>
                </td>
                <td class="text-end" *ngIf="isAdmin">
                  <button class="btn btn-sm btn-outline-primary" (click)="openAjusteModal(s)" title="Ajustar existencias">
                    <i class="bi bi-sliders me-1"></i> Ajustar
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

      <!-- Modal de Ajuste de Stock -->
      <div class="modal fade" [class.show]="showAjusteModal" [style.display]="showAjusteModal ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">
                Ajustar Stock de Inventario
              </h5>
              <button type="button" class="btn-close" (click)="closeAjusteModal()"></button>
            </div>
            <form [formGroup]="ajusteForm" (ngSubmit)="saveAjuste()">
              <div class="modal-body">
                <div class="mb-3 p-3 bg-light rounded border">
                  <div class="fw-bold fs-6">{{ selectedStock?.productoNombre }}</div>
                  <div class="text-muted small">Código: {{ selectedStock?.productoCodigo }} | Sucursal: {{ selectedStock?.sucursalNombre }}</div>
                </div>

                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Nueva Cantidad <span class="text-danger">*</span></label>
                    <input
                      type="number"
                      min="0"
                      class="form-control"
                      formControlName="cantidad"
                      [class.is-invalid]="submittedAjuste && fa['cantidad'].errors"
                    />
                    <div *ngIf="submittedAjuste && fa['cantidad'].errors" class="invalid-feedback">
                      <span *ngIf="fa['cantidad'].errors['required']">La cantidad es obligatoria.</span>
                      <span *ngIf="fa['cantidad'].errors['min']">No puede ser inferior a 0.</span>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label">Stock Mínimo <span class="text-danger">*</span></label>
                    <input
                      type="number"
                      min="0"
                      class="form-control"
                      formControlName="stockMinimo"
                      [class.is-invalid]="submittedAjuste && fa['stockMinimo'].errors"
                    />
                    <div *ngIf="submittedAjuste && fa['stockMinimo'].errors" class="invalid-feedback">
                      <span *ngIf="fa['stockMinimo'].errors['required']">El stock mínimo es obligatorio.</span>
                      <span *ngIf="fa['stockMinimo'].errors['min']">No puede ser inferior a 0.</span>
                    </div>
                  </div>

                  <div class="col-12">
                    <label class="form-label">Motivo del Ajuste (Opcional)</label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="motivo"
                      placeholder="Ej: Conteo físico mensual, recepción de pedido..."
                    />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeAjusteModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal para Asignar Stock Inicial (Crear combinación Producto - Sucursal) -->
      <div class="modal fade" [class.show]="showCreateModal" [style.display]="showCreateModal ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">
                Asignar Producto a Sucursal
              </h5>
              <button type="button" class="btn-close" (click)="closeCreateModal()"></button>
            </div>
            <form [formGroup]="createForm" (ngSubmit)="saveCreate()">
              <div class="modal-body">
                <div class="row g-3">
                  <!-- Producto -->
                  <div class="col-12">
                    <label class="form-label">Producto <span class="text-danger">*</span></label>
                    <select
                      class="form-select"
                      formControlName="productoId"
                      [class.is-invalid]="submittedCreate && fc['productoId'].errors"
                    >
                      <option [ngValue]="null">— Seleccionar Producto —</option>
                      <option *ngFor="let p of availableProducts" [ngValue]="p.id">
                        [{{ p.codigo }}] {{ p.nombre }}
                      </option>
                    </select>
                    <div *ngIf="submittedCreate && fc['productoId'].errors" class="invalid-feedback">
                      <span>Debe seleccionar un producto.</span>
                    </div>
                  </div>

                  <!-- Sucursal -->
                  <div class="col-12">
                    <label class="form-label">Sucursal <span class="text-danger">*</span></label>
                    <select
                      class="form-select"
                      formControlName="sucursalId"
                      [class.is-invalid]="submittedCreate && fc['sucursalId'].errors"
                    >
                      <option [ngValue]="null">— Seleccionar Sucursal —</option>
                      <option *ngFor="let s of sucursalesList" [ngValue]="s.id">
                        {{ s.nombre }}
                      </option>
                    </select>
                    <div *ngIf="submittedCreate && fc['sucursalId'].errors" class="invalid-feedback">
                      <span>Debe seleccionar una sucursal.</span>
                    </div>
                  </div>

                  <!-- Cantidad Inicial -->
                  <div class="col-md-6">
                    <label class="form-label">Cantidad Inicial</label>
                    <input
                      type="number"
                      min="0"
                      class="form-control"
                      formControlName="cantidad"
                      [class.is-invalid]="submittedCreate && fc['cantidad'].errors"
                    />
                  </div>

                  <!-- Stock Mínimo -->
                  <div class="col-md-6">
                    <label class="form-label">Stock Mínimo</label>
                    <input
                      type="number"
                      min="0"
                      class="form-control"
                      formControlName="stockMinimo"
                      [class.is-invalid]="submittedCreate && fc['stockMinimo'].errors"
                    />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  Crear Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Backdrop -->
      <div class="modal-backdrop fade show" *ngIf="showAjusteModal || showCreateModal"></div>

    </div>
  `
})
export class StockComponent implements OnInit, OnDestroy {
  stockList: StockList[] = [];
  sucursalesList: Sucursal[] = [];
  availableProducts: ProductoList[] = [];

  loading = false;
  saving = false;

  // Paginación server-side
  page = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;

  // Filtros
  searchTerm = '';
  filterSucursalId: string = 'all';
  filterBajoStock = false;

  // Búsqueda reactiva debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Modal Ajuste
  ajusteForm: FormGroup;
  showAjusteModal = false;
  selectedStock: StockList | null = null;
  submittedAjuste = false;

  // Modal Create
  createForm: FormGroup;
  showCreateModal = false;
  submittedCreate = false;

  // Alertas
  alertMessage: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  // Info de usuario
  isAdmin = false;
  userSucursalId: number | null = null;
  userSucursalName: string | null = null;

  constructor(
    private stockService: StockService,
    private sucursalService: SucursalService,
    private productoService: ProductoService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.ajusteForm = this.fb.group({
      cantidad: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [5, [Validators.required, Validators.min(0)]],
      motivo: ['']
    });

    this.createForm = this.fb.group({
      productoId: [null, Validators.required],
      sucursalId: [null, Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [5, [Validators.required, Validators.min(0)]]
    });
  }

  get fa() {
    return this.ajusteForm.controls;
  }

  get fc() {
    return this.createForm.controls;
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.isAdmin = this.authService.hasRole('Administrador');
    this.userSucursalId = user ? (user.sucursalId ?? null) : null;

    if (this.isAdmin) {
      this.loadSucursales();
      this.loadAvailableProducts();
    }

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.page = 1;
        this.loadStock();
      });

    this.loadStock();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadSucursales(): void {
    this.sucursalService.getAll(true).subscribe({
      next: (data) => {
        this.sucursalesList = data;
      },
      error: () => {}
    });
  }

  loadAvailableProducts(): void {
    this.productoService.getAll(true).subscribe({
      next: (data) => {
        this.availableProducts = data;
      },
      error: () => {}
    });
  }

  loadStock(): void {
    this.loading = true;

    const sucParam = this.isAdmin && this.filterSucursalId !== 'all'
      ? Number(this.filterSucursalId)
      : undefined;

    this.stockService.getPaged(
      this.page,
      this.pageSize,
      sucParam,
      this.searchTerm,
      this.filterBajoStock ? true : undefined
    ).subscribe({
      next: (res) => {
        this.stockList = res.items;
        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
        this.loading = false;

        // Extraer nombre de sucursal para Empleado
        if (!this.isAdmin && this.stockList.length > 0 && !this.userSucursalName) {
          this.userSucursalName = this.stockList[0].sucursalNombre;
        }
      },
      error: (err) => {
        this.loading = false;
        this.showAlert(err.error?.detail || 'Error al cargar los registros de stock.', 'danger');
      }
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onSucursalFilterChange(event: Event): void {
    this.filterSucursalId = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadStock();
  }

  onBajoStockChange(event: Event): void {
    this.filterBajoStock = (event.target as HTMLInputElement).checked;
    this.page = 1;
    this.loadStock();
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
      this.page = newPage;
      this.loadStock();
    }
  }

  getPageArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getQuantityClass(s: StockList): string {
    if (s.cantidad === 0) return 'text-danger';
    if (s.cantidad <= s.stockMinimo) return 'text-warning-emphasis';
    return 'text-success';
  }

  openAjusteModal(s: StockList): void {
    this.selectedStock = s;
    this.submittedAjuste = false;
    this.ajusteForm.patchValue({
      cantidad: s.cantidad,
      stockMinimo: s.stockMinimo,
      motivo: ''
    });
    this.showAjusteModal = true;
  }

  closeAjusteModal(): void {
    this.showAjusteModal = false;
    this.selectedStock = null;
    this.ajusteForm.reset();
  }

  saveAjuste(): void {
    this.submittedAjuste = true;
    if (this.ajusteForm.invalid || !this.selectedStock) return;

    this.saving = true;
    const dto: StockAjuste = {
      cantidad: Number(this.ajusteForm.value.cantidad),
      stockMinimo: Number(this.ajusteForm.value.stockMinimo),
      motivo: this.ajusteForm.value.motivo
    };

    this.stockService.ajustar(this.selectedStock.id, dto).subscribe({
      next: () => {
        this.saving = false;
        this.closeAjusteModal();
        this.showAlert('Ajuste de inventario aplicado con éxito.', 'success');
        this.loadStock();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.detail || err.error?.message || 'Error al aplicar el ajuste.', 'danger');
      }
    });
  }

  openCreateModal(): void {
    this.submittedCreate = false;
    this.createForm.reset({
      productoId: null,
      sucursalId: null,
      cantidad: 0,
      stockMinimo: 5
    });
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm.reset();
  }

  saveCreate(): void {
    this.submittedCreate = true;
    if (this.createForm.invalid) return;

    this.saving = true;
    const dto: StockCreate = {
      productoId: Number(this.createForm.value.productoId),
      sucursalId: Number(this.createForm.value.sucursalId),
      cantidad: Number(this.createForm.value.cantidad),
      stockMinimo: Number(this.createForm.value.stockMinimo)
    };

    this.stockService.create(dto).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.showAlert('Registro de stock asignado correctamente.', 'success');
        this.loadStock();
      },
      error: (err) => {
        this.saving = false;
        this.showAlert(err.error?.detail || err.error?.message || 'Error al registrar el stock.', 'danger');
      }
    });
  }

  showAlert(message: string, type: 'success' | 'danger'): void {
    this.alertMessage = message;
    this.alertType = type;
  }
}
