export interface ProductoList {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  activo: boolean;
  categoriaId: number;
  categoriaNombre: string;
  stockTotal: number;
}

export interface ProductoStockResumen {
  sucursalId: number;
  sucursalNombre: string;
  cantidad: number;
  stockMinimo: number;
}

export interface ProductoDetail {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  activo: boolean;
  categoriaId: number;
  categoriaNombre: string;
  stocks: ProductoStockResumen[];
}

export interface ProductoCreate {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoriaId: number;
}

export interface ProductoUpdate {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoriaId: number;
  activo: boolean;
}
