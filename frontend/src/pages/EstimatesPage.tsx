import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getEstimateItems,
  getEstimates,
  importEstimate,
  markEstimateItemNoMatch,
  resetEstimateItemMatch,
  runEstimateLLMRerank,
  runEstimateMatch,
  setEstimateItemProduct,
} from "../api/estimates";
import { getImportFiles } from "../api/importFiles";
import { getProjects } from "../api/projects";
import { getProducts } from "../api/products";
import type {
  EstimateImportPayload,
  EstimateItem,
  MatchCandidate,
  Product,
} from "../shared/types";
import { getMatchCandidatesByEstimate } from "../api/matching";


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

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const estimateItemsQuery = useQuery({
    queryKey: ["estimate-items", selectedEstimateId],
    queryFn: () => getEstimateItems(selectedEstimateId!),
    enabled: selectedEstimateId !== null,
  });

  const matchCandidatesQuery = useQuery({
    queryKey: ["match-candidates", selectedEstimateId],
    queryFn: () => getMatchCandidatesByEstimate(selectedEstimateId!),
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

  const matchMutation = useMutation({
    mutationFn: (estimateId: number) =>
      runEstimateMatch(estimateId, {
        min_confidence: "0.6000",
        auto_match_threshold: "0.8500",
        max_candidates: 5,
      }),
    onSuccess: (_, estimateId) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["estimate-items", estimateId] });
      queryClient.invalidateQueries({ queryKey: ["match-candidates", estimateId] });
    },
  });

  const llmRerankMutation = useMutation({
    mutationFn: (estimateId: number) =>
      runEstimateLLMRerank(estimateId, {
        auto_match_threshold: "0.8500",
        max_candidates: 5,
      }),
    onSuccess: (_, estimateId) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["estimate-items", estimateId] });
      queryClient.invalidateQueries({ queryKey: ["match-candidates", estimateId] });
    },
  });
  
  const setProductMutation = useMutation({
    mutationFn: ({
      estimateItemId,
      productId,
    }: {
      estimateItemId: number;
      productId: number;
    }) =>
      setEstimateItemProduct(estimateItemId, {
        product: productId,
      }),
    onSuccess: () => {
      if (selectedEstimateId === null) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ["estimate-items", selectedEstimateId],
      });
      queryClient.invalidateQueries({
        queryKey: ["match-candidates", selectedEstimateId],
      });
      queryClient.invalidateQueries({
        queryKey: ["estimates"],
      });
    },
  });

  const markNoMatchMutation = useMutation({
    mutationFn: markEstimateItemNoMatch,
    onSuccess: () => {
      if (selectedEstimateId === null) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ["estimate-items", selectedEstimateId],
      });
      queryClient.invalidateQueries({
        queryKey: ["match-candidates", selectedEstimateId],
      });
      queryClient.invalidateQueries({
        queryKey: ["estimates"],
      });
    },
  });

  const resetMatchMutation = useMutation({
    mutationFn: resetEstimateItemMatch,
    onSuccess: () => {
      if (selectedEstimateId === null) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ["estimate-items", selectedEstimateId],
      });
      queryClient.invalidateQueries({
        queryKey: ["match-candidates", selectedEstimateId],
      });
      queryClient.invalidateQueries({
        queryKey: ["estimates"],
      });
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

      {matchMutation.isSuccess && (
        <div className="success-box">
          Matching запущен. Если статусы сразу не обновились, подожди пару секунд
          и снова открой позиции сметы.
        </div>
      )}

      {matchMutation.isError && (
        <div className="error-box">
          Не удалось запустить deterministic matching.
        </div>
      )}

      {llmRerankMutation.isSuccess && (
        <div className="success-box">
          LLM rerank запущен. Проверь, что Ollama и Celery worker запущены.
        </div>
      )}

      {llmRerankMutation.isError && (
        <div className="error-box">
          Не удалось запустить LLM rerank.
        </div>
      )}

      {setProductMutation.isError && (
        <div className="error-box">
          Не удалось вручную назначить товар.
        </div>
      )}

      {markNoMatchMutation.isError && (
        <div className="error-box">
          Не удалось пометить позицию как no match.
        </div>
      )}

      {resetMatchMutation.isError && (
        <div className="error-box">
          Не удалось сбросить matching.
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
                    <div className="row-actions">
                        <button
                          type="button"
                          onClick={() => setSelectedEstimateId(estimate.id)}
                        >
                        Позиции
                        </button>

                        <button
                          type="button"
                          onClick={() => matchMutation.mutate(estimate.id)}
                          disabled={matchMutation.isPending}
                        >
                        Match
                        </button>

                        <button
                          type="button"
                          onClick={() => llmRerankMutation.mutate(estimate.id)}
                          disabled={llmRerankMutation.isPending}
                        >
                        LLM rerank
                        </button>
                    </div>
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
            <EstimateItemsTable
              items={estimateItemsQuery.data.results}
              products={productsQuery.data?.results ?? []}
              onSetProduct={(estimateItemId, productId) =>
                setProductMutation.mutate({
                  estimateItemId,
                  productId,
                })
              }
              onMarkNoMatch={(estimateItemId) =>
                markNoMatchMutation.mutate(estimateItemId)
              }
              onResetMatch={(estimateItemId) =>
                resetMatchMutation.mutate(estimateItemId)
              }
              isActionPending={
                setProductMutation.isPending ||
                markNoMatchMutation.isPending ||
                resetMatchMutation.isPending
              }
            />
          )}
        </div>
      )}
      {selectedEstimateId && (
        <div className="card">
          <h3>Кандидаты matching для сметы #{selectedEstimateId}</h3>

          {matchCandidatesQuery.isLoading && <p>Загрузка...</p>}

          {matchCandidatesQuery.isError && (
            <p className="error-text">Не удалось загрузить candidates.</p>
          )}

          {matchCandidatesQuery.data && (
            <MatchCandidatesTable
              candidates={matchCandidatesQuery.data.results}
            />
          )}
        </div>
      )}
    </section>
  );
}

