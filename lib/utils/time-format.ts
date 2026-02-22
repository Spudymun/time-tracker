/**
 * Time formatting utility functions.
 *
 * ПОЧЕМУ здесь: форматирование длительности — чистые функции без зависимостей от React/Next.js.
 * Используются в TimerDisplay, EntryItem, ReportTable и других UI-компонентах.
 */

/**
 * Форматирует длительность в строку 'h:mm:ss' или 'hh:mm:ss'.
 * Часы не имеют ведущего нуля, минуты и секунды — всегда двузначные.
 *
 * @example
 *   formatDuration(3661)  // "1:01:01"
 *   formatDuration(36610) // "10:10:10"
 *   formatDuration(59)    // "0:00:59"
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  return `${h}:${mm}:${ss}`;
}

/**
 * Форматирует длительность в краткий вид 'Xh Ym'.
 * Если часов 0 — показывает только минуты.
 * Если минут 0 — показывает только часы.
 *
 * @example
 *   formatDurationShort(3661)  // "1h 1m"
 *   formatDurationShort(7200)  // "2h"
 *   formatDurationShort(300)   // "5m"
 *   formatDurationShort(0)     // "0m"
 */
export function formatDurationShort(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Парсит строку ввода длительности в формате 'h:mm' или 'hh:mm' и возвращает секунды.
 * Допустимый диапазон: 00:01 – 99:59 (1 секунда – 359940 секунд).
 * Возвращает null если строка невалидна или вне допустимого диапазона.
 *
 * @example
 *   parseDurationInput("1:30")  // 5400
 *   parseDurationInput("0:01")  // 60
 *   parseDurationInput("99:59") // 359940
 *   parseDurationInput("100:00") // null (out of range)
 *   parseDurationInput("abc")   // null
 */
export function parseDurationInput(input: string): number | null {
  const trimmed = input.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;

  // match[1] и match[2] гарантированно строки — regex содержит ровно 2 capture groups
  const [, hoursStr, minutesStr] = match;
  const hours = parseInt(hoursStr ?? "0", 10);
  const minutes = parseInt(minutesStr ?? "0", 10);

  if (minutes > 59) return null;

  const totalSeconds = hours * 3600 + minutes * 60;

  // диапазон: 1 минута (60 сек) – 99:59 (359940 сек)
  if (totalSeconds < 60 || totalSeconds > 359940) return null;

  return totalSeconds;
}
