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

export type Estimate = {
  id: number;
  project: number;
  project_name: string;
  name: string;
  import_job: number | null;
  items_count: number;
  created_at: string;
  updated_at: string;
};

export type EstimateItem = {
  id: number;
  estimate: number;
  raw_sku: string;
  raw_name: string;
  unit: string;
  quantity: string;
  material_price: string | null;
  installation_price: string | null;
  product: number | null;
  product_name: string | null;
  product_sku: string | null;
  matching_status:
    | "not_processed"
    | "matched"
    | "unmatched"
    | "no_match"
    | "manual";
  matching_confidence: string | null;
  raw_row: Record<string, unknown>;
  row_number: number | null;
  created_at: string;
};

export type EstimateColumnMapping = {
  sku?: number;
  name: number;
  unit?: number;
  quantity: number;
  material_price?: number;
  installation_price?: number;
  start_row: number;
  sheet_name?: string;
};

export type EstimateImportPayload = {
  project: number;
  import_file: number;
  name: string;
  column_mapping: EstimateColumnMapping;
};

export type MatchCandidate = {
  id: number;
  estimate_item: number;
  estimate_item_name: string;
  product: number;
  product_name: string;
  product_sku: string;
  confidence: string;
  source: "exact_sku" | "fuzzy_name" | "ai" | "manual";
  reason: string;
  created_at: string;
};

export type EstimateMatchPayload = {
  min_confidence: string;
  auto_match_threshold: string;
  max_candidates: number;
};

export type EstimateLLMRerankPayload = {
  auto_match_threshold: string;
  max_candidates: number;
};

export type AsyncTaskStartResponse = {
  task_id: string;
  estimate_id: number;
};

export type EstimateItemSetProductPayload = {
  product: number;
};

export type EstimateItemActionResponse = {
  id: number;
  product: number | null;
  product_name: string | null;
  product_sku: string | null;
  matching_status:
    | "not_processed"
    | "matched"
    | "unmatched"
    | "no_match"
    | "manual";
  matching_confidence: string | null;
};

export type ImportJobStatus = "pending" | "processing" | "success" | "failed";

export type ImportJobType = "price_list" | "estimate";

export type ImportJob = {
  id: number;
  import_type: ImportJobType;
  status: ImportJobStatus;
  import_file: number;
  original_filename: string;
  column_mapping: Record<string, unknown>;
  total_rows: number;
  processed_rows: number;
  progress: number;
  error_message: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};
