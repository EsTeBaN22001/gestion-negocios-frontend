import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { UsuarioService } from '../../core/services/usuario.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioList, UsuarioDetail, UsuarioCreate, UsuarioUpdate } from '../../core/models/user.model';
import { Sucursal } from '../../core/models/sucursal.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Encabezado y botón nuevo -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 class="fw-bold mb-1"><i class="bi bi-people-fill text-primary me-2"></i>Gestión de Usuarios</h2>
          <p class="text-muted small mb-0">Administración de operadores y accesos del sistema</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="bi bi-person-plus-fill me-1"></i> Nuevo Usuario
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
            <!-- Búsqueda texto -->
            <div class="col-md-4 col-lg-3">
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Buscar por nombre, email..."
                  [value]="searchTerm"
                  (input)="onSearchInput($event)"
                />
              </div>
            </div>

            <!-- Filtro Rol -->
            <div class="col-md-3 col-lg-2">
              <select class="form-select" [value]="filterRol" (change)="onRolFilterChange($event)">
                <option value="all">Todos los roles</option>
                <option value="Administrador">Administrador</option>
                <option value="Empleado">Empleado</option>
              </select>
            </div>

            <!-- Filtro Sucursal -->
            <div class="col-md-3 col-lg-3">
              <select class="form-select" [value]="filterSucursalId" (change)="onSucursalFilterChange($event)">
                <option value="all">Todas las sucursales</option>
                <option *ngFor="let s of sucursalesList" [value]="s.id">{{ s.nombre }}</option>
              </select>
            </div>

            <!-- Filtro Estado Activo/Inactivo -->
            <div class="col-md-2 col-lg-2">
              <select class="form-select" [value]="filterActivos" (change)="onEstadoFilterChange($event)">
                <option value="all">Todos los estados</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>

            <!-- Total de registros -->
            <div class="col-md-12 col-lg-2 text-lg-end">
              <span class="text-muted small">Total: <strong>{{ totalItems }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de usuarios -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 70px;">ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Sucursal Asignada</th>
                <th>Estado</th>
                <th style="width: 150px;" class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="7" class="text-center py-5">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Cargando usuarios...
                </td>
              </tr>
              <tr *ngIf="!loading && usuarios.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-person-x fs-2 d-block mb-2"></i>
                  No se encontraron usuarios con los criterios especificados.
                </td>
              </tr>
              <tr *ngFor="let u of usuarios">
                <td class="fw-semibold text-muted">#{{ u.id }}</td>
                <td>
                  <div class="d-flex align-items-center">
                    <img
                      *ngIf="u.avatar; else initialsTpl"
                      [src]="getAvatarUrl(u.avatar)"
                      alt="Avatar"
                      class="rounded-circle me-2 border shadow-sm"
                      style="width: 36px; height: 36px; object-fit: cover;"
                    />
                    <ng-template #initialsTpl>
                      <div class="avatar-circle me-2 bg-light text-primary fw-bold border">
                        {{ u.nombre.charAt(0) }}{{ u.apellido.charAt(0) }}
                      </div>
                    </ng-template>
                    <div>
                      <div class="fw-bold">{{ u.nombre }} {{ u.apellido }}</div>
                      <small class="text-muted" *ngIf="currentUserId === u.id">(Tu usuario)</small>
                    </div>
                  </div>
                </td>
                <td>{{ u.email }}</td>
                <td>
                  <span
                    class="badge"
                    [ngClass]="u.rol === 'Administrador' ? 'bg-danger' : 'bg-primary'"
                  >
                    {{ u.rol }}
                  </span>
                </td>
                <td>
                  <span *ngIf="u.sucursalNombre" class="badge bg-light text-dark border">
                    <i class="bi bi-buildings me-1"></i>{{ u.sucursalNombre }}
                  </span>
                  <span *ngIf="!u.sucursalNombre" class="text-muted small fst-italic">
                    Sin sucursal (Global)
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="u.activo ? 'bg-success' : 'bg-secondary'">
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="openEditModal(u)" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-sm"
                    [ngClass]="u.activo ? 'btn-outline-warning' : 'btn-outline-success'"
                    (click)="confirmToggle(u)"
                    [title]="u.activo ? 'Desactivar cuenta' : 'Activar cuenta'"
                    [disabled]="currentUserId === u.id"
                  >
                    <i class="bi" [ngClass]="u.activo ? 'bi-person-slash' : 'bi-person-check'"></i>
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

      <!-- Modal para Crear / Editar Usuario -->
      <div class="modal fade" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">
                {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <form [formGroup]="userForm" (ngSubmit)="saveUsuario()">
              <div class="modal-body">
                <div class="row g-3">
                  <!-- Nombre -->
                  <div class="col-md-6">
                    <label class="form-label">Nombre <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="nombre"
                      [class.is-invalid]="submitted && f['nombre'].errors"
                      placeholder="Ej: Juan"
                    />
                    <div *ngIf="submitted && f['nombre'].errors" class="invalid-feedback">
                      <span *ngIf="f['nombre'].errors['required']">El nombre es obligatorio.</span>
                      <span *ngIf="f['nombre'].errors['maxlength']">Máximo 100 caracteres.</span>
                    </div>
                  </div>

                  <!-- Apellido -->
                  <div class="col-md-6">
                    <label class="form-label">Apellido <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="apellido"
                      [class.is-invalid]="submitted && f['apellido'].errors"
                      placeholder="Ej: Pérez"
                    />
                    <div *ngIf="submitted && f['apellido'].errors" class="invalid-feedback">
                      <span *ngIf="f['apellido'].errors['required']">El apellido es obligatorio.</span>
                      <span *ngIf="f['apellido'].errors['maxlength']">Máximo 100 caracteres.</span>
                    </div>
                  </div>

                  <!-- Email -->
                  <div class="col-md-6">
                    <label class="form-label">Correo Electrónico <span class="text-danger">*</span></label>
                    <input
                      type="email"
                      class="form-control"
                      formControlName="email"
                      [class.is-invalid]="submitted && f['email'].errors"
                      placeholder="ejemplo@negocio.com"
                    />
                    <div *ngIf="submitted && f['email'].errors" class="invalid-feedback">
                      <span *ngIf="f['email'].errors['required']">El email es obligatorio.</span>
                      <span *ngIf="f['email'].errors['email']">Formato de correo electrónico inválido.</span>
                      <span *ngIf="f['email'].errors['maxlength']">Máximo 150 caracteres.</span>
                    </div>
                  </div>

                  <!-- Contraseña -->
                  <div class="col-md-6">
                    <label class="form-label">
                      Contraseña
                      <span class="text-danger" *ngIf="!isEditing">*</span>
                    </label>
                    <input
                      type="password"
                      class="form-control"
                      formControlName="password"
                      [class.is-invalid]="submitted && f['password'].errors"
                      [placeholder]="isEditing ? 'Dejar en blanco para no modificar' : 'Mínimo 6 caracteres'"
                    />
                    <div *ngIf="submitted && f['password'].errors" class="invalid-feedback">
                      <span *ngIf="f['password'].errors['required']">La contraseña es obligatoria.</span>
                      <span *ngIf="f['password'].errors['minlength']">Debe tener al menos 6 caracteres.</span>
                    </div>
                    <small *ngIf="isEditing" class="text-muted d-block mt-1">
                      Solo ingrese una contraseña si desea cambiar la actual.
                    </small>
                  </div>

                  <!-- Rol -->
                  <div class="col-md-6">
                    <label class="form-label">Rol del Usuario <span class="text-danger">*</span></label>
                    <select
                      class="form-select"
                      formControlName="rol"
                      (change)="onRoleSelectionChange()"
                      [class.is-invalid]="submitted && f['rol'].errors"
                    >
                      <option value="Empleado">Empleado (Acceso operativo a una sucursal)</option>
                      <option value="Administrador">Administrador (Acceso global total)</option>
                    </select>
                    <div *ngIf="submitted && f['rol'].errors" class="invalid-feedback">
                      <span>El rol es obligatorio.</span>
                    </div>
                  </div>

                  <!-- Sucursal Asignada -->
                  <div class="col-md-6">
                    <label class="form-label">
                      Sucursal Asignada
                      <span class="text-danger" *ngIf="f['rol'].value === 'Empleado'">*</span>
                    </label>
                    <select
                      class="form-select"
                      formControlName="sucursalId"
                      [class.is-invalid]="submitted && f['sucursalId'].errors"
                    >
                      <option [ngValue]="null">
                        {{ f['rol'].value === 'Administrador' ? 'Sin sucursal (Acceso Global)' : '— Seleccionar Sucursal Obligatoria —' }}
                      </option>
                      <option *ngFor="let s of sucursalesList" [ngValue]="s.id">
                        {{ s.nombre }} {{ s.activa ? '' : '(Inactiva)' }}
                      </option>
                    </select>
                    <div *ngIf="submitted && f['sucursalId'].errors" class="invalid-feedback">
                      <span *ngIf="f['sucursalId'].errors['required']">Los empleados deben tener una sucursal asignada.</span>
                    </div>
                  </div>

                  <!-- Foto de Perfil (Avatar) -->
                  <div class="col-12">
                    <label class="form-label fw-semibold">Foto de Perfil (Avatar)</label>
                    <div class="d-flex align-items-center gap-3">
                      <img
                        *ngIf="avatarPreviewUrl || editingUserAvatar; else noModalAvatar"
                        [src]="avatarPreviewUrl || getAvatarUrl(editingUserAvatar)"
                        alt="Preview"
                        class="rounded-circle border border-2 border-primary shadow-sm"
                        style="width: 50px; height: 50px; object-fit: cover;"
                      />
                      <ng-template #noModalAvatar>
                        <div class="rounded-circle bg-light border d-flex align-items-center justify-content-center text-muted" style="width: 50px; height: 50px;">
                          <i class="bi bi-person fs-4"></i>
                        </div>
                      </ng-template>
                      <div class="flex-grow-1">
                        <input
                          type="file"
                          class="form-control form-control-sm"
                          accept="image/jpeg,image/png,image/webp"
                          (change)="onModalAvatarSelected($event)"
                        />
                        <small class="text-muted d-block mt-1">Formatos permitidos: JPG, PNG, WEBP (máx. 2 MB)</small>
                      </div>
                      <button
                        *ngIf="isEditing && (editingUserAvatar || selectedAvatarFile)"
                        type="button"
                        class="btn btn-outline-danger btn-sm"
                        (click)="removeModalAvatar()"
                        title="Quitar foto actual"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Estado Activo (solo en edición) -->
                  <div class="col-12" *ngIf="isEditing">
                    <div class="form-check form-switch mt-2">
                      <input class="form-check-input" type="checkbox" id="activoSwitch" formControlName="activo" />
                      <label class="form-check-label" for="activoSwitch">Usuario Activo</label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                  {{ isEditing ? 'Guardar Cambios' : 'Crear Usuario' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Backdrop de Modal -->
      <div class="modal-backdrop fade show" *ngIf="showModal || showConfirmModal"></div>

      <!-- Modal de Confirmación de Toggle Activo -->
      <div class="modal fade" [class.show]="showConfirmModal" [style.display]="showConfirmModal ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header bg-light">
              <h5 class="modal-title fw-bold">
                {{ userToToggle?.activo ? 'Confirmar Desactivación' : 'Confirmar Activación' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeConfirmModal()"></button>
            </div>
            <div class="modal-body">
              <p *ngIf="userToToggle?.activo">
                ¿Está seguro de que desea <strong>desactivar</strong> la cuenta de
                <strong>{{ userToToggle?.nombre }} {{ userToToggle?.apellido }}</strong>?
                El usuario ya no podrá iniciar sesión en el sistema.
              </p>
              <p *ngIf="!userToToggle?.activo">
                ¿Desea <strong>activar</strong> nuevamente la cuenta de
                <strong>{{ userToToggle?.nombre }} {{ userToToggle?.apellido }}</strong>?
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeConfirmModal()">Cancelar</button>
              <button
                type="button"
                class="btn"
                [ngClass]="userToToggle?.activo ? 'btn-danger' : 'btn-success'"
                (click)="executeToggle()"
                [disabled]="toggling"
              >
                <span *ngIf="toggling" class="spinner-border spinner-border-sm me-1"></span>
                {{ userToToggle?.activo ? 'Sí, Desactivar' : 'Sí, Activar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
  `]
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: UsuarioList[] = [];
  sucursalesList: Sucursal[] = [];
  loading = false;
  saving = false;
  toggling = false;

  // Paginación server-side
  page = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;

  // Filtros
  searchTerm = '';
  filterRol = 'all';
  filterSucursalId: string = 'all';
  filterActivos = 'all';

  // Búsqueda reactiva con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Formulario y Modal
  userForm: FormGroup;
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  submitted = false;

  // Modal Confirmación Toggle
  showConfirmModal = false;
  userToToggle: UsuarioList | null = null;

  // Manejo de Avatar
  selectedAvatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;
  editingUserAvatar: string | null = null;
  shouldDeleteAvatar = false;

  // Notificaciones
  alertMessage: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  // Usuario logueado
  currentUserId: number | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: [''],
      rol: ['Empleado', Validators.required],
      sucursalId: [null],
      activo: [true]
    });
  }

  get f() {
    return this.userForm.controls;
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.currentUserId = user ? user.id : null;

    this.loadSucursales();

    // Configurar debounce para búsqueda
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.page = 1;
        this.loadUsuarios();
      });

    this.loadUsuarios();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadSucursales(): void {
    this.sucursalService.getAll(false).subscribe({
      next: (data) => {
        this.sucursalesList = data;
      },
      error: () => {
        // Fallback en caso de error cargando lista para combo
      }
    });
  }

  loadUsuarios(): void {
    this.loading = true;

    const rolParam = this.filterRol !== 'all' ? this.filterRol : undefined;
    const sucursalParam = this.filterSucursalId !== 'all' ? Number(this.filterSucursalId) : undefined;
    let activosParam: boolean | undefined = undefined;
    if (this.filterActivos === 'active') activosParam = true;
    if (this.filterActivos === 'inactive') activosParam = false;

    this.usuarioService.getPaged(
      this.page,
      this.pageSize,
      this.searchTerm,
      rolParam,
      sucursalParam,
      activosParam
    ).subscribe({
      next: (res) => {
        this.usuarios = res.items;
        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showAlert(err.error?.detail || 'Error al cargar la lista de usuarios.', 'danger');
      }
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onRolFilterChange(event: Event): void {
    this.filterRol = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadUsuarios();
  }

  onSucursalFilterChange(event: Event): void {
    this.filterSucursalId = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadUsuarios();
  }

  onEstadoFilterChange(event: Event): void {
    this.filterActivos = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadUsuarios();
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
      this.page = newPage;
      this.loadUsuarios();
    }
  }

  getPageArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onRoleSelectionChange(): void {
    const rol = this.userForm.get('rol')?.value;
    const sucursalControl = this.userForm.get('sucursalId');

    if (rol === 'Empleado') {
      sucursalControl?.setValidators([Validators.required]);
    } else {
      sucursalControl?.clearValidators();
      sucursalControl?.setValue(null);
    }
    sucursalControl?.updateValueAndValidity();
  }

  getAvatarUrl(avatar: string | null | undefined): string | null {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    return `${environment.apiBaseUrl}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  }

  onModalAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.showAlert('Formato de imagen inválido. Solo se admiten JPG, PNG y WEBP.', 'danger');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.showAlert('La imagen excede el límite máximo de 2 MB.', 'danger');
        return;
      }

      this.selectedAvatarFile = file;
      this.shouldDeleteAvatar = false;

      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeModalAvatar(): void {
    this.selectedAvatarFile = null;
    this.avatarPreviewUrl = null;
    this.editingUserAvatar = null;
    this.shouldDeleteAvatar = true;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.submitted = false;
    this.selectedAvatarFile = null;
    this.avatarPreviewUrl = null;
    this.editingUserAvatar = null;
    this.shouldDeleteAvatar = false;

    this.userForm.reset({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      rol: 'Empleado',
      sucursalId: null,
      activo: true
    });

    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.onRoleSelectionChange();

    this.showModal = true;
  }

  openEditModal(usuario: UsuarioList): void {
    this.isEditing = true;
    this.editingId = usuario.id;
    this.submitted = false;
    this.selectedAvatarFile = null;
    this.avatarPreviewUrl = null;
    this.editingUserAvatar = usuario.avatar || null;
    this.shouldDeleteAvatar = false;

    this.userForm.patchValue({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      sucursalId: usuario.sucursalId || null,
      activo: usuario.activo
    });

    this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.onRoleSelectionChange();

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.submitted = false;
    this.selectedAvatarFile = null;
    this.avatarPreviewUrl = null;
    this.editingUserAvatar = null;
    this.shouldDeleteAvatar = false;
    this.userForm.reset();
  }

  saveUsuario(): void {
    this.submitted = true;

    if (this.userForm.invalid) {
      return;
    }

    this.saving = true;
    const formVal = this.userForm.value;

    if (this.isEditing && this.editingId) {
      const updateDto: UsuarioUpdate = {
        nombre: formVal.nombre,
        apellido: formVal.apellido,
        email: formVal.email,
        rol: formVal.rol,
        sucursalId: formVal.rol === 'Empleado' ? Number(formVal.sucursalId) : null,
        activo: formVal.activo,
        password: formVal.password && formVal.password.trim() ? formVal.password.trim() : null
      };

      this.usuarioService.update(this.editingId, updateDto).subscribe({
        next: (updatedUser) => {
          // Procesar avatar si corresponde
          if (this.shouldDeleteAvatar) {
            this.usuarioService.deleteAvatar(this.editingId!).subscribe({
              next: () => this.finalizeSave('Usuario actualizado con éxito.'),
              error: () => this.finalizeSave('Usuario actualizado, pero hubo un error al eliminar el avatar.')
            });
          } else if (this.selectedAvatarFile) {
            this.usuarioService.uploadAvatar(this.editingId!, this.selectedAvatarFile).subscribe({
              next: () => this.finalizeSave('Usuario y foto de perfil actualizados con éxito.'),
              error: () => this.finalizeSave('Usuario actualizado, pero hubo un error al subir el avatar.')
            });
          } else {
            this.finalizeSave('Usuario actualizado con éxito.');
          }
        },
        error: (err) => {
          this.saving = false;
          const msg = err.error?.detail || err.error?.message || 'Error al actualizar el usuario.';
          this.showAlert(msg, 'danger');
        }
      });
    } else {
      const createDto: UsuarioCreate = {
        nombre: formVal.nombre,
        apellido: formVal.apellido,
        email: formVal.email,
        password: formVal.password,
        rol: formVal.rol,
        sucursalId: formVal.rol === 'Empleado' ? Number(formVal.sucursalId) : null
      };

      this.usuarioService.create(createDto).subscribe({
        next: (newUser) => {
          if (this.selectedAvatarFile) {
            this.usuarioService.uploadAvatar(newUser.id, this.selectedAvatarFile).subscribe({
              next: () => this.finalizeSave('Usuario creado y foto de perfil asignada con éxito.'),
              error: () => this.finalizeSave('Usuario creado, pero hubo un error al subir el avatar.')
            });
          } else {
            this.finalizeSave('Usuario creado con éxito.');
          }
        },
        error: (err) => {
          this.saving = false;
          const msg = err.error?.detail || err.error?.message || 'Error al crear el usuario.';
          this.showAlert(msg, 'danger');
        }
      });
    }
  }

  private finalizeSave(message: string): void {
    this.saving = false;
    this.closeModal();
    this.showAlert(message, 'success');
    this.loadUsuarios();
  }

  confirmToggle(usuario: UsuarioList): void {
    this.userToToggle = usuario;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.userToToggle = null;
  }

  executeToggle(): void {
    if (!this.userToToggle) return;

    this.toggling = true;
    this.usuarioService.toggleActivo(this.userToToggle.id).subscribe({
      next: (res) => {
        this.toggling = false;
        this.closeConfirmModal();
        this.showAlert(res.message || 'Estado del usuario actualizado.', 'success');
        this.loadUsuarios();
      },
      error: (err) => {
        this.toggling = false;
        this.closeConfirmModal();
        const msg = err.error?.detail || err.error?.message || 'Error al modificar el estado del usuario.';
        this.showAlert(msg, 'danger');
      }
    });
  }

  showAlert(message: string, type: 'success' | 'danger'): void {
    this.alertMessage = message;
    this.alertType = type;
  }
}
