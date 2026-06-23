import { useState } from "react";
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
import { getMatchCandidatesByEstimate } from "../api/matching";
import { EstimateItemsTable } from "../features/estimates/components/EstimateItemsTable";
import { MatchCandidatesTable } from "../features/estimates/components/MatchCandidatesTable";
import { EstimatesTable } from "../features/estimates/components/EstimatesTable";
import { EstimateImportForm } from "../features/estimates/components/EstimateImportForm";


export function EstimatesPage() {
  const queryClient = useQueryClient();

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

      <EstimateImportForm
        projects={projectsQuery.data?.results ?? []}
        importFiles={importFilesQuery.data?.results ?? []}
        onSubmit={(payload) => importMutation.mutate(payload)}
        isPending={importMutation.isPending}
      />

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
          <EstimatesTable
            estimates={estimatesQuery.data.results}
            onSelectEstimate={setSelectedEstimateId}
            onRunMatch={(estimateId) => matchMutation.mutate(estimateId)}
            onRunLLMRerank={(estimateId) => llmRerankMutation.mutate(estimateId)}
            isMatchPending={matchMutation.isPending}
            isLLMRerankPending={llmRerankMutation.isPending}
          />
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
