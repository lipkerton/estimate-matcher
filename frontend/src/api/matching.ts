import { apiClient } from "./client";
import type { MatchCandidate, PaginatedResponse } from "../shared/types";

export async function getMatchCandidatesByEstimate(
  estimateId: number,
): Promise<PaginatedResponse<MatchCandidate>> {
  const response = await apiClient.get<PaginatedResponse<MatchCandidate>>(
    "/match-candidates/",
    {
      params: {
        estimate: estimateId,
      },
    },
  );

  return response.data;
}

export async function getMatchCandidatesByEstimateItem(
  estimateItemId: number,
): Promise<PaginatedResponse<MatchCandidate>> {
  const response = await apiClient.get<PaginatedResponse<MatchCandidate>>(
    "/match-candidates/",
    {
      params: {
        estimate_item: estimateItemId,
      },
    },
  );

  return response.data;
}
