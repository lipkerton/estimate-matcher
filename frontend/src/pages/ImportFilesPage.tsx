import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getImportFilePreview,
  getImportFiles,
  uploadImportFile,
} from "../api/importFiles";
import type { ExcelPreview } from "../shared/types";

export function ImportFilesPage() {
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelPreview | null>(null);

  const importFilesQuery = useQuery({
    queryKey: ["import-files"],
    queryFn: getImportFiles,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadImportFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-files"] });
      setSelectedFile(null);
    },
  });

  const previewMutation = useMutation({
    mutationFn: getImportFilePreview,
    onSuccess: (data) => {
      setPreview(data);
    },
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      return;
    }

    uploadMutation.mutate(selectedFile);
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Файлы импорта</h2>
          <p>
            Загрузка Excel-файлов для дальнейшего импорта прайсов и смет.
          </p>
        </div>
      </div>

      <form className="card upload-form" onSubmit={handleSubmit}>
        <label>
          Excel-файл
          <input
            type="file"
            accept=".xlsx,.xlsm,.xls"
            onChange={handleFileChange}
          />
        </label>

        <button
          type="submit"
          disabled={!selectedFile || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Загружаем..." : "Загрузить файл"}
        </button>
      </form>

      {uploadMutation.isError && (
        <div className="error-box">
          Не удалось загрузить файл. Проверь формат: .xlsx, .xlsm или .xls.
        </div>
      )}

      <div className="card">
        <h3>Загруженные файлы</h3>

        {importFilesQuery.isLoading && <p>Загрузка...</p>}

        {importFilesQuery.isError && (
          <p className="error-text">Не удалось загрузить список файлов.</p>
        )}

        {importFilesQuery.data && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя файла</th>
                <th>Дата загрузки</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {importFilesQuery.data.results.map((file) => (
                <tr key={file.id}>
                  <td>{file.id}</td>
                  <td>{file.original_filename}</td>
                  <td>{new Date(file.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => previewMutation.mutate(file.id)}
                      disabled={previewMutation.isPending}
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {previewMutation.isError && (
        <div className="error-box">Не удалось получить preview файла.</div>
      )}

      {preview && (
        <div className="card">
          <h3>Preview: {preview.original_filename}</h3>

          <p className="muted-text">
            Лист: {preview.sheet_name}. Всего листов:{" "}
            {preview.sheet_names.join(", ")}
          </p>

          <div className="table-scroll">
            <table>
              <tbody>
                {preview.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{formatCell(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}
