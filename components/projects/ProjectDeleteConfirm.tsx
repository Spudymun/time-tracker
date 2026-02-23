"use client";

/**
 * ProjectDeleteConfirm — модальное подтверждение удаления проекта.
 * Предупреждает сколько записей станут непривязанными.
 */

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ProjectDeleteConfirmProps {
  projectName: string;
  entryCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProjectDeleteConfirm({
  projectName,
  entryCount,
  isDeleting,
  onConfirm,
  onCancel,
}: ProjectDeleteConfirmProps) {
  return (
    <Modal
      open
      onClose={onCancel}
      title="Delete project?"
      description={`"${projectName}" will be deleted permanently.`}
    >
      {entryCount > 0 && (
        <div className="mb-4 rounded-md border border-warning-bg bg-warning-bg px-3 py-2 text-sm text-warning-fg">
          <strong>{entryCount}</strong> {entryCount === 1 ? "entry will lose" : "entries will lose"}{" "}
          its project assignment (the entries themselves won&apos;t be deleted).
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={isDeleting}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
