/**
 * Тип проекта на клиентской стороне.
 * Соответствует JSON-ответу GET /api/projects (даты — строки).
 */
export interface ProjectApiItem {
  id: string;
  name: string;
  color: string;
  isArchived: boolean;
  estimatedHours: number | null;
  hourlyRate: number | null;
  createdAt: string;
  updatedAt: string;
  totalSeconds: number;
  billableSeconds: number;
  earnings: number | null;
  estimateProgress: number | null;
  entryCount: number;
}