function EstimateItemsTable({
  items,
  products,
  onSetProduct,
  onMarkNoMatch,
  onResetMatch,
  isActionPending,
}: {
  items: EstimateItem[];
  products: Product[];
  onSetProduct: (estimateItemId: number, productId: number) => void;
  onMarkNoMatch: (estimateItemId: number) => void;
  onResetMatch: (estimateItemId: number) => void;
  isActionPending: boolean;
}) {
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
            <th>Текущий товар</th>
            <th>Статус</th>
            <th>Ручной выбор</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <EstimateItemRow
              key={item.id}
              item={item}
              products={products}
              onSetProduct={onSetProduct}
              onMarkNoMatch={onMarkNoMatch}
              onResetMatch={onResetMatch}
              isActionPending={isActionPending}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EstimateItemRow({
  item,
  products,
  onSetProduct,
  onMarkNoMatch,
  onResetMatch,
  isActionPending,
}: {
  item: EstimateItem;
  products: Product[];
  onSetProduct: (estimateItemId: number, productId: number) => void;
  onMarkNoMatch: (estimateItemId: number) => void;
  onResetMatch: (estimateItemId: number) => void;
  isActionPending: boolean;
}) {
  const [selectedProductId, setSelectedProductId] = useState("");

  function handleSetProduct() {
    if (!selectedProductId) {
      return;
    }

    onSetProduct(item.id, Number(selectedProductId));
    setSelectedProductId("");
  }

  return (
    <tr>
      <td>{item.row_number ?? "—"}</td>
      <td>{item.raw_sku || "—"}</td>
      <td>{item.raw_name}</td>
      <td>{item.unit || "—"}</td>
      <td>{item.quantity}</td>
      <td>{item.material_price ?? "—"}</td>
      <td>{item.installation_price ?? "—"}</td>
      <td>
        {item.product_name ? (
          <div>
            <strong>{item.product_sku}</strong>
            <br />
            <span>{item.product_name}</span>
          </div>
        ) : (
          "—"
        )}
      </td>
      <td>
        <span className={`status-pill status-${item.matching_status}`}>
          {item.matching_status}
        </span>
        {item.matching_confidence && (
          <div className="confidence-text">
            {item.matching_confidence}
          </div>
        )}
      </td>
      <td>
        <select
          value={selectedProductId}
          onChange={(event) => setSelectedProductId(event.target.value)}
        >
          <option value="">Выберите товар</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.sku} — {product.name}
            </option>
          ))}
        </select>
      </td>
      <td>
        <div className="row-actions">
          <button
            type="button"
            onClick={handleSetProduct}
            disabled={!selectedProductId || isActionPending}
          >
            Set
          </button>

          <button
            type="button"
            onClick={() => onMarkNoMatch(item.id)}
            disabled={isActionPending}
          >
            No match
          </button>

          <button
            type="button"
            onClick={() => onResetMatch(item.id)}
            disabled={isActionPending}
          >
            Reset
          </button>
        </div>
      </td>
    </tr>
  );
}

function MatchCandidatesTable({
  candidates,
}: {
  candidates: MatchCandidate[];
}) {
  if (candidates.length === 0) {
    return <p>Кандидаты пока не найдены. Сначала запусти Match.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Estimate item</th>
            <th>Product SKU</th>
            <th>Product</th>
            <th>Confidence</th>
            <th>Source</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>{candidate.estimate_item_name}</td>
              <td>{candidate.product_sku}</td>
              <td>{candidate.product_name}</td>
              <td>{candidate.confidence}</td>
              <td>
                <span className={`badge badge-${candidate.source}`}>
                  {candidate.source}
                </span>
              </td>
              <td>{candidate.reason || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

