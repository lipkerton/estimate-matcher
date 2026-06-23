export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Supplier = {
  id: number;
  name: string;
  inn: string;
  currency: "RUB" | "USD" | "EUR" | "CNY";
  created_at: string;
  updated_at: string;
};

export type SupplierCreatePayload = {
  name: string;
  inn: string;
  currency: "RUB" | "USD" | "EUR" | "CNY";
};