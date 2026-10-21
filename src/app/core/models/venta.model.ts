export type VentaEstado = 'Confirmada' | 'Anulada';

export interface VentaDetalleCreate {
  productoId: number;
  cantidad: number;
}

export interface VentaCreate {
  sucursalId?: number;
  detalles: VentaDetalleCreate[];
}

export interface VentaList {
  id: number;
  fecha: string;
  total: number;
  estado: VentaEstado;
  sucursalId: number;
  sucursalNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  detallesCount: number;
}

export interface VentaDetalle {
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaDetail {
  id: number;
  fecha: string;
  total: number;
  estado: VentaEstado;
  sucursalId: number;
  sucursalNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  detalles: VentaDetalle[];
}
