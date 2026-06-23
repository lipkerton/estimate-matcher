import { apiClient } from "./client";
import type { ImportJob, PaginatedResponse } from "../shared/types";

export async function getImportJobs(): Promise<PaginatedResponse<ImportJob>> {
  const response =
    await apiClient.get<PaginatedResponse<ImportJob>>("/import-jobs/");

  return response.data;
}
