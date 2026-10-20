import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StockService } from './stock.service';
import { environment } from '../../../environments/environment';
import { StockList, StockCreate, StockAjuste } from '../models/stock.model';
import { PagedResult } from '../models/paged-result.model';

describe('StockService', () => {
  let service: StockService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/api/stock`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(StockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get paged stock with parameters', () => {
    const mockPaged: PagedResult<StockList> = {
      items: [
        {
          id: 1,
          productoId: 1,
          productoCodigo: 'PROD-01',
          productoNombre: 'Gaseosa',
          productoPrecio: 1500,
          categoriaNombre: 'Bebidas',
          sucursalId: 1,
          sucursalNombre: 'Central',
          cantidad: 15,
          stockMinimo: 5,
          alertaStock: 'Normal'
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    };

    service.getPaged(1, 10, 1, 'Gaseosa', false).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].productoNombre).toBe('Gaseosa');
    });

    const req = httpMock.expectOne((r) =>
      r.url === baseUrl &&
      r.params.get('page') === '1' &&
      r.params.get('sucursalId') === '1' &&
      r.params.get('search') === 'Gaseosa'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaged);
  });

  it('should create initial stock record', () => {
    const dto: StockCreate = { productoId: 1, sucursalId: 2, cantidad: 20, stockMinimo: 5 };
    service.create(dto).subscribe((res) => {
      expect(res.cantidad).toBe(20);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 2,
      ...dto,
      productoCodigo: 'P1',
      productoNombre: 'Prod',
      productoPrecio: 10,
      categoriaNombre: 'Cat',
      sucursalNombre: 'Suc 2',
      alertaStock: 'Normal'
    });
  });

  it('should adjust stock', () => {
    const dto: StockAjuste = { cantidad: 50, stockMinimo: 10, motivo: 'Recepción' };
    service.ajustar(1, dto).subscribe((res) => {
      expect(res.cantidad).toBe(50);
    });

    const req = httpMock.expectOne(`${baseUrl}/1/ajuste`);
    expect(req.request.method).toBe('PUT');
    req.flush({
      id: 1,
      productoId: 1,
      productoCodigo: 'P1',
      productoNombre: 'Prod',
      productoPrecio: 10,
      categoriaNombre: 'Cat',
      sucursalId: 1,
      sucursalNombre: 'Suc 1',
      cantidad: 50,
      stockMinimo: 10,
      alertaStock: 'Normal'
    });
  });
});
