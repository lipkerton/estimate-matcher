import { apiClient } from "./client";
import type {
  PaginatedResponse,
  Project,
  ProjectCreatePayload,
} from "../shared/types";

export async function getProjects(): Promise<PaginatedResponse<Project>> {
  const response = await apiClient.get<PaginatedResponse<Project>>("/projects/");
  return response.data;
}

export async function createProject(
  payload: ProjectCreatePayload,
): Promise<Project> {
  const response = await apiClient.post<Project>("/projects/", payload);
  return response.data;
}
