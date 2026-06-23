import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getEstimateItems,
  getEstimates,
  importEstimate,
} from "../api/estimates";
import { getImportFiles } from "../api/importFiles";
import { getProjects } from "../api/projects";
import type { EstimateImportPayload, EstimateItem } from "../shared/types";

type EstimateImportForm = {
  project: string;
  import_file: string;
  name: string;
  sku: string;
  product_name: string;
  unit: string;
  quantity: string;
  material_price: string;
  installation_price: string;
  start_row: string;
};

export function EstimatesPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EstimateImportForm>({
    project: "",
    import_file: "",
    name: "",
    sku: "0",
    product_name: "1",
    unit: "2",
    quantity: "3",
    material_price: "4",
    installation_price: "5",
    start_row: "1",
  });

  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(
    null,
  );

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const importFilesQuery = useQuery({
    queryKey: ["import-files"],
    queryFn: getImportFiles,
  });

  const estimatesQuery = useQuery({
    queryKey: ["estimates"],
    queryFn: getEstimates,
  });

  const estimateItemsQuery = useQuery({
    queryKey: ["estimate-items", selectedEstimateId],
    queryFn: () => getEstimateItems(selectedEstimateId!),
    enabled: selectedEstimateId !== null,
  });

  const importMutation = useMutation({
    mutationFn: importEstimate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["import-jobs"] });

      setForm((current) => ({
        ...current,
        name: "",
      }));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.project || !form.import_file || !form.name) {
      return;
    }

    const payload: EstimateImportPayload = {
      project: Number(form.project),
      import_file: Number(form.import_file),
      name: form.name,
      column_mapping: {
        sku: Number(form.sku),
        name: Number(form.product_name),
        unit: Number(form.unit),
        quantity: Number(form.quantity),
        material_price: Number(form.material_price),
        installation_price: Number(form.installation_price),
        start_row: Number(form.start_row),
      },
    };

    importMutation.mutate(payload);
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Сметы</h2>
          <p>
            Импорт смет из Excel-файлов. После импорта позиции сметы можно будет
            сопоставлять с каталогом товаров.
          </p>
        </div>
      </div>

      <form className="card estimate-import-form" onSubmit={handleSubmit}>
        <label>
          Проект
          <select
            value={form.project}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                project: event.target.value,
              }))
            }
            required
          >
            <option value="">Выберите проект</option>
            {projectsQuery.data?.results.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Excel-файл
          <select
            value={form.import_file}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                import_file: event.target.value,
              }))
            }
            required
          >
            <option value="">Выберите файл</option>
            {importFilesQuery.data?.results.map((file) => (
              <option key={file.id} value={file.id}>
                #{file.id} — {file.original_filename}
              </option>
            ))}
          </select>
        </label>

        <label>
          Название сметы
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Смета электрика — тест"
            required
          />
        </label>

        <div className="mapping-grid estimate-mapping-grid">
          <label>
            SKU
            <input
              type="number"
              min="0"
              value={form.sku}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sku: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Наименование
            <input
              type="number"
              min="0"
              value={form.product_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  product_name: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Ед. изм.
            <input
              type="number"
              min="0"
              value={form.unit}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unit: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Количество
            <input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Материал
            <input
              type="number"
              min="0"
              value={form.material_price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  material_price: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Монтаж
            <input
              type="number"
              min="0"
              value={form.installation_price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  installation_price: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Первая строка данных
            <input
              type="number"
              min="0"
              value={form.start_row}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  start_row: event.target.value,
                }))
              }
              required
            />
          </label>
        </div>

        <button type="submit" disabled={importMutation.isPending}>
          {importMutation.isPending ? "Запускаем импорт..." : "Импортировать смету"}
        </button>
      </form>

      {importMutation.isError && (
        <div className="error-box">
          Не удалось запустить импорт сметы. Проверь проект, файл и mapping
          колонок.
        </div>
      )}

      {importMutation.isSuccess && (
        <div className="success-box">
          Импорт сметы запущен. Если позиции пока не появились, проверь, что
          Celery worker запущен.
        </div>
      )}

      <div className="card">
        <h3>Список смет</h3>

        {estimatesQuery.isLoading && <p>Загрузка...</p>}

        {estimatesQuery.isError && (
          <p className="error-text">Не удалось загрузить сметы.</p>
        )}

        {estimatesQuery.data && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Проект</th>
                <th>Название</th>
                <th>Строк</th>
                <th>Дата создания</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {estimatesQuery.data.results.map((estimate) => (
                <tr key={estimate.id}>
                  <td>{estimate.id}</td>
                  <td>{estimate.project_name}</td>
                  <td>{estimate.name}</td>
                  <td>{estimate.items_count}</td>
                  <td>{new Date(estimate.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedEstimateId(estimate.id)}
                    >
                      Позиции
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedEstimateId && (
        <div className="card">
          <h3>Позиции сметы #{selectedEstimateId}</h3>

          {estimateItemsQuery.isLoading && <p>Загрузка...</p>}

          {estimateItemsQuery.isError && (
            <p className="error-text">Не удалось загрузить позиции сметы.</p>
          )}

          {estimateItemsQuery.data && (
            <EstimateItemsTable items={estimateItemsQuery.data.results} />
          )}
        </div>
      )}
    </section>
  );
}

function EstimateItemsTable({ items }: { items: EstimateItem[] }) {
  if (items.length === 0) {
    return <p>Позиции пока не найдены. Возможно, Celery ещё обрабатывает файл.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Строка</th>
            <th>SKU</th>
            <th>Наименование</th>
            <th>Ед. изм.</th>
            <th>Кол-во</th>
            <th>Материал</th>
            <th>Монтаж</th>
            <th>Статус matching</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.row_number ?? "—"}</td>
              <td>{item.raw_sku || "—"}</td>
              <td>{item.raw_name}</td>
              <td>{item.unit || "—"}</td>
              <td>{item.quantity}</td>
              <td>{item.material_price ?? "—"}</td>
              <td>{item.installation_price ?? "—"}</td>
              <td>{item.matching_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
