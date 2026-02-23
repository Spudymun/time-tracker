"use client";

/**
 * TagForm — компактная форма создания/редактирования тега.
 * Props:
 *   initialData — данные для режима редактирования
 *   onSave(data) — сабмит после валидации
 *   onCancel — выход без сохранения
 *   isSaving — блокирует форму
 */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ColorPicker } from "@/components/projects/ColorPicker";

export interface TagFormData {
  name: string;
  color: string;
}

interface TagFormProps {
  initialData?: Partial<TagFormData>;
  onSave: (data: TagFormData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const DEFAULT_COLOR = "#10b981";

export function TagForm({ initialData, onSave, onCancel, isSaving = false }: TagFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [color, setColor] = useState(initialData?.color ?? DEFAULT_COLOR);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim().toLowerCase();
    if (!trimmed) {
      setNameError("Название обязательно");
      return;
    }
    if (trimmed.length > 30) {
      setNameError("Максимум 30 символов");
      return;
    }
    setNameError(null);
    onSave({ name: trimmed, color });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название тега"
            error={nameError ?? undefined}
            disabled={isSaving}
            autoFocus
            maxLength={30}
          />
        </div>
        <div className="shrink-0">
          <p className="mb-1 text-sm font-medium text-text-2">Цвет</p>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          Отмена
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={isSaving}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
