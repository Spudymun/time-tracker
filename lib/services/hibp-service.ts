import crypto from "crypto";

/**
 * Проверяет пароль через HaveIBeenPwned Passwords API (k-anonymity модель).
 *
 * Алгоритм (k-anonymity):
 *   1. SHA-1 хеш пароля → верхний регистр
 *   2. Первые 5 символов хеша → отправляются в HIBP API
 *   3. API возвращает ВСЕ суффиксы хешей с таким префиксом + количество утечек
 *   4. Ищем наш суффикс в ответе
 *
 * Полный пароль и полный хеш никогда не покидают сервер.
 *
 * @returns количество вхождений пароля в базах утечек (0 = не скомпрометирован)
 */
export async function checkPasswordPwned(password: string): Promise<number> {
  const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  let res: Response;
  try {
    res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        // Padding скрывает размер трафика от наблюдателей
        "Add-Padding": "true",
      },
      // Таймаут 3 секунды: если HIBP недоступен — не блокируем регистрацию
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Fail open: если HIBP недоступен, не блокируем пользователя
    return 0;
  }

  if (!res.ok) {
    return 0;
  }

  const text = await res.text();

  for (const line of text.split("\n")) {
    const [hashSuffix, countStr] = line.trim().split(":");
    if (hashSuffix === suffix && countStr !== undefined) {
      return parseInt(countStr, 10);
    }
  }

  return 0;
}
