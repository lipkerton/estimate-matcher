import { useState } from "react";

import type { EstimateItem, Product } from "../../../shared/types";


export function EstimateItemsTable({
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