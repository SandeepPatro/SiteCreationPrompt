import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation built on native <dialog>: the browser handles the focus trap, Esc to close,
 * inert background, and returning focus to the button that opened it.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // Esc fires "cancel"; keep React state in sync with the native close.
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="rounded-card border-line bg-surface text-ink m-auto w-[calc(100%-2rem)] max-w-sm border p-6 shadow-xl backdrop:bg-black/60"
    >
      <h2 id={titleId} className="font-display text-lg font-bold">
        {title}
      </h2>
      <p id={descriptionId} className="text-muted mt-2 text-sm">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        {/* Safe choice gets initial focus. */}
        {/* eslint-disable-next-line jsx-a11y/no-autofocus -- focus must move into the modal */}
        <Button variant="secondary" autoFocus onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
