import { apiClient } from "./client";
import type {
  AsyncTaskStartResponse,
  Estimate,
  EstimateImportPayload,
  EstimateItem,
  EstimateLLMRerankPayload,
  EstimateMatchPayload,
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

export async function runEstimateMatch(
  estimateId: number,
  payload: EstimateMatchPayload,
): Promise<AsyncTaskStartResponse> {
  const response = await apiClient.post<AsyncTaskStartResponse>(
    `/estimates/${estimateId}/match/`,
    payload,
  );

  return response.data;
}

export async function runEstimateLLMRerank(
  estimateId: number,
  payload: EstimateLLMRerankPayload,
): Promise<AsyncTaskStartResponse> {
  const response = await apiClient.post<AsyncTaskStartResponse>(
    `/estimates/${estimateId}/llm-rerank/`,
    payload,
  );

  return response.data;
}
