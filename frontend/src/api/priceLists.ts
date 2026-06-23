import { apiClient } from "./client";
import type {
  PaginatedResponse,
  PriceList,
  PriceListImportPayload,
  SupplierPriceItem,
} from "../shared/types";

export async function getPriceLists(): Promise<PaginatedResponse<PriceList>> {
  const response =
    await apiClient.get<PaginatedResponse<PriceList>>("/price-lists/");

  return response.data;
}

export async function importPriceList(
  payload: PriceListImportPayload,
): Promise<PriceList> {
  const response = await apiClient.post<PriceList>(
    "/price-lists/import/",
    payload,
  );

  return response.data;
}

export async function getSupplierPriceItems(
  priceListId: number,
): Promise<PaginatedResponse<SupplierPriceItem>> {
  const response = await apiClient.get<PaginatedResponse<SupplierPriceItem>>(
    "/supplier-price-items/",
    {
      params: {
        price_list: priceListId,
      },
    },
  );

  return response.data;
}
