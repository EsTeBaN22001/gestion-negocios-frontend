import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProductosComponent } from './productos.component';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { AuthService } from '../../core/services/auth.service';
import { PagedResult } from '../../core/models/paged-result.model';
import { ProductoList } from '../../core/models/producto.model';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;
  let productoService: ProductoService;
  let categoriaService: CategoriaService;
  let authService: AuthService;

  const mockPaged: PagedResult<ProductoList> = {
    items: [
      {
        id: 1,
        codigo: 'ART-01',
        nombre: 'Alfajor',
        descripcion: 'Dulce',
        precio: 500,
        activo: true,
        categoriaId: 1,
        categoriaNombre: 'Golosinas',
        stockTotal: 10
      }
    ],
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
    productoService = TestBed.inject(ProductoService);
    categoriaService = TestBed.inject(CategoriaService);
    authService = TestBed.inject(AuthService);

    spyOn(authService, 'hasRole').and.returnValue(true);
    spyOn(productoService, 'getPaged').and.returnValue(of(mockPaged));
    spyOn(categoriaService, 'getAll').and.returnValue(of([
      { id: 1, nombre: 'Golosinas', activa: true }
    ]));

    fixture.detectChanges();
  });

  it('should create the component and load products', () => {
    expect(component).toBeTruthy();
    expect(productoService.getPaged).toHaveBeenCalled();
    expect(component.productos.length).toBe(1);
    expect(component.totalItems).toBe(1);
  });

  it('should open create modal with empty form', () => {
    component.openCreateModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.prodForm.get('codigo')?.value).toBe('');
  });

  it('should open edit modal with populated form', () => {
    const item = mockPaged.items[0];
    component.openEditModal(item);
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.editingId).toBe(1);
    expect(component.prodForm.get('codigo')?.value).toBe('ART-01');
    expect(component.prodForm.get('precio')?.value).toBe(500);
  });

  it('should validate required fields when saving empty form', () => {
    component.openCreateModal();
    component.saveProducto();
    expect(component.prodForm.invalid).toBeTrue();
    expect(component.submitted).toBeTrue();
  });

  it('should call create when submitting valid form', () => {
    spyOn(productoService, 'create').and.returnValue(of({
      id: 2,
      codigo: 'ART-02',
      nombre: 'Caramelo',
      descripcion: null,
      precio: 100,
      activo: true,
      categoriaId: 1,
      categoriaNombre: 'Golosinas',
      stocks: []
    }));

    component.openCreateModal();
    component.prodForm.patchValue({
      codigo: 'ART-02',
      nombre: 'Caramelo',
      precio: 100,
      categoriaId: 1
    });

    component.saveProducto();
    expect(productoService.create).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });
});
