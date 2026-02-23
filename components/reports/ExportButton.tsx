"use client";

/**
 * ExportButton — скачивает CSV-отчёт за выбранный период.
 * Запрашивает /api/reports/export?from=&to= как blob.
 * Имя файла: time-report-{from}_{to}.csv
 */

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/date-utils";

interface ExportButtonProps {
  from: Date;
  to: Date;
}

export function ExportButton({ from, to }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    setIsLoading(true);
    try {
      const fromStr = formatDate(from);
      const toStr = formatDate(to);
      const res = await fetch(`/api/reports/export?from=${fromStr}&to=${toStr}`);

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error(`Export failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `time-report-${fromStr}_${toStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={isLoading}
      onClick={handleExport}
      aria-label="Export CSV"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
