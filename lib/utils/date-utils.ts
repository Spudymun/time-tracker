/**
 * Date utility functions.
 *
 * ПОЧЕМУ здесь: форматирование дат — чистые функции без зависимостей от React/Next.js.
 * Используются в компонентах, репозиториях и сервисах.
 * Все вычисления timezone-agnostic — работают с UTC Date объектами.
 */

/**
 * Возвращает дату начала недели (понедельник) для переданной даты.
 * Время сброшено до 00:00:00.000 UTC.
 */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  // getDay() возвращает 0=Sun, 1=Mon, ..., 6=Sat
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // сдвиг до понедельника
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Форматирует дату в строку 'YYYY-MM-DD'.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Парсит ISO-строку даты (YYYY-MM-DD или полный ISO 8601) в Date.
 * Бросает RangeError если строка невалидна.
 */
export function parseISODate(s: string): Date {
  const d = new Date(s);
  if (isNaN(d.getTime())) {
    throw new RangeError(`Invalid date string: "${s}"`);
  }
  return d;
}
