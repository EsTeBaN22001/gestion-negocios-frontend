import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SucursalesComponent } from './sucursales.component';
import { SucursalService } from '../../core/services/sucursal.service';
import { PagedResult } from '../../core/models/paged-result.model';
import { Sucursal } from '../../core/models/sucursal.model';

describe('SucursalesComponent', () => {
  let component: SucursalesComponent;
  let fixture: ComponentFixture<SucursalesComponent>;
  let sucursalService: SucursalService;

  const mockPaged: PagedResult<Sucursal> = {
    items: [
      { id: 1, nombre: 'Sucursal Central', direccion: 'Av. Siempre Viva 123', telefono: '12345', activa: true, usuariosCount: 3 }
    ],
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SucursalesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SucursalesComponent);
    component = fixture.componentInstance;
    sucursalService = TestBed.inject(SucursalService);

    spyOn(sucursalService, 'getPaged').and.returnValue(of(mockPaged));
    fixture.detectChanges();
  });

  it('should create the component and load initial data', () => {
    expect(component).toBeTruthy();
    expect(sucursalService.getPaged).toHaveBeenCalled();
    expect(component.sucursales.length).toBe(1);
    expect(component.totalItems).toBe(1);
  });

  it('should open create modal with empty form', () => {
    component.openCreateModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.sucursalForm.get('nombre')?.value).toBe('');
  });

  it('should open edit modal with populated form', () => {
    const item = mockPaged.items[0];
    component.openEditModal(item);
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.currentSucursalId).toBe(1);
    expect(component.sucursalForm.get('nombre')?.value).toBe('Sucursal Central');
  });

  it('should validate required fields when saving empty form', () => {
    component.openCreateModal();
    component.saveSucursal();
    expect(component.sucursalForm.invalid).toBeTrue();
    expect(component.submitted).toBeTrue();
  });

  it('should call create when saving new sucursal', () => {
    spyOn(sucursalService, 'create').and.returnValue(of({
      id: 2,
      nombre: 'Nueva Sucursal',
      activa: true,
      usuariosCount: 0
    }));

    component.openCreateModal();
    component.sucursalForm.patchValue({
      nombre: 'Nueva Sucursal',
      direccion: 'Calle Falsa 123',
      telefono: '9999'
    });

    component.saveSucursal();
    expect(sucursalService.create).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });
});
