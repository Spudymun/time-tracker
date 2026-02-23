/**
 * Тип тега на клиентской стороне.
 * Соответствует JSON-ответу GET /api/tags (даты — строки).
 */
export interface TagApiItem {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  usageCount: number;
}
