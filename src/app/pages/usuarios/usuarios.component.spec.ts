import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UsuariosComponent } from './usuarios.component';
import { UsuarioService } from '../../core/services/usuario.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { AuthService } from '../../core/services/auth.service';
import { PagedResult } from '../../core/models/paged-result.model';
import { UsuarioList } from '../../core/models/user.model';

describe('UsuariosComponent', () => {
  let component: UsuariosComponent;
  let fixture: ComponentFixture<UsuariosComponent>;
  let usuarioService: UsuarioService;
  let sucursalService: SucursalService;

  const mockPaged: PagedResult<UsuarioList> = {
    items: [
      {
        id: 1,
        nombre: 'Admin',
        apellido: 'Root',
        email: 'admin@gestionnegocios.local',
        rol: 'Administrador',
        sucursalId: null,
        sucursalNombre: null,
        activo: true,
        fechaCreacion: '2026-01-01T00:00:00Z'
      }
    ],
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosComponent);
    component = fixture.componentInstance;
    usuarioService = TestBed.inject(UsuarioService);
    sucursalService = TestBed.inject(SucursalService);

    spyOn(usuarioService, 'getPaged').and.returnValue(of(mockPaged));
    spyOn(sucursalService, 'getAll').and.returnValue(of([
      { id: 1, nombre: 'Sucursal Central', activa: true }
    ]));

    fixture.detectChanges();
  });

  it('should create the component and load users', () => {
    expect(component).toBeTruthy();
    expect(usuarioService.getPaged).toHaveBeenCalled();
    expect(component.usuarios.length).toBe(1);
    expect(component.totalItems).toBe(1);
  });

  it('should open create modal with empty form and password required', () => {
    component.openCreateModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.userForm.get('password')?.hasError('required')).toBeTrue();
  });

  it('should open edit modal with user data and password optional', () => {
    const item = mockPaged.items[0];
    component.openEditModal(item);
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.editingId).toBe(1);
    expect(component.userForm.get('nombre')?.value).toBe('Admin');
    expect(component.userForm.get('password')?.hasError('required')).toBeFalse();
  });

  it('should enforce sucursalId when role is Empleado', () => {
    component.openCreateModal();
    component.userForm.patchValue({ rol: 'Empleado', sucursalId: null });
    component.onRoleSelectionChange();

    expect(component.userForm.get('sucursalId')?.hasError('required')).toBeTrue();

    component.userForm.patchValue({ rol: 'Administrador' });
    component.onRoleSelectionChange();
    expect(component.userForm.get('sucursalId')?.hasError('required')).toBeFalse();
  });

  it('should call create when submitting valid form', () => {
    spyOn(usuarioService, 'create').and.returnValue(of({
      id: 2,
      nombre: 'Nuevo',
      apellido: 'Empleado',
      email: 'empleado@test.local',
      rol: 'Empleado',
      sucursalId: 1,
      activo: true,
      fechaCreacion: '2026-01-01T00:00:00Z'
    }));

    component.openCreateModal();
    component.userForm.patchValue({
      nombre: 'Nuevo',
      apellido: 'Empleado',
      email: 'empleado@test.local',
      password: 'Password123*',
      rol: 'Empleado',
      sucursalId: 1
    });

    component.saveUsuario();
    expect(usuarioService.create).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });
});
