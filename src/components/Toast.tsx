import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    border: 'border-border',
    iconColor: 'text-emerald-500'
  },
  danger: {
    icon: XCircle,
    border: 'border-red-500/30',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    border: 'border-amber-500/30',
    iconColor: 'text-amber-500'
  }
};

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map(toast => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-lg border ${config.border} bg-card px-4 py-3 text-sm text-foreground shadow-xl animate-toast-in`}
          >
            <Icon className={`size-4 shrink-0 ${config.iconColor}`} aria-hidden="true" />
            <span className="font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="ml-2 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
