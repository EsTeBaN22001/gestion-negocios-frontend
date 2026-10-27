import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { UsuarioList, UsuarioDetail, UsuarioCreate, UsuarioUpdate } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/usuarios`;

  constructor(private http: HttpClient) {}

  getPaged(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    rol?: string,
    sucursalId?: number,
    soloActivos?: boolean
  ): Observable<PagedResult<UsuarioList>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (rol && rol.trim()) {
      params = params.set('rol', rol.trim());
    }

    if (sucursalId !== undefined && sucursalId !== null) {
      params = params.set('sucursalId', sucursalId.toString());
    }

    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }

    return this.http.get<PagedResult<UsuarioList>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<UsuarioDetail> {
    return this.http.get<UsuarioDetail>(`${this.baseUrl}/${id}`);
  }

  create(dto: UsuarioCreate): Observable<UsuarioDetail> {
    return this.http.post<UsuarioDetail>(this.baseUrl, dto);
  }

  update(id: number, dto: UsuarioUpdate): Observable<UsuarioDetail> {
    return this.http.put<UsuarioDetail>(`${this.baseUrl}/${id}`, dto);
  }

  toggleActivo(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/toggle-activo`, {});
  }

  uploadAvatar(id: number, file: File): Observable<UsuarioDetail> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UsuarioDetail>(`${this.baseUrl}/${id}/avatar`, formData);
  }

  deleteAvatar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}/avatar`);
  }
}
