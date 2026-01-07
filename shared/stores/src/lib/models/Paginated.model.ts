export interface PaginatedEntities<T> {
  items: Array<T>;
  page: number;
  totalPages: number;
  totalItems: number;
}