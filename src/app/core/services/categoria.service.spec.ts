import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriaService } from './categoria.service';
import { environment } from '../../../environments/environment';
import { Categoria, CategoriaCreate, CategoriaUpdate } from '../models/categoria.model';
import { PagedResult } from '../models/paged-result.model';

describe('CategoriaService', () => {
  let service: CategoriaService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/api/categorias`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CategoriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get paged categorias with filters', () => {
    const mockPaged: PagedResult<Categoria> = {
      items: [
        { id: 1, nombre: 'Bebidas', descripcion: 'Todo tipo de bebidas', activa: true, productosCount: 5 }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    };

    service.getPaged(1, 10, 'Bebidas', true).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].nombre).toBe('Bebidas');
    });

    const req = httpMock.expectOne((r) =>
      r.url === baseUrl &&
      r.params.get('page') === '1' &&
      r.params.get('search') === 'Bebidas'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaged);
  });

  it('should get all active categorias', () => {
    const mockList: Categoria[] = [
      { id: 1, nombre: 'Bebidas', activa: true },
      { id: 2, nombre: 'Alimentos', activa: true }
    ];

    service.getAll(true).subscribe((data) => {
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne(`${baseUrl}/todas?soloActivas=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });

  it('should create a categoria', () => {
    const dto: CategoriaCreate = { nombre: 'Lácteos', descripcion: 'Quesos y yogures' };
    const mockCreated: Categoria = { id: 3, ...dto, activa: true, productosCount: 0 };

    service.create(dto).subscribe((res) => {
      expect(res.id).toBe(3);
      expect(res.nombre).toBe('Lácteos');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockCreated);
  });

  it('should update a categoria', () => {
    const dto: CategoriaUpdate = { nombre: 'Lácteos y Derivados', descripcion: 'Actualizado', activa: true };
    const mockUpdated: Categoria = { id: 3, ...dto, productosCount: 0 };

    service.update(3, dto).subscribe((res) => {
      expect(res.nombre).toBe('Lácteos y Derivados');
    });

    const req = httpMock.expectOne(`${baseUrl}/3`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockUpdated);
  });

  it('should delete or soft-deactivate a categoria', () => {
    service.delete(3).subscribe((res) => {
      expect(res.deactivated).toBeFalse();
    });

    const req = httpMock.expectOne(`${baseUrl}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Eliminado', deactivated: false });
  });
});
