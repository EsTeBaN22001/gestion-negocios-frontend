export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
  productosCount?: number;
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string | null;
}

export interface CategoriaUpdate {
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
}
