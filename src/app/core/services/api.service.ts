import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Servicio base de infraestructura para verificar conectividad con la API.
 * No implementa lógica de negocio.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Verifica que la API está disponible.
   */
  getHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/health`);
  }

  /**
   * Verifica que la API puede conectarse a la base de datos.
   */
  getHealthDb(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/health/db`);
  }
}
