import type { Estimate } from "../../../shared/types";

export function EstimatesTable({
  estimates,
  onSelectEstimate,
  onRunMatch,
  onRunLLMRerank,
  isMatchPending,
  isLLMRerankPending,
}: {
  estimates: Estimate[];
  onSelectEstimate: (estimateId: number) => void;
  onRunMatch: (estimateId: number) => void;
  onRunLLMRerank: (estimateId: number) => void;
  isMatchPending: boolean;
  isLLMRerankPending: boolean;
}) {
  if (estimates.length === 0) {
    return <p>Сметы пока не созданы.</p>;
  }

  return (
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
        {estimates.map((estimate) => (
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
                  onClick={() => onSelectEstimate(estimate.id)}
                >
                  Позиции
                </button>

                <button
                  type="button"
                  onClick={() => onRunMatch(estimate.id)}
                  disabled={isMatchPending}
                >
                  Match
                </button>

                <button
                  type="button"
                  onClick={() => onRunLLMRerank(estimate.id)}
                  disabled={isLLMRerankPending}
                >
                  LLM rerank
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
