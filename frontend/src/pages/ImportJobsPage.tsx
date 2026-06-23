import { useQuery } from "@tanstack/react-query";

import { getImportJobs } from "../api/importJobs";
import type { ImportJob, ImportJobStatus, ImportJobType } from "../shared/types";

export function ImportJobsPage() {
  const importJobsQuery = useQuery({
    queryKey: ["import-jobs"],
    queryFn: getImportJobs,
    refetchInterval: 3000,
  });

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Задачи импорта</h2>
          <p>
            Статусы фоновой обработки Excel-файлов: импорт прайсов и смет.
          </p>
        </div>

        <button
          type="button"
          onClick={() => importJobsQuery.refetch()}
          disabled={importJobsQuery.isFetching}
        >
          {importJobsQuery.isFetching ? "Обновляем..." : "Обновить"}
        </button>
      </div>

      <div className="card">
        <h3>Список задач</h3>

        {importJobsQuery.isLoading && <p>Загрузка...</p>}

        {importJobsQuery.isError && (
          <p className="error-text">Не удалось загрузить задачи импорта.</p>
        )}

        {importJobsQuery.data && (
          <ImportJobsTable jobs={importJobsQuery.data.results} />
        )}
      </div>
    </section>
  );
}

function ImportJobsTable({ jobs }: { jobs: ImportJob[] }) {
  if (jobs.length === 0) {
    return <p>Задач импорта пока нет.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Тип</th>
            <th>Файл</th>
            <th>Статус</th>
            <th>Прогресс</th>
            <th>Строки</th>
            <th>Создана</th>
            <th>Старт</th>
            <th>Финиш</th>
            <th>Ошибка</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td>{formatImportType(job.import_type)}</td>
              <td>{job.original_filename}</td>
              <td>
                <span className={`job-status job-status-${job.status}`}>
                  {formatStatus(job.status)}
                </span>
              </td>
              <td>
                <ProgressBar value={job.progress} />
              </td>
              <td>
                {job.processed_rows} / {job.total_rows}
              </td>
              <td>{formatDate(job.created_at)}</td>
              <td>{formatNullableDate(job.started_at)}</td>
              <td>{formatNullableDate(job.finished_at)}</td>
              <td>{job.error_message || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="progress">
      <div className="progress-bar" style={{ width: `${safeValue}%` }} />
      <span className="progress-text">{safeValue}%</span>
    </div>
  );
}

function formatImportType(type: ImportJobType): string {
  const labels: Record<ImportJobType, string> = {
    price_list: "Прайс",
    estimate: "Смета",
  };

  return labels[type];
}

function formatStatus(status: ImportJobStatus): string {
  const labels: Record<ImportJobStatus, string> = {
    pending: "Ожидает",
    processing: "В работе",
    success: "Успешно",
    failed: "Ошибка",
  };

  return labels[status];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function formatNullableDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return formatDate(value);
}
