// Réponse paginée standard renvoyée par Django REST Framework.
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}