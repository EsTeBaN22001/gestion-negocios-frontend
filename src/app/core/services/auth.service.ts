import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly TOKEN_KEY = 'gn_token';
  private readonly USER_KEY = 'gn_user';
  private readonly EXPIRES_KEY = 'gn_expires_at';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const savedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(savedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    // Comprobar si la sesión guardada ha expirado
    if (savedUser && !this.isTokenValid()) {
      this.clearStorage();
      this.currentUserSubject.next(null);
    }
  }

  /**
   * Usuario actualmente autenticado (valor sincrónico).
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Inicia sesión enviando credenciales al backend.
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          localStorage.setItem(this.EXPIRES_KEY, response.expiresAt);
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  /**
   * Cierra la sesión activa, limpia el almacenamiento y redirige a login.
   */
  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el token JWT actual si la sesión es válida.
   */
  getToken(): string | null {
    if (!this.isTokenValid()) {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Comprueba si el usuario está autenticado y su token no ha expirado.
   */
  isAuthenticated(): boolean {
    return this.isTokenValid() && this.currentUserSubject.value !== null;
  }

  /**
   * Verifica si el usuario actual posee un rol específico.
   */
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.rol.toLowerCase() === role.toLowerCase();
  }

  /**
   * Consulta el endpoint protegido /api/auth/me del backend.
   */
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/api/auth/me`);
  }

  /**
   * Consulta el endpoint administrativo /api/auth/admin-check del backend.
   */
  checkAdmin(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/auth/admin-check`);
  }

  /**
   * Sube o actualiza el avatar del usuario autenticado y refresca el estado en localStorage y currentUser$.
   */
  uploadMyAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<User>(`${this.baseUrl}/api/auth/perfil/avatar`, formData).pipe(
      tap((user) => {
        if (user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  /**
   * Elimina el avatar del usuario autenticado y refresca el estado en localStorage y currentUser$.
   */
  deleteMyAvatar(): Observable<User> {
    return this.http.delete<User>(`${this.baseUrl}/api/auth/perfil/avatar`).pipe(
      tap((user) => {
        if (user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  /**
   * Valida si el token existe y si la fecha de expiración aún es válida.
   */
  private isTokenValid(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);

    if (!token || !expiresAt) {
      return false;
    }

    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();

    return expiryTime > now;
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
  }
}
