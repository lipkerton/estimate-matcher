import { apiClient } from "./client";
import type {
  PaginatedResponse,
  Supplier,
  SupplierCreatePayload,
} from "../shared/types";

export async function getSuppliers(): Promise<PaginatedResponse<Supplier>> {
  const response = await apiClient.get<PaginatedResponse<Supplier>>("/suppliers/");
  return response.data;
}

export async function createSupplier(
  payload: SupplierCreatePayload,
): Promise<Supplier> {
  const response = await apiClient.post<Supplier>("/suppliers/", payload);
  return response.data;
}
