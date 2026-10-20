import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { StockList, StockDetail, StockCreate, StockAjuste } from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/stock`;

  constructor(private http: HttpClient) {}

  getPaged(
    page: number = 1,
    pageSize: number = 10,
    sucursalId?: number,
    search?: string,
    soloBajoStock?: boolean
  ): Observable<PagedResult<StockList>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (sucursalId !== undefined && sucursalId !== null && sucursalId > 0) {
      params = params.set('sucursalId', sucursalId.toString());
    }

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (soloBajoStock !== undefined && soloBajoStock !== null) {
      params = params.set('soloBajoStock', soloBajoStock.toString());
    }

    return this.http.get<PagedResult<StockList>>(this.baseUrl, { params });
  }

  getBySucursal(sucursalId: number): Observable<StockList[]> {
    return this.http.get<StockList[]>(`${this.baseUrl}/sucursal/${sucursalId}`);
  }

  getById(id: number): Observable<StockDetail> {
    return this.http.get<StockDetail>(`${this.baseUrl}/${id}`);
  }

  create(dto: StockCreate): Observable<StockDetail> {
    return this.http.post<StockDetail>(this.baseUrl, dto);
  }

  ajustar(id: number, dto: StockAjuste): Observable<StockDetail> {
    return this.http.put<StockDetail>(`${this.baseUrl}/${id}/ajuste`, dto);
  }
}
