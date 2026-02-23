import { Spinner } from "@/components/ui/Spinner";

/**
 * app/loading.tsx — глобальный индикатор загрузки.
 * Показывается при загрузке root layout / первой навигации.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Spinner size="lg" className="text-primary" />
    </div>
  );
}
