import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { StockService } from '../../core/services/stock.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { VentaService } from '../../core/services/venta.service';
import { StockList } from '../../core/models/stock.model';
import { Sucursal } from '../../core/models/sucursal.model';
import { VentaCreate, VentaDetail, VentaEstado, VentaList } from '../../core/models/venta.model';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="container py-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 class="h3 mb-1"><i class="bi bi-receipt-cutoff me-2 text-primary"></i>Ventas</h1>
          <p class="text-muted mb-0">Registro de operaciones y control del historial de ventas.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="bi bi-cart-plus me-1"></i>Nueva venta
        </button>
      </div>

      <div *ngIf="alertMessage" class="alert alert-{{ alertType }} alert-dismissible fade show" role="alert">
        {{ alertMessage }}
        <button type="button" class="btn-close" (click)="alertMessage = null"></button>
      </div>

      <div class="card shadow-sm border-0 mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-5">
              <label class="form-label">Buscar</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input class="form-control" [value]="searchTerm" (input)="onSearchInput($event)"
                  placeholder="Producto, sucursal o usuario..." />
              </div>
            </div>
            <div class="col-md-3" *ngIf="isAdmin">
              <label class="form-label">Sucursal</label>
              <select class="form-select" [value]="filterSucursalId" (change)="onSucursalFilterChange($event)">
                <option value="all">Todas las sucursales</option>
                <option *ngFor="let sucursal of sucursales" [value]="sucursal.id">{{ sucursal.nombre }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select class="form-select" [value]="filterEstado" (change)="onEstadoFilterChange($event)">
                <option value="all">Todos los estados</option>
                <option value="Confirmada">Confirmadas</option>
                <option value="Anulada">Anuladas</option>
              </select>
            </div>
            <div class="col-md text-md-end">
              <span class="small text-muted">Total: <strong>{{ totalItems }}</strong> ventas</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>#</th><th>Fecha</th><th>Sucursal</th><th>Usuario</th>
                <th class="text-center">Ítems</th><th>Estado</th><th class="text-end">Total</th><th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading"><td colspan="8" class="text-center py-5"><span class="spinner-border spinner-border-sm me-2"></span>Cargando ventas...</td></tr>
              <tr *ngIf="!loading && ventas.length === 0"><td colspan="8" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-2 d-block mb-2"></i>No se encontraron ventas.</td></tr>
              <tr *ngFor="let venta of ventas">
                <td class="fw-bold">
                  #{{ venta.id }}
                  <i *ngIf="venta.archivoAdjunto" class="bi bi-paperclip text-primary ms-1" title="Comprobante adjunto"></i>
                </td>
                <td>{{ venta.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ venta.sucursalNombre }}</td>
                <td>{{ venta.usuarioNombre }}</td>
                <td class="text-center">{{ venta.detallesCount }}</td>
                <td><span class="badge" [ngClass]="venta.estado === 'Confirmada' ? 'bg-success' : 'bg-secondary'">{{ venta.estado }}</span></td>
                <td class="text-end fw-bold">\${{ venta.total | number:'1.2-2' }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="openDetailModal(venta.id)" title="Ver detalle"><i class="bi bi-eye"></i></button>
                  <button *ngIf="venta.estado === 'Confirmada'" class="btn btn-sm btn-outline-danger" (click)="openCancelModal(venta)" title="Anular"><i class="bi bi-x-circle"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-footer bg-white d-flex justify-content-between align-items-center py-3" *ngIf="totalPages > 1">
          <span class="small text-muted">Página {{ page }} de {{ totalPages }}</span>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" [class.disabled]="page <= 1"><button class="page-link" [disabled]="page <= 1" (click)="changePage(page - 1)">Anterior</button></li>
            <li class="page-item" *ngFor="let currentPage of getPageArray()" [class.active]="currentPage === page"><button class="page-link" (click)="changePage(currentPage)">{{ currentPage }}</button></li>
            <li class="page-item" [class.disabled]="page >= totalPages"><button class="page-link" [disabled]="page >= totalPages" (click)="changePage(page + 1)">Siguiente</button></li>
          </ul>
        </div>
      </div>

      <div class="modal fade" [class.show]="showCreateModal" [style.display]="showCreateModal ? 'block' : 'none'" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-scrollable"><div class="modal-content border-0 shadow">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-cart-plus me-2"></i>Nueva venta</h5><button type="button" class="btn-close" (click)="closeCreateModal()"></button></div>
          <form [formGroup]="ventaForm" (ngSubmit)="saveVenta()">
            <div class="modal-body">
              <div class="row g-3 mb-4">
                <div class="col-md-6" *ngIf="isAdmin">
                  <label class="form-label">Sucursal <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="sucursalId" (change)="onVentaSucursalChange()" [class.is-invalid]="submitted && ventaForm.controls['sucursalId'].invalid">
                    <option [ngValue]="null">— Seleccionar sucursal —</option>
                    <option *ngFor="let sucursal of sucursales" [ngValue]="sucursal.id">{{ sucursal.nombre }}</option>
                  </select>
                  <div class="invalid-feedback">Debe seleccionar una sucursal.</div>
                </div>
                <div class="col-md-6" *ngIf="!isAdmin"><label class="form-label">Sucursal</label><div class="form-control bg-light">Sucursal asignada #{{ userSucursalId }}</div></div>
              </div>

              <div class="card bg-light border-0 mb-3"><div class="card-body">
                <label class="form-label fw-semibold">Agregar productos</label>
                <div class="input-group"><span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input class="form-control" [value]="productSearchTerm" (input)="onProductSearchInput($event)" placeholder="Buscar por código o nombre..." [disabled]="!activeVentaSucursalId" />
                </div>
                <small class="text-muted d-block mt-2" *ngIf="!activeVentaSucursalId">Seleccioná una sucursal antes de buscar productos.</small>
                <div class="list-group mt-2" *ngIf="productResults.length > 0">
                  <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" *ngFor="let product of productResults" (click)="addProduct(product)" [disabled]="product.cantidad === 0">
                    <span><strong>{{ product.productoNombre }}</strong> <small class="text-muted ms-1">{{ product.productoCodigo }}</small></span>
                    <span><span class="me-3">\${{ product.productoPrecio | number:'1.2-2' }}</span><span class="badge" [ngClass]="product.cantidad > 0 ? 'bg-primary' : 'bg-danger'">{{ product.cantidad }} disponibles</span></span>
                  </button>
                </div>
              </div></div>

              <div *ngIf="selectedProducts.length === 0" class="text-center text-muted py-4 border rounded">Agregá al menos un producto para continuar.</div>
              <div class="table-responsive" *ngIf="selectedProducts.length > 0" formArrayName="detalles">
                <table class="table align-middle"><thead><tr><th>Producto</th><th class="text-end">Precio</th><th style="width: 150px;">Cantidad</th><th class="text-end">Subtotal</th><th></th></tr></thead>
                  <tbody><tr *ngFor="let detail of detalles.controls; let index = index" [formGroupName]="index">
                    <td><strong>{{ selectedProducts[index].productoNombre }}</strong><small class="text-muted d-block">{{ selectedProducts[index].productoCodigo }} · {{ selectedProducts[index].cantidad }} disponibles</small></td>
                    <td class="text-end">\${{ selectedProducts[index].productoPrecio | number:'1.2-2' }}</td>
                    <td><input type="number" min="1" [max]="selectedProducts[index].cantidad" class="form-control" formControlName="cantidad" /></td>
                    <td class="text-end fw-bold">\${{ getSubtotal(index) | number:'1.2-2' }}</td>
                    <td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger" (click)="removeProduct(index)" title="Quitar"><i class="bi bi-trash"></i></button></td>
                  </tr></tbody>
                </table>
              </div>
              <div class="d-flex justify-content-end fs-5" *ngIf="selectedProducts.length > 0">Total: <strong class="ms-2">\${{ getTotal() | number:'1.2-2' }}</strong></div>
              <div *ngIf="submitted && detalles.invalid" class="alert alert-danger mt-3 mb-0">Revisá que cada cantidad sea válida y no supere el stock disponible.</div>

              <!-- Comprobante opcional al crear venta -->
              <div class="mt-3 pt-3 border-top">
                <label class="form-label small fw-semibold"><i class="bi bi-paperclip me-1"></i>Comprobante o factura adjunta (Opcional)</label>
                <input type="file" class="form-control form-control-sm" accept=".pdf,image/jpeg,image/png" (change)="onComprobanteSelected($event)" />
                <small class="text-muted d-block mt-1">Archivos PDF, JPG o PNG (máx. 5 MB)</small>
              </div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancelar</button><button type="submit" class="btn btn-primary" [disabled]="saving"><span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>Confirmar venta</button></div>
          </form>
        </div></div>
      </div>

      <div class="modal fade" [class.show]="showDetailModal" [style.display]="showDetailModal ? 'block' : 'none'" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content border-0 shadow">
          <div class="modal-header"><h5 class="modal-title fw-bold">Detalle de venta <span *ngIf="selectedVenta">#{{ selectedVenta.id }}</span></h5><button type="button" class="btn-close" (click)="closeDetailModal()"></button></div>
          <div class="modal-body" *ngIf="selectedVenta"><div class="row mb-3 small"><div class="col-md-6"><strong>Sucursal:</strong> {{ selectedVenta.sucursalNombre }}<br><strong>Usuario:</strong> {{ selectedVenta.usuarioNombre }}</div><div class="col-md-6"><strong>Fecha:</strong> {{ selectedVenta.fecha | date:'dd/MM/yyyy HH:mm' }}<br><strong>Estado:</strong> <span class="badge" [ngClass]="selectedVenta.estado === 'Confirmada' ? 'bg-success' : 'bg-secondary'">{{ selectedVenta.estado }}</span></div></div>
            <table class="table"><thead><tr><th>Producto</th><th class="text-center">Cantidad</th><th class="text-end">Precio unitario</th><th class="text-end">Subtotal</th></tr></thead><tbody><tr *ngFor="let detail of selectedVenta.detalles"><td><strong>{{ detail.productoNombre }}</strong><small class="d-block text-muted">{{ detail.productoCodigo }}</small></td><td class="text-center">{{ detail.cantidad }}</td><td class="text-end">\${{ detail.precioUnitario | number:'1.2-2' }}</td><td class="text-end">\${{ detail.subtotal | number:'1.2-2' }}</td></tr></tbody><tfoot><tr><th colspan="3" class="text-end">Total</th><th class="text-end">\${{ selectedVenta.total | number:'1.2-2' }}</th></tr></tfoot></table>

            <!-- Sección de Comprobante / Factura adjunta -->
            <div class="mt-4 p-3 bg-light rounded border">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <h6 class="mb-1 fw-bold"><i class="bi bi-paperclip me-1"></i>Comprobante o Factura adjunta</h6>
                  <span *ngIf="selectedVenta.archivoAdjunto" class="badge bg-success">
                    <i class="bi bi-check-circle me-1"></i>Comprobante disponible
                  </span>
                  <span *ngIf="!selectedVenta.archivoAdjunto" class="text-muted small">
                    Esta venta no posee comprobante adjunto.
                  </span>
                </div>
                <div *ngIf="selectedVenta.archivoAdjunto">
                  <button type="button" class="btn btn-outline-primary btn-sm" (click)="descargarComprobante(selectedVenta.id)">
                    <i class="bi bi-download me-1"></i>Ver / Descargar comprobante
                  </button>
                </div>
              </div>

              <!-- Adjuntar o reemplazar archivo si la venta está Confirmada -->
              <div class="mt-3 pt-3 border-top" *ngIf="selectedVenta.estado === 'Confirmada'">
                <label class="form-label small fw-semibold">{{ selectedVenta.archivoAdjunto ? 'Reemplazar comprobante' : 'Adjuntar comprobante ahora' }}:</label>
                <div class="d-flex gap-2">
                  <input type="file" class="form-control form-control-sm" accept=".pdf,image/jpeg,image/png" (change)="onDetailComprobanteSelected($event)" />
                  <button type="button" class="btn btn-primary btn-sm text-nowrap" [disabled]="!detailComprobanteFile || uploadingComprobante" (click)="uploadDetailComprobante()">
                    <span *ngIf="uploadingComprobante" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="!uploadingComprobante" class="bi bi-upload me-1"></i>Subir
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn btn-secondary" (click)="closeDetailModal()">Cerrar</button></div>
        </div></div>
      </div>

      <div class="modal fade" [class.show]="showCancelModal" [style.display]="showCancelModal ? 'block' : 'none'" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content border-0 shadow">
        <div class="modal-header"><h5 class="modal-title text-danger fw-bold">Anular venta</h5><button type="button" class="btn-close" (click)="closeCancelModal()"></button></div>
        <div class="modal-body">¿Confirmás la anulación de la venta <strong>#{{ saleToCancel?.id }}</strong>? El stock de sus productos será restaurado. Esta operación no elimina el historial.</div>
        <div class="modal-footer"><button class="btn btn-secondary" (click)="closeCancelModal()">Cancelar</button><button class="btn btn-danger" (click)="cancelSale()" [disabled]="cancelling"><span *ngIf="cancelling" class="spinner-border spinner-border-sm me-1"></span>Anular venta</button></div>
      </div></div></div>

      <div class="modal-backdrop fade show" *ngIf="showCreateModal || showDetailModal || showCancelModal"></div>
    </div>
  `
})
export class VentasComponent implements OnInit, OnDestroy {
  ventas: VentaList[] = [];
  sucursales: Sucursal[] = [];
  productResults: StockList[] = [];
  selectedProducts: StockList[] = [];
  selectedVenta: VentaDetail | null = null;
  saleToCancel: VentaList | null = null;

  page = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  searchTerm = '';
  filterSucursalId = 'all';
  filterEstado = 'all';
  productSearchTerm = '';
  userSucursalId: number | null = null;
  isAdmin = false;
  loading = false;
  saving = false;
  cancelling = false;
  submitted = false;
  showCreateModal = false;
  showDetailModal = false;
  showCancelModal = false;
  alertMessage: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  // Manejo de Comprobante / Archivo adjunto
  selectedComprobanteFile: File | null = null;
  detailComprobanteFile: File | null = null;
  uploadingComprobante = false;

  ventaForm: FormGroup;
  private readonly searchSubject = new Subject<string>();
  private readonly productSearchSubject = new Subject<string>();
  private readonly subscriptions = new Subscription();

  constructor(
    private ventaService: VentaService,
    private stockService: StockService,
    private sucursalService: SucursalService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.ventaForm = this.fb.group({
      sucursalId: [null],
      detalles: this.fb.array([])
    });
  }

  get detalles(): FormArray {
    return this.ventaForm.get('detalles') as FormArray;
  }

  get activeVentaSucursalId(): number | null {
    if (!this.isAdmin) return this.userSucursalId;
    const value = this.ventaForm.controls['sucursalId'].value;
    return value ? Number(value) : null;
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.isAdmin = this.authService.hasRole('Administrador');
    this.userSucursalId = user?.sucursalId ?? null;

    if (this.isAdmin) this.loadSucursales();

    this.subscriptions.add(this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      this.searchTerm = term;
      this.page = 1;
      this.loadVentas();
    }));
    this.subscriptions.add(this.productSearchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      this.productSearchTerm = term;
      this.loadProductsForSale();
    }));
    this.loadVentas();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadSucursales(): void {
    this.sucursalService.getAll(true).subscribe({ next: data => this.sucursales = data });
  }

  loadVentas(): void {
    this.loading = true;
    const sucursalId = this.isAdmin && this.filterSucursalId !== 'all' ? Number(this.filterSucursalId) : undefined;
    const estado = this.filterEstado === 'all' ? undefined : this.filterEstado as VentaEstado;
    this.ventaService.getPaged(this.page, this.pageSize, this.searchTerm, sucursalId, estado).subscribe({
      next: result => {
        this.ventas = result.items;
        this.totalItems = result.totalItems;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.showAlert(error.error?.detail || 'No se pudieron cargar las ventas.', 'danger');
      }
    });
  }

  onSearchInput(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  onSucursalFilterChange(event: Event): void {
    this.filterSucursalId = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadVentas();
  }

  onEstadoFilterChange(event: Event): void {
    this.filterEstado = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadVentas();
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
      this.page = newPage;
      this.loadVentas();
    }
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  openCreateModal(): void {
    this.submitted = false;
    this.productResults = [];
    this.productSearchTerm = '';
    this.selectedProducts = [];
    this.selectedComprobanteFile = null;
    this.detalles.clear();
    this.ventaForm.reset({ sucursalId: this.isAdmin ? null : this.userSucursalId });
    if (this.isAdmin) {
      this.ventaForm.controls['sucursalId'].setValidators(Validators.required);
    } else {
      this.ventaForm.controls['sucursalId'].clearValidators();
    }
    this.ventaForm.controls['sucursalId'].updateValueAndValidity();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.selectedComprobanteFile = null;
  }

  onComprobanteSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.showAlert('Formato no permitido. Solo se aceptan archivos PDF, JPG y PNG.', 'danger');
        input.value = '';
        this.selectedComprobanteFile = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showAlert('El comprobante no debe superar los 5 MB.', 'danger');
        input.value = '';
        this.selectedComprobanteFile = null;
        return;
      }
      this.selectedComprobanteFile = file;
    }
  }

  onDetailComprobanteSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.showAlert('Formato no permitido. Solo se aceptan archivos PDF, JPG y PNG.', 'danger');
        input.value = '';
        this.detailComprobanteFile = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showAlert('El comprobante no debe superar los 5 MB.', 'danger');
        input.value = '';
        this.detailComprobanteFile = null;
        return;
      }
      this.detailComprobanteFile = file;
    }
  }

  uploadDetailComprobante(): void {
    if (!this.selectedVenta || !this.detailComprobanteFile) return;

    this.uploadingComprobante = true;
    this.ventaService.adjuntarArchivo(this.selectedVenta.id, this.detailComprobanteFile).subscribe({
      next: updatedSale => {
        this.uploadingComprobante = false;
        this.detailComprobanteFile = null;
        this.selectedVenta = updatedSale;
        this.showAlert(`Comprobante adjuntado con éxito a la venta #${updatedSale.id}.`, 'success');
        this.loadVentas();
      },
      error: error => {
        this.uploadingComprobante = false;
        this.showAlert(error.error?.detail || 'No se pudo adjuntar el comprobante.', 'danger');
      }
    });
  }

  descargarComprobante(ventaId: number): void {
    this.ventaService.descargarAdjunto(ventaId).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante_venta_${ventaId}`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: error => {
        this.showAlert(error.error?.detail || 'No se pudo descargar el archivo del comprobante.', 'danger');
      }
    });
  }

  onVentaSucursalChange(): void {
    this.selectedProducts = [];
    this.detalles.clear();
    this.productResults = [];
    this.productSearchTerm = '';
  }

  onProductSearchInput(event: Event): void {
    this.productSearchSubject.next((event.target as HTMLInputElement).value);
  }

  loadProductsForSale(): void {
    const sucursalId = this.activeVentaSucursalId;
    if (!sucursalId || !this.productSearchTerm.trim()) {
      this.productResults = [];
      return;
    }

    this.stockService.getPaged(1, 10, sucursalId, this.productSearchTerm).subscribe({
      next: result => this.productResults = result.items.filter(item => item.productoActivo !== false),
      error: () => this.productResults = []
    });
  }

  addProduct(stock: StockList): void {
    if (stock.cantidad <= 0) {
      this.showAlert('El producto seleccionado no tiene stock disponible.', 'danger');
      return;
    }

    const existingIndex = this.selectedProducts.findIndex(item => item.productoId === stock.productoId);
    if (existingIndex >= 0) {
      const quantity = this.detalles.at(existingIndex).get('cantidad')!;
      const nextQuantity = Number(quantity.value) + 1;
      if (nextQuantity > stock.cantidad) {
        this.showAlert('La cantidad no puede superar el stock disponible.', 'danger');
        return;
      }
      quantity.setValue(nextQuantity);
    } else {
      this.selectedProducts.push(stock);
      this.detalles.push(this.fb.group({
        productoId: [stock.productoId],
        cantidad: [1, [Validators.required, Validators.min(1), Validators.max(stock.cantidad)]]
      }));
    }
    this.productResults = [];
    this.productSearchTerm = '';
  }

  removeProduct(index: number): void {
    this.selectedProducts.splice(index, 1);
    this.detalles.removeAt(index);
  }

  getSubtotal(index: number): number {
    const quantity = Number(this.detalles.at(index)?.get('cantidad')?.value || 0);
    return this.selectedProducts[index].productoPrecio * quantity;
  }

  getTotal(): number {
    return this.selectedProducts.reduce((total, _, index) => total + this.getSubtotal(index), 0);
  }

  saveVenta(): void {
    this.submitted = true;
    if (this.ventaForm.invalid || this.detalles.length === 0 || !this.activeVentaSucursalId) return;

    this.saving = true;
    const dto: VentaCreate = {
      detalles: this.detalles.controls.map(control => ({
        productoId: Number(control.get('productoId')?.value),
        cantidad: Number(control.get('cantidad')?.value)
      }))
    };
    if (this.isAdmin) dto.sucursalId = this.activeVentaSucursalId;

    this.ventaService.create(dto).subscribe({
      next: sale => {
        if (this.selectedComprobanteFile) {
          this.ventaService.adjuntarArchivo(sale.id, this.selectedComprobanteFile).subscribe({
            next: () => {
              this.saving = false;
              this.closeCreateModal();
              this.showAlert(`Venta #${sale.id} registrada con comprobante adjunto.`, 'success');
              this.loadVentas();
            },
            error: () => {
              this.saving = false;
              this.closeCreateModal();
              this.showAlert(`Venta #${sale.id} registrada, pero hubo un error al adjuntar el comprobante.`, 'danger');
              this.loadVentas();
            }
          });
        } else {
          this.saving = false;
          this.closeCreateModal();
          this.showAlert(`Venta #${sale.id} registrada correctamente.`, 'success');
          this.loadVentas();
        }
      },
      error: error => {
        this.saving = false;
        this.showAlert(error.error?.detail || 'No se pudo registrar la venta.', 'danger');
      }
    });
  }

  openDetailModal(id: number): void {
    this.ventaService.getById(id).subscribe({
      next: sale => {
        this.selectedVenta = sale;
        this.detailComprobanteFile = null;
        this.uploadingComprobante = false;
        this.showDetailModal = true;
      },
      error: error => this.showAlert(error.error?.detail || 'No se pudo obtener el detalle de la venta.', 'danger')
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedVenta = null;
    this.detailComprobanteFile = null;
    this.uploadingComprobante = false;
  }

  openCancelModal(sale: VentaList): void {
    this.saleToCancel = sale;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.saleToCancel = null;
  }

  cancelSale(): void {
    if (!this.saleToCancel) return;
    this.cancelling = true;
    this.ventaService.anular(this.saleToCancel.id).subscribe({
      next: sale => {
        this.cancelling = false;
        this.closeCancelModal();
        this.showAlert(`La venta #${sale.id} fue anulada y su stock restaurado.`, 'success');
        this.loadVentas();
      },
      error: error => {
        this.cancelling = false;
        this.showAlert(error.error?.detail || 'No se pudo anular la venta.', 'danger');
      }
    });
  }

  private showAlert(message: string, type: 'success' | 'danger'): void {
    this.alertMessage = message;
    this.alertType = type;
  }
}
