import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductoService } from './producto.service';
import { environment } from '../../../environments/environment';
import { ProductoList, ProductoCreate, ProductoUpdate } from '../models/producto.model';
import { PagedResult } from '../models/paged-result.model';

describe('ProductoService', () => {
  let service: ProductoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/api/productos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get paged productos with parameters', () => {
    const mockPaged: PagedResult<ProductoList> = {
      items: [
        {
          id: 1,
          codigo: 'PROD-01',
          nombre: 'Gaseosa Cola',
          descripcion: 'Botella 1.5L',
          precio: 1500,
          activo: true,
          categoriaId: 1,
          categoriaNombre: 'Bebidas',
          stockTotal: 50
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    };

    service.getPaged(1, 10, 'Cola', 1, true).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].nombre).toBe('Gaseosa Cola');
    });

    const req = httpMock.expectOne((r) =>
      r.url === baseUrl &&
      r.params.get('page') === '1' &&
      r.params.get('search') === 'Cola' &&
      r.params.get('categoriaId') === '1' &&
      r.params.get('soloActivos') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaged);
  });

  it('should get all active products for selectors', () => {
    const mockList: ProductoList[] = [
      { id: 1, codigo: 'P1', nombre: 'Prod 1', precio: 10, activo: true, categoriaId: 1, categoriaNombre: 'Cat', stockTotal: 10 }
    ];

    service.getAll(true).subscribe((data) => {
      expect(data.length).toBe(1);
    });

    const req = httpMock.expectOne(`${baseUrl}/todos?soloActivos=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });

  it('should create a product', () => {
    const dto: ProductoCreate = { codigo: 'P2', nombre: 'Prod 2', precio: 200, categoriaId: 1 };
    service.create(dto).subscribe((res) => {
      expect(res.codigo).toBe('P2');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 2, ...dto, activo: true, categoriaNombre: 'Cat', stocks: [] });
  });

  it('should update a product', () => {
    const dto: ProductoUpdate = { codigo: 'P2', nombre: 'Prod 2 Mod', precio: 250, categoriaId: 1, activo: true };
    service.update(2, dto).subscribe((res) => {
      expect(res.nombre).toBe('Prod 2 Mod');
    });

    const req = httpMock.expectOne(`${baseUrl}/2`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 2, ...dto, categoriaNombre: 'Cat', stocks: [] });
  });

  it('should delete or soft-deactivate a product', () => {
    service.delete(1).subscribe((res) => {
      expect(res.deactivated).toBeTrue();
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Desactivado', deactivated: true });
  });
});
