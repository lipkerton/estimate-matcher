import type { MatchCandidate } from "../../../shared/types";

export function MatchCandidatesTable({
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
