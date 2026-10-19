import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoriasComponent } from './categorias.component';
import { CategoriaService } from '../../core/services/categoria.service';
import { PagedResult } from '../../core/models/paged-result.model';
import { Categoria } from '../../core/models/categoria.model';

describe('CategoriasComponent', () => {
  let component: CategoriasComponent;
  let fixture: ComponentFixture<CategoriasComponent>;
  let categoriaService: CategoriaService;

  const mockPaged: PagedResult<Categoria> = {
    items: [
      { id: 1, nombre: 'Bebidas', descripcion: 'Gaseosas y aguas', activa: true, productosCount: 10 }
    ],
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriasComponent);
    component = fixture.componentInstance;
    categoriaService = TestBed.inject(CategoriaService);

    spyOn(categoriaService, 'getPaged').and.returnValue(of(mockPaged));
    fixture.detectChanges();
  });

  it('should create the component and load initial data', () => {
    expect(component).toBeTruthy();
    expect(categoriaService.getPaged).toHaveBeenCalled();
    expect(component.categorias.length).toBe(1);
    expect(component.totalItems).toBe(1);
  });

  it('should open create modal with empty form', () => {
    component.openCreateModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.categoriaForm.get('nombre')?.value).toBe('');
  });

  it('should open edit modal with populated form', () => {
    const item = mockPaged.items[0];
    component.openEditModal(item);
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.currentCategoriaId).toBe(1);
    expect(component.categoriaForm.get('nombre')?.value).toBe('Bebidas');
  });

  it('should validate required fields when saving empty form', () => {
    component.openCreateModal();
    component.saveCategoria();
    expect(component.categoriaForm.invalid).toBeTrue();
    expect(component.submitted).toBeTrue();
  });

  it('should call create when saving new category', () => {
    spyOn(categoriaService, 'create').and.returnValue(of({
      id: 2,
      nombre: 'Snacks',
      activa: true,
      productosCount: 0
    }));

    component.openCreateModal();
    component.categoriaForm.patchValue({
      nombre: 'Snacks',
      descripcion: 'Papas fritas y maníes'
    });

    component.saveCategoria();
    expect(categoriaService.create).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });
});
