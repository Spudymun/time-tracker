"use client";

/**
 * ProjectForm — компактная inline форма создания/редактирования проекта.
 * Используется в ProjectsList (новый проект) и ProjectItem (редактирование).
 *
 * Props:
 *   initialData — данные для режима редактирования; null/undefined = создание
 *   onSave(data) — вызывается при сабмите (после валидации)
 *   onCancel — выход из формы без сохранения
 *   isSaving — блокирует форму и показывает Spinner в кнопке Save
 */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ColorPicker } from "./ColorPicker";

export interface ProjectFormData {
  name: string;
  color: string;
  estimatedHours: number | null;
  hourlyRate: number | null;
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSave: (data: ProjectFormData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const DEFAULT_COLOR = "#6366f1";

export function ProjectForm({ initialData, onSave, onCancel, isSaving = false }: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [color, setColor] = useState(initialData?.color ?? DEFAULT_COLOR);
  const [estimatedHours, setEstimatedHours] = useState(
    initialData?.estimatedHours != null ? String(initialData.estimatedHours) : ""
  );
  const [hourlyRate, setHourlyRate] = useState(
    initialData?.hourlyRate != null ? String(initialData.hourlyRate) : ""
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [estimatedHoursError, setEstimatedHoursError] = useState<string | null>(null);
  const [hourlyRateError, setHourlyRateError] = useState<string | null>(null);

  const validate = (): ProjectFormData | null => {
    let valid = true;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required");
      valid = false;
    } else if (trimmedName.length > 50) {
      setNameError("Maximum 50 characters");
      valid = false;
    } else {
      setNameError(null);
    }

    let parsedEstimatedHours: number | null = null;
    if (estimatedHours.trim() !== "") {
      const val = parseFloat(estimatedHours);
      if (isNaN(val) || val <= 0) {
        setEstimatedHoursError("Must be > 0");
        valid = false;
      } else {
        setEstimatedHoursError(null);
        parsedEstimatedHours = val;
      }
    } else {
      setEstimatedHoursError(null);
    }

    let parsedHourlyRate: number | null = null;
    if (hourlyRate.trim() !== "") {
      const val = parseFloat(hourlyRate);
      if (isNaN(val) || val < 0) {
        setHourlyRateError("Must be ≥ 0");
        valid = false;
      } else {
        setHourlyRateError(null);
        parsedHourlyRate = val;
      }
    } else {
      setHourlyRateError(null);
    }

    if (!valid) return null;
    return {
      name: trimmedName,
      color,
      estimatedHours: parsedEstimatedHours,
      hourlyRate: parsedHourlyRate,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = validate();
    if (data) onSave(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      {/* Row 1: name + color */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            error={nameError ?? undefined}
            disabled={isSaving}
            autoFocus
            maxLength={50}
          />
        </div>
        <div className="shrink-0">
          <p className="mb-1 text-sm font-medium text-text-2">Color</p>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>

      {/* Row 2: optional fields */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            label="Budget (hours)"
            type="number"
            min="0.1"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="e.g. 40"
            error={estimatedHoursError ?? undefined}
            hint="Optional"
            disabled={isSaving}
          />
        </div>
        <div className="flex-1">
          <Input
            label="Rate ($/h)"
            type="number"
            min="0"
            step="0.5"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="e.g. 80"
            error={hourlyRateError ?? undefined}
            hint="Optional"
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={isSaving}>
          Save
        </Button>
      </div>
    </form>
  );
}
