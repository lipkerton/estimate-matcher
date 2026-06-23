import { apiClient } from "./client";
import type { ExcelPreview, ImportFile, PaginatedResponse } from "../shared/types";

export async function getImportFiles(): Promise<PaginatedResponse<ImportFile>> {
  const response =
    await apiClient.get<PaginatedResponse<ImportFile>>("/import-files/");

  return response.data;
}

export async function uploadImportFile(file: File): Promise<ImportFile> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await apiClient.post<ImportFile>(
    "/import-files/upload/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function getImportFilePreview(
  importFileId: number,
): Promise<ExcelPreview> {
  const response = await apiClient.get<ExcelPreview>(
    `/import-files/${importFileId}/preview/`,
    {
      params: {
        limit: 20,
      },
    },
  );

  return response.data;
}
