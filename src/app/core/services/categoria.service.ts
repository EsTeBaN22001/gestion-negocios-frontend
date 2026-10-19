import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { Categoria, CategoriaCreate, CategoriaUpdate } from '../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/categorias`;

  constructor(private http: HttpClient) {}

  getPaged(page: number = 1, pageSize: number = 10, search?: string, soloActivas?: boolean): Observable<PagedResult<Categoria>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (soloActivas !== undefined && soloActivas !== null) {
      params = params.set('soloActivas', soloActivas.toString());
    }

    return this.http.get<PagedResult<Categoria>>(this.baseUrl, { params });
  }

  getAll(soloActivas: boolean = true): Observable<Categoria[]> {
    const params = new HttpParams().set('soloActivas', soloActivas.toString());
    return this.http.get<Categoria[]>(`${this.baseUrl}/todas`, { params });
  }

  getById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.baseUrl}/${id}`);
  }

  create(dto: CategoriaCreate): Observable<Categoria> {
    return this.http.post<Categoria>(this.baseUrl, dto);
  }

  update(id: number, dto: CategoriaUpdate): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<{ message: string; deactivated: boolean }> {
    return this.http.delete<{ message: string; deactivated: boolean }>(`${this.baseUrl}/${id}`);
  }
}
