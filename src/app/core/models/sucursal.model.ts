export interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activa: boolean;
  usuariosCount?: number;
}

export interface SucursalCreate {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
}

export interface SucursalUpdate {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activa: boolean;
}
