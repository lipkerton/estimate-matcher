import { apiClient } from "./client";
import type {
  Estimate,
  EstimateImportPayload,
  EstimateItem,
  PaginatedResponse,
} from "../shared/types";

export async function getEstimates(): Promise<PaginatedResponse<Estimate>> {
  const response =
    await apiClient.get<PaginatedResponse<Estimate>>("/estimates/");

  return response.data;
}

export async function importEstimate(
  payload: EstimateImportPayload,
): Promise<Estimate> {
  const response = await apiClient.post<Estimate>(
    "/estimates/import/",
    payload,
  );

  return response.data;
}

export async function getEstimateItems(
  estimateId: number,
): Promise<PaginatedResponse<EstimateItem>> {
  const response = await apiClient.get<PaginatedResponse<EstimateItem>>(
    "/estimate-items/",
    {
      params: {
        estimate: estimateId,
      },
    },
  );

  return response.data;
}
