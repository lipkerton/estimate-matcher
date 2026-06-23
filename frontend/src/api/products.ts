import { apiClient } from "./client";
import type {
  PaginatedResponse,
  Product,
  ProductCreatePayload,
} from "../shared/types";

export async function getProducts(): Promise<PaginatedResponse<Product>> {
  const response = await apiClient.get<PaginatedResponse<Product>>("/products/");
  return response.data;
}

export async function createProduct(
  payload: ProductCreatePayload,
): Promise<Product> {
  const response = await apiClient.post<Product>("/products/", payload);
  return response.data;
}
