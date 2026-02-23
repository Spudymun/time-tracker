/**
 * api-client.ts — обёртка над fetch для Zustand stores.
 *
 * Если сервер возвращает 401 (истёкшая сессия):
 * - Редиректим на /login через window.location.href (полная перезагрузка, очищает state)
 * - Бросаем ошибку, чтобы store не продолжал обработку
 *
 * ВСЕ Zustand stores используют apiFetch вместо fetch напрямую.
 */

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);

  if (res.status === 401) {
    // Полный редирект — очищает клиентский state, не router.push
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return res;
}
