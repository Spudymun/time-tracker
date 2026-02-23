import { Spinner } from "@/components/ui/Spinner";

/**
 * app/(auth)/login/loading.tsx — индикатор загрузки страницы входа.
 */
export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Spinner size="md" className="text-primary" />
    </div>
  );
}
