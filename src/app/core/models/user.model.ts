/**
/// Modelos de usuario y autenticación para Angular.
/// Coinciden con los DTOs del backend según docs/06-api.md y docs/08-authentication.md.
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
