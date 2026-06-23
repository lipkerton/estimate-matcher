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

export type Product = {
  id: number;
  sku: string;
  name: string;
  unit: string;
  group: number | null;
  normalized_name: string;
  created_at: string;
  updated_at: string;
};

export type ProductCreatePayload = {
  sku: string;
  name: string;
  unit: string;
  group: number | null;
  normalized_name?: string;
};

export type Project = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ProjectCreatePayload = {
  name: string;
  description: string;
};

export type ImportFile = {
  id: number;
  original_filename: string;
  file: string;
  created_at: string;
};

export type ExcelPreview = {
  import_file_id: number;
  original_filename: string;
  sheet_name: string;
  sheet_names: string[];
  rows: unknown[][];
};
