/**
 * Modelo para respuestas paginadas del backend (docs/11-pagination-search.md).
 */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
