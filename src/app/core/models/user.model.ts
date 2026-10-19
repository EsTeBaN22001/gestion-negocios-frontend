/**
 * Modelos de usuario y autenticación para Angular.
 * Coinciden con los DTOs del backend según docs/06-api.md y docs/08-authentication.md.
 */

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'Administrador' | 'Empleado' | string;
  sucursalId?: number | null;
  avatar?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface UsuarioList {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  activo: boolean;
  avatar?: string | null;
  fechaCreacion: string;
}

export interface UsuarioDetail {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  sucursalId?: number | null;
  sucursalNombre?: string | null;
  activo: boolean;
  avatar?: string | null;
  fechaCreacion: string;
}

export interface UsuarioCreate {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: string;
  sucursalId?: number | null;
}

export interface UsuarioUpdate {
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  sucursalId?: number | null;
  activo: boolean;
  password?: string | null;
}
