import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createProduct, getProducts } from "../api/products";
import type { ProductCreatePayload } from "../shared/types";

export function ProductsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProductCreatePayload>({
    sku: "",
    name: "",
    unit: "шт",
    group: null,
    normalized_name: "",
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });

      setForm({
        sku: "",
        name: "",
        unit: "шт",
        group: null,
        normalized_name: "",
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createProductMutation.mutate({
      ...form,
      normalized_name: form.normalized_name || "",
    });
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Каталог товаров</h2>
          <p>
            Нормализованный справочник товаров, с которым будут сопоставляться
            строки смет.
          </p>
        </div>
      </div>

      <form className="card form-grid products-form" onSubmit={handleSubmit}>
        <label>
          SKU
          <input
            value={form.sku}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sku: event.target.value,
              }))
            }
            placeholder="CBL-VVG-3X2.5"
            required
          />
        </label>

        <label>
          Наименование
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Кабель ВВГнг-LS 3x2.5"
            required
          />
        </label>

        <label>
          Ед. изм.
          <input
            value={form.unit}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                unit: event.target.value,
              }))
            }
            placeholder="м"
            required
          />
        </label>

        <button type="submit" disabled={createProductMutation.isPending}>
          {createProductMutation.isPending ? "Создаём..." : "Создать товар"}
        </button>
      </form>

      {createProductMutation.isError && (
        <div className="error-box">
          Не удалось создать товар. Возможно, такой SKU уже существует.
        </div>
      )}

      <div className="card">
        <h3>Список товаров</h3>

        {productsQuery.isLoading && <p>Загрузка...</p>}

        {productsQuery.isError && (
          <p className="error-text">Не удалось загрузить товары.</p>
        )}

        {productsQuery.data && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Наименование</th>
                <th>Ед. изм.</th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.data.results.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
