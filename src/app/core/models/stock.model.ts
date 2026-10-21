export interface StockList {
  id: number;
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  productoPrecio: number;
  productoActivo?: boolean;
  categoriaNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  cantidad: number;
  stockMinimo: number;
  alertaStock: 'Normal' | 'Bajo' | 'Agotado' | string;
}

export interface StockDetail {
  id: number;
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  productoPrecio: number;
  productoActivo?: boolean;
  categoriaNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  cantidad: number;
  stockMinimo: number;
  alertaStock: 'Normal' | 'Bajo' | 'Agotado' | string;
}

export interface StockCreate {
  productoId: number;
  sucursalId: number;
  cantidad: number;
  stockMinimo: number;
}

export interface StockAjuste {
  cantidad: number;
  stockMinimo: number;
  motivo?: string | null;
}
