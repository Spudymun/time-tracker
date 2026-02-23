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
      title="Удалить проект?"
      description={`«${projectName}» будет удалён безвозвратно.`}
    >
      {entryCount > 0 && (
        <div className="mb-4 rounded-md border border-warning-bg bg-warning-bg px-3 py-2 text-sm text-warning-fg">
          <strong>{entryCount}</strong>{" "}
          {entryCount === 1
            ? "запись потеряет"
            : entryCount < 5
              ? "записи потеряют"
              : "записей потеряют"}{" "}
          привязку к проекту (сами записи не удалятся).
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isDeleting}>
          Отмена
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={isDeleting}>
          Удалить
        </Button>
      </div>
    </Modal>
  );
}
