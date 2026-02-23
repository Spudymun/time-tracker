import { ReportsPage } from "@/components/reports/ReportsPage";

/**
 * /reports — страница отчётов.
 * Server Component — просто оборачивает клиентский ReportsPage.
 * Route protected by middleware.ts.
 */
export default function ReportsRoute() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ReportsPage />
    </div>
  );
}
