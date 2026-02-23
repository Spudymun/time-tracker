"use client";

/**
 * EntryDeleteConfirm — инлайн-подтверждение удаления записи.
 * Показывает два кнопки: "Yes, delete" и "Cancel".
 * Не является модалом — встраивается прямо в строку EntryItem.
 */

import { Button } from "@/components/ui/Button";

interface EntryDeleteConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EntryDeleteConfirm({
  onConfirm,
  onCancel,
  isLoading = false,
}: EntryDeleteConfirmProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-2">Delete this entry?</span>
      <Button
        variant="danger"
        size="sm"
        onClick={onConfirm}
        loading={isLoading}
        disabled={isLoading}
      >
        Yes, delete
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
    </div>
  );
}
