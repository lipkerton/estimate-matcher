import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getImportFiles } from "../api/importFiles";
import {
  getPriceLists,
  getSupplierPriceItems,
  importPriceList,
} from "../api/priceLists";
import { getSuppliers } from "../api/suppliers";
import type {
  PriceListImportPayload,
  SupplierPriceItem,
} from "../shared/types";

type PriceListImportForm = {
  supplier: string;
  import_file: string;
  name: string;
  sku: string;
  product_name: string;
  unit: string;
  price: string;
  start_row: string;
};

export function PriceListsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PriceListImportForm>({
    supplier: "",
    import_file: "",
    name: "",
    sku: "0",
    product_name: "1",
    unit: "2",
    price: "3",
    start_row: "1",
  });

  const [selectedPriceListId, setSelectedPriceListId] = useState<number | null>(
    null,
  );

  const suppliersQuery = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const importFilesQuery = useQuery({
    queryKey: ["import-files"],
    queryFn: getImportFiles,
  });

  const priceListsQuery = useQuery({
    queryKey: ["price-lists"],
    queryFn: getPriceLists,
  });

  const priceItemsQuery = useQuery({
    queryKey: ["supplier-price-items", selectedPriceListId],
    queryFn: () => getSupplierPriceItems(selectedPriceListId!),
    enabled: selectedPriceListId !== null,
  });

  const importMutation = useMutation({
    mutationFn: importPriceList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      queryClient.invalidateQueries({ queryKey: ["import-jobs"] });

      setForm((current) => ({
        ...current,
        name: "",
      }));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.supplier || !form.import_file) {
      return;
    }

    const payload: PriceListImportPayload = {
      supplier: Number(form.supplier),
      import_file: Number(form.import_file),
      name: form.name,
      column_mapping: {
        sku: Number(form.sku),
        name: Number(form.product_name),
        unit: Number(form.unit),
        price: Number(form.price),
        start_row: Number(form.start_row),
      },
    };

    importMutation.mutate(payload);
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Прайс-листы</h2>
          <p>
            Импорт прайс-листов поставщиков из загруженных Excel-файлов.
          </p>
        </div>
      </div>

      <form className="card price-import-form" onSubmit={handleSubmit}>
        <label>
          Поставщик
          <select
            value={form.supplier}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                supplier: event.target.value,
              }))
            }
            required
          >
            <option value="">Выберите поставщика</option>
            {suppliersQuery.data?.results.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
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
          Название прайса
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Прайс КабельСнаб — тест"
          />
        </label>

        <div className="mapping-grid">
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
            Цена
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              required
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
          {importMutation.isPending ? "Запускаем импорт..." : "Импортировать прайс"}
        </button>
      </form>

      {importMutation.isError && (
        <div className="error-box">
          Не удалось запустить импорт прайса. Проверь mapping колонок.
        </div>
      )}

      {importMutation.isSuccess && (
        <div className="success-box">
          Импорт прайса запущен. Через пару секунд обнови список или проверь
          import jobs.
        </div>
      )}

      <div className="card">
        <h3>Список прайс-листов</h3>

        {priceListsQuery.isLoading && <p>Загрузка...</p>}

        {priceListsQuery.isError && (
          <p className="error-text">Не удалось загрузить прайс-листы.</p>
        )}

        {priceListsQuery.data && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Поставщик</th>
                <th>Название</th>
                <th>Строк</th>
                <th>Дата загрузки</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {priceListsQuery.data.results.map((priceList) => (
                <tr key={priceList.id}>
                  <td>{priceList.id}</td>
                  <td>{priceList.supplier_name}</td>
                  <td>{priceList.name || "—"}</td>
                  <td>{priceList.items_count}</td>
                  <td>{new Date(priceList.uploaded_at).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedPriceListId(priceList.id)}
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

      {selectedPriceListId && (
        <div className="card">
          <h3>Позиции прайса #{selectedPriceListId}</h3>

          {priceItemsQuery.isLoading && <p>Загрузка...</p>}

          {priceItemsQuery.isError && (
            <p className="error-text">Не удалось загрузить позиции прайса.</p>
          )}

          {priceItemsQuery.data && (
            <PriceItemsTable items={priceItemsQuery.data.results} />
          )}
        </div>
      )}
    </section>
  );
}

function PriceItemsTable({ items }: { items: SupplierPriceItem[] }) {
  if (items.length === 0) {
    return <p>Позиции пока не найдены. Возможно, Celery ещё обрабатывает файл.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Строка</th>
          <th>SKU</th>
          <th>Наименование</th>
          <th>Ед. изм.</th>
          <th>Цена</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.row_number ?? "—"}</td>
            <td>{item.supplier_sku || "—"}</td>
            <td>{item.supplier_name}</td>
            <td>{item.unit || "—"}</td>
            <td>{item.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
