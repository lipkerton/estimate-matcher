import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createProject, getProjects } from "../api/projects";
import type { ProjectCreatePayload } from "../shared/types";

export function ProjectsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProjectCreatePayload>({
    name: "",
    description: "",
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      setForm({
        name: "",
        description: "",
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createProjectMutation.mutate(form);
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Проекты</h2>
          <p>
            Проекты объединяют сметы. Смета загружается и обрабатывается внутри
            конкретного проекта.
          </p>
        </div>
      </div>

      <form className="card form-grid projects-form" onSubmit={handleSubmit}>
        <label>
          Название проекта
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Тестовый проект — электрика"
            required
          />
        </label>

        <label>
          Описание
          <input
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Проверка импорта сметы и matching"
          />
        </label>

        <button type="submit" disabled={createProjectMutation.isPending}>
          {createProjectMutation.isPending ? "Создаём..." : "Создать проект"}
        </button>
      </form>

      {createProjectMutation.isError && (
        <div className="error-box">Не удалось создать проект.</div>
      )}

      <div className="card">
        <h3>Список проектов</h3>

        {projectsQuery.isLoading && <p>Загрузка...</p>}

        {projectsQuery.isError && (
          <p className="error-text">Не удалось загрузить проекты.</p>
        )}

        {projectsQuery.data && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {projectsQuery.data.results.map((project) => (
                <tr key={project.id}>
                  <td>{project.id}</td>
                  <td>{project.name}</td>
                  <td>{project.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
