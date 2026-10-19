import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioService } from './usuario.service';
import { environment } from '../../../environments/environment';
import { UsuarioList, UsuarioDetail, UsuarioCreate, UsuarioUpdate } from '../models/user.model';
import { PagedResult } from '../models/paged-result.model';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/api/usuarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get paged usuarios with search and filters', () => {
    const mockPaged: PagedResult<UsuarioList> = {
      items: [
        {
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.local',
          rol: 'Empleado',
          sucursalId: 1,
          sucursalNombre: 'Central',
          activo: true,
          fechaCreacion: '2026-01-01T00:00:00Z'
        }
      ],
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1
    };

    service.getPaged(1, 10, 'Juan', 'Empleado', 1, true).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].nombre).toBe('Juan');
    });

    const req = httpMock.expectOne((r) =>
      r.url === baseUrl &&
      r.params.get('search') === 'Juan' &&
      r.params.get('rol') === 'Empleado' &&
      r.params.get('sucursalId') === '1' &&
      r.params.get('soloActivos') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaged);
  });

  it('should create a new usuario', () => {
    const createDto: UsuarioCreate = {
      nombre: 'Carlos',
      apellido: 'Gómez',
      email: 'carlos@test.local',
      password: 'Password123*',
      rol: 'Empleado',
      sucursalId: 1
    };

    const mockDetail: UsuarioDetail = {
      id: 2,
      nombre: 'Carlos',
      apellido: 'Gómez',
      email: 'carlos@test.local',
      rol: 'Empleado',
      sucursalId: 1,
      sucursalNombre: 'Central',
      activo: true,
      fechaCreacion: '2026-01-01T00:00:00Z'
    };

    service.create(createDto).subscribe((res) => {
      expect(res.id).toBe(2);
      expect(res.email).toBe('carlos@test.local');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockDetail);
  });

  it('should update an existing usuario', () => {
    const updateDto: UsuarioUpdate = {
      nombre: 'Carlos',
      apellido: 'Gómez Editado',
      email: 'carlos@test.local',
      rol: 'Administrador',
      sucursalId: null,
      activo: true
    };

    const mockDetail: UsuarioDetail = {
      id: 2,
      ...updateDto,
      fechaCreacion: '2026-01-01T00:00:00Z'
    };

    service.update(2, updateDto).subscribe((res) => {
      expect(res.apellido).toBe('Gómez Editado');
    });

    const req = httpMock.expectOne(`${baseUrl}/2`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockDetail);
  });

  it('should toggle activo state', () => {
    service.toggleActivo(2).subscribe((res) => {
      expect(res.message).toBe('Estado modificado');
    });

    const req = httpMock.expectOne(`${baseUrl}/2/toggle-activo`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ message: 'Estado modificado' });
  });
});
