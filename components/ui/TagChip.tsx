"use client";

/**
 * TagChip — цветной чип для тега.
 * Единственное исключение из запрета inline style: style={{ backgroundColor: color }}.
 * Переиспользуется в TimerBar TagSelect и EntryItem.
 */

import { X } from "lucide-react";

interface TagChipProps {
  name: string;
  color: string; // hex #RRGGBB
  onRemove?: () => void;
}

/**
 * Вычисляет контрастный цвет текста (чёрный или белый) для данного hex-цвета фона.
 * Использует относительную яркость по формуле WCAG.
 */
function getContrastColor(hex: string): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  // Relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#18181B" : "#FAFAFA";
}

export function TagChip({ name, color, onRemove }: TagChipProps) {
  const textColor = getContrastColor(color);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      // Единственное исключение из запрета inline style — динамический цвет
      style={{ backgroundColor: color, color: textColor }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none"
          aria-label={`Удалить тег ${name}`}
          style={{ color: textColor }}
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
}
