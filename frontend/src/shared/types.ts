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

export type PriceList = {
  id: number;
  supplier: number;
  supplier_name: string;
  import_job: number | null;
  name: string;
  items_count: number;
  uploaded_at: string;
};

export type SupplierPriceItem = {
  id: number;
  price_list: number;
  supplier_sku: string;
  supplier_name: string;
  unit: string;
  price: string;
  product: number | null;
  product_name: string | null;
  raw_row: Record<string, unknown>;
  row_number: number | null;
  created_at: string;
};

export type PriceListColumnMapping = {
  sku?: number;
  name: number;
  unit?: number;
  price: number;
  start_row: number;
  sheet_name?: string;
};

export type PriceListImportPayload = {
  supplier: number;
  import_file: number;
  name: string;
  column_mapping: PriceListColumnMapping;
};
