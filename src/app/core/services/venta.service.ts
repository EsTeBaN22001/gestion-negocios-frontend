import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { VentaCreate, VentaDetail, VentaEstado, VentaList } from '../models/venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/ventas`;

  constructor(private http: HttpClient) {}

  getPaged(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    sucursalId?: number,
    estado?: VentaEstado
  ): Observable<PagedResult<VentaList>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    if (sucursalId && sucursalId > 0) {
      params = params.set('sucursalId', sucursalId.toString());
    }

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<PagedResult<VentaList>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<VentaDetail> {
    return this.http.get<VentaDetail>(`${this.baseUrl}/${id}`);
  }

  create(dto: VentaCreate): Observable<VentaDetail> {
    return this.http.post<VentaDetail>(this.baseUrl, dto);
  }

  anular(id: number): Observable<VentaDetail> {
    return this.http.post<VentaDetail>(`${this.baseUrl}/${id}/anular`, {});
  }

  adjuntarArchivo(ventaId: number, file: File): Observable<VentaDetail> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<VentaDetail>(`${this.baseUrl}/${ventaId}/adjunto`, formData);
  }

  getAdjuntoUrl(ventaId: number): string {
    return `${this.baseUrl}/${ventaId}/adjunto`;
  }

  descargarAdjunto(ventaId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${ventaId}/adjunto`, { responseType: 'blob' });
  }
}
