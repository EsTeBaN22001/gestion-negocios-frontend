import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SucursalService } from './sucursal.service';
import { environment } from '../../../environments/environment';
import { Sucursal, SucursalCreate, SucursalUpdate } from '../models/sucursal.model';
import { PagedResult } from '../models/paged-result.model';

describe('SucursalService', () => {
  let service: SucursalService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/api/sucursales`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(SucursalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get paged sucursales with parameters', () => {
    const mockPaged: PagedResult<Sucursal> = {
      items: [
        { id: 1, nombre: 'Sucursal Central', direccion: 'Calle 1', telefono: '123', activa: true, usuariosCount: 2 }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    };

    service.getPaged(1, 10, 'Central', true).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].nombre).toBe('Sucursal Central');
    });

    const req = httpMock.expectOne((r) =>
      r.url === baseUrl &&
      r.params.get('page') === '1' &&
      r.params.get('search') === 'Central' &&
      r.params.get('soloActivas') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaged);
  });

  it('should get all sucursales for dropdown', () => {
    const mockList: Sucursal[] = [
      { id: 1, nombre: 'Sucursal 1', activa: true },
      { id: 2, nombre: 'Sucursal 2', activa: true }
    ];

    service.getAll(true).subscribe((data) => {
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne(`${baseUrl}/todas?soloActivas=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });

  it('should create a sucursal', () => {
    const newDto: SucursalCreate = { nombre: 'Nueva Sucursal', direccion: 'Dir', telefono: '123' };
    const mockCreated: Sucursal = { id: 3, ...newDto, activa: true, usuariosCount: 0 };

    service.create(newDto).subscribe((res) => {
      expect(res.id).toBe(3);
      expect(res.nombre).toBe('Nueva Sucursal');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newDto);
    req.flush(mockCreated);
  });

  it('should update a sucursal', () => {
    const updateDto: SucursalUpdate = { nombre: 'Sucursal Modificada', activa: true };
    const mockUpdated: Sucursal = { id: 1, ...updateDto, usuariosCount: 0 };

    service.update(1, updateDto).subscribe((res) => {
      expect(res.nombre).toBe('Sucursal Modificada');
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockUpdated);
  });

  it('should delete or soft-deactivate a sucursal', () => {
    service.delete(1).subscribe((res) => {
      expect(res.deactivated).toBeFalse();
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Eliminado', deactivated: false });
  });
});
