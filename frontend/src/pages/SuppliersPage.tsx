import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createSupplier, getSuppliers } from "../api/suppliers";
import type { SupplierCreatePayload } from "../shared/types";

export function SuppliersPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<SupplierCreatePayload>({
    name: "",
    inn: "",
    currency: "RUB",
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const createSupplierMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });

      setForm({
        name: "",
        inn: "",
        currency: "RUB",
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createSupplierMutation.mutate(form);
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Поставщики</h2>
          <p>Справочник поставщиков для загрузки прайс-листов.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Название
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="ООО КабельСнаб"
            required
          />
        </label>

        <label>
          ИНН
          <input
            value={form.inn}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                inn: event.target.value,
              }))
            }
            placeholder="7701234567"
            required
          />
        </label>

        <label>
          Валюта
          <select
            value={form.currency}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                currency: event.target.value as SupplierCreatePayload["currency"],
              }))
            }
          >
            <option value="RUB">RUB</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </select>
        </label>

        <button type="submit" disabled={createSupplierMutation.isPending}>
          {createSupplierMutation.isPending ? "Создаём..." : "Создать поставщика"}
        </button>
      </form>

      {createSupplierMutation.isError && (
        <div className="error-box">
          Не удалось создать поставщика. Возможно, такой ИНН уже существует.
        </div>
      )}

      <div className="card">
        <h3>Список поставщиков</h3>

        {suppliersQuery.isLoading && <p>Загрузка...</p>}

        {suppliersQuery.isError && (
          <p className="error-text">Не удалось загрузить поставщиков.</p>
        )}

        {suppliersQuery.data && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>ИНН</th>
                <th>Валюта</th>
              </tr>
            </thead>
            <tbody>
              {suppliersQuery.data.results.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.id}</td>
                  <td>{supplier.name}</td>
                  <td>{supplier.inn}</td>
                  <td>{supplier.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}