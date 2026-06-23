import { useState } from "react";
import type { FormEvent } from "react";

import type {
  ImportFile,
  Project,
  EstimateImportPayload,
} from "../../../shared/types";

type EstimateImportFormState = {
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

export function EstimateImportForm({
  projects,
  importFiles,
  onSubmit,
  isPending,
}: {
  projects: Project[];
  importFiles: ImportFile[];
  onSubmit: (payload: EstimateImportPayload) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<EstimateImportFormState>({
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

    onSubmit(payload);

    setForm((current) => ({
      ...current,
      name: "",
    }));
  }

  return (
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
          {projects.map((project) => (
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
          {importFiles.map((file) => (
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

      <button type="submit" disabled={isPending}>
        {isPending ? "Запускаем импорт..." : "Импортировать смету"}
      </button>
    </form>
  );
}
