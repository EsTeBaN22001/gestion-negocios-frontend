import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { Sucursal, SucursalCreate, SucursalUpdate } from '../models/sucursal.model';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/sucursales`;

  constructor(private http: HttpClient) {}

  getPaged(page: number = 1, pageSize: number = 10, search?: string, soloActivas?: boolean): Observable<PagedResult<Sucursal>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (soloActivas !== undefined && soloActivas !== null) {
      params = params.set('soloActivas', soloActivas.toString());
    }

    return this.http.get<PagedResult<Sucursal>>(this.baseUrl, { params });
  }

  getAll(soloActivas: boolean = true): Observable<Sucursal[]> {
    const params = new HttpParams().set('soloActivas', soloActivas.toString());
    return this.http.get<Sucursal[]>(`${this.baseUrl}/todas`, { params });
  }

  getById(id: number): Observable<Sucursal> {
    return this.http.get<Sucursal>(`${this.baseUrl}/${id}`);
  }

  create(dto: SucursalCreate): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.baseUrl, dto);
  }

  update(id: number, dto: SucursalUpdate): Observable<Sucursal> {
    return this.http.put<Sucursal>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<{ message: string; deactivated: boolean }> {
    return this.http.delete<{ message: string; deactivated: boolean }>(`${this.baseUrl}/${id}`);
  }
}
