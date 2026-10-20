import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StockComponent } from './stock.component';
import { StockService } from '../../core/services/stock.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { PagedResult } from '../../core/models/paged-result.model';
import { StockList } from '../../core/models/stock.model';

describe('StockComponent', () => {
  let component: StockComponent;
  let fixture: ComponentFixture<StockComponent>;
  let stockService: StockService;
  let sucursalService: SucursalService;
  let productoService: ProductoService;
  let authService: AuthService;

  const mockPaged: PagedResult<StockList> = {
    items: [
      {
        id: 1,
        productoId: 1,
        productoCodigo: 'PROD-01',
        productoNombre: 'Alfajor',
        productoPrecio: 500,
        categoriaNombre: 'Golosinas',
        sucursalId: 1,
        sucursalNombre: 'Central',
        cantidad: 4,
        stockMinimo: 5,
        alertaStock: 'Bajo'
      }
    ],
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StockComponent);
    component = fixture.componentInstance;
    stockService = TestBed.inject(StockService);
    sucursalService = TestBed.inject(SucursalService);
    productoService = TestBed.inject(ProductoService);
    authService = TestBed.inject(AuthService);

    spyOn(authService, 'hasRole').and.returnValue(true);
    spyOn(stockService, 'getPaged').and.returnValue(of(mockPaged));
    spyOn(sucursalService, 'getAll').and.returnValue(of([
      { id: 1, nombre: 'Central', activa: true }
    ]));
    spyOn(productoService, 'getAll').and.returnValue(of([
      { id: 1, codigo: 'P1', nombre: 'Alfajor', precio: 500, activo: true, categoriaId: 1, categoriaNombre: 'Golosinas', stockTotal: 4 }
    ]));

    fixture.detectChanges();
  });

  it('should create the component and load inventory', () => {
    expect(component).toBeTruthy();
    expect(stockService.getPaged).toHaveBeenCalled();
    expect(component.stockList.length).toBe(1);
    expect(component.totalItems).toBe(1);
  });

  it('should open ajuste modal with current stock values', () => {
    const item = mockPaged.items[0];
    component.openAjusteModal(item);
    expect(component.showAjusteModal).toBeTrue();
    expect(component.selectedStock?.id).toBe(1);
    expect(component.ajusteForm.get('cantidad')?.value).toBe(4);
    expect(component.ajusteForm.get('stockMinimo')?.value).toBe(5);
  });

  it('should call ajustar when saving ajuste form', () => {
    spyOn(stockService, 'ajustar').and.returnValue(of({
      id: 1,
      productoId: 1,
      productoCodigo: 'PROD-01',
      productoNombre: 'Alfajor',
      productoPrecio: 500,
      categoriaNombre: 'Golosinas',
      sucursalId: 1,
      sucursalNombre: 'Central',
      cantidad: 20,
      stockMinimo: 5,
      alertaStock: 'Normal'
    }));

    component.openAjusteModal(mockPaged.items[0]);
    component.ajusteForm.patchValue({
      cantidad: 20,
      stockMinimo: 5,
      motivo: 'Compra mayorista'
    });

    component.saveAjuste();
    expect(stockService.ajustar).toHaveBeenCalled();
    expect(component.showAjusteModal).toBeFalse();
  });

  it('should open create modal for assigning initial stock', () => {
    component.openCreateModal();
    expect(component.showCreateModal).toBeTrue();
    expect(component.createForm.get('productoId')?.value).toBeNull();
  });
});
