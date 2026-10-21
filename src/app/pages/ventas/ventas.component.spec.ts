import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { VentasComponent } from './ventas.component';
import { VentaService } from '../../core/services/venta.service';
import { StockService } from '../../core/services/stock.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { AuthService } from '../../core/services/auth.service';

describe('VentasComponent', () => {
  let component: VentasComponent;
  let fixture: ComponentFixture<VentasComponent>;
  let ventaService: VentaService;
  let stockService: StockService;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(VentasComponent);
    component = fixture.componentInstance;
    ventaService = TestBed.inject(VentaService);
    stockService = TestBed.inject(StockService);
    authService = TestBed.inject(AuthService);

    spyOn(authService, 'hasRole').and.returnValue(false);
    spyOn(ventaService, 'getPaged').and.returnValue(of({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }));
    spyOn(stockService, 'getPaged').and.returnValue(of({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }));
    spyOn(TestBed.inject(SucursalService), 'getAll').and.returnValue(of([]));
    fixture.detectChanges();
  });

  it('should create and load paged sales', () => {
    expect(component).toBeTruthy();
    expect(ventaService.getPaged).toHaveBeenCalled();
  });

  it('should add a product with quantity one to the reactive form', () => {
    component.addProduct({
      id: 1, productoId: 10, productoCodigo: 'BEB-10', productoNombre: 'Agua', productoPrecio: 250,
      categoriaNombre: 'Bebidas', sucursalId: 1, sucursalNombre: 'Central', cantidad: 3, stockMinimo: 1, alertaStock: 'Normal'
    });

    expect(component.detalles.length).toBe(1);
    expect(component.detalles.at(0).get('cantidad')?.value).toBe(1);
    expect(component.getTotal()).toBe(250);
  });
});
