import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { ProductoList, ProductoDetail, ProductoCreate, ProductoUpdate } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/productos`;

  constructor(private http: HttpClient) {}

  getPaged(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    categoriaId?: number,
    soloActivos?: boolean
  ): Observable<PagedResult<ProductoList>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (categoriaId !== undefined && categoriaId !== null && categoriaId > 0) {
      params = params.set('categoriaId', categoriaId.toString());
    }

    if (soloActivos !== undefined && soloActivos !== null) {
      params = params.set('soloActivos', soloActivos.toString());
    }

    return this.http.get<PagedResult<ProductoList>>(this.baseUrl, { params });
  }

  getAll(soloActivos: boolean = true): Observable<ProductoList[]> {
    const params = new HttpParams().set('soloActivos', soloActivos.toString());
    return this.http.get<ProductoList[]>(`${this.baseUrl}/todos`, { params });
  }

  getById(id: number): Observable<ProductoDetail> {
    return this.http.get<ProductoDetail>(`${this.baseUrl}/${id}`);
  }

  create(dto: ProductoCreate): Observable<ProductoDetail> {
    return this.http.post<ProductoDetail>(this.baseUrl, dto);
  }

  update(id: number, dto: ProductoUpdate): Observable<ProductoDetail> {
    return this.http.put<ProductoDetail>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<{ message: string; deactivated: boolean }> {
    return this.http.delete<{ message: string; deactivated: boolean }>(`${this.baseUrl}/${id}`);
  }
}
