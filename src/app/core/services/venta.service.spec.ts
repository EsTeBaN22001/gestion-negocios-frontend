import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { VentaService } from './venta.service';
import { environment } from '../../../environments/environment';

describe('VentaService', () => {
  let service: VentaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(VentaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should request paged sales with server-side filters', () => {
    service.getPaged(2, 10, 'agua', 3, 'Confirmada').subscribe();

    const request = httpMock.expectOne(req =>
      req.url === `${environment.apiBaseUrl}/api/ventas` &&
      req.params.get('page') === '2' &&
      req.params.get('search') === 'agua' &&
      req.params.get('sucursalId') === '3' &&
      req.params.get('estado') === 'Confirmada');

    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 2, pageSize: 10, totalItems: 0, totalPages: 0 });
  });

  it('should create a sale without client-side price or total', () => {
    service.create({ detalles: [{ productoId: 4, cantidad: 2 }] }).subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/api/ventas`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ detalles: [{ productoId: 4, cantidad: 2 }] });
    request.flush({ id: 1, detalles: [] });
  });

  it('should upload sale attachment with FormData', () => {
    const file = new File(['ticket-bytes'], 'ticket.pdf', { type: 'application/pdf' });
    service.adjuntarArchivo(10, file).subscribe(res => {
      expect(res.archivoAdjunto).toBe('/uploads/ventas/ticket.pdf');
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/api/ventas/10/adjunto`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    request.flush({ id: 10, archivoAdjunto: '/uploads/ventas/ticket.pdf', detalles: [] });
  });

  it('should download sale attachment as blob', () => {
    service.descargarAdjunto(10).subscribe(blob => {
      expect(blob).toBeTruthy();
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/api/ventas/10/adjunto`);
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['pdf content']));
  });
});
