import * as React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{ zIndex: 110 }}
    >
      <div
        className="modal"
        style={{ maxWidth: 440, padding: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
              variant === 'destructive'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            <AlertTriangle size={18} strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={onCancel}
                style={{ width: 24, height: 24 }}
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-3.5 border-t border-zinc-800">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
