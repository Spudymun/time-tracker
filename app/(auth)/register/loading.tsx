import { Spinner } from "@/components/ui/Spinner";

/**
 * app/(auth)/register/loading.tsx — индикатор загрузки страницы регистрации.
 */
export default function RegisterLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Spinner size="md" className="text-primary" />
    </div>
  );
}
