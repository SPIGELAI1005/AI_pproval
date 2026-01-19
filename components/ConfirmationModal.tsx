import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'success' | 'danger';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    info: 'bg-blue-500 dark:bg-blue-600',
    warning: 'bg-amber-500 dark:bg-amber-600',
    success: 'bg-emerald-500 dark:bg-emerald-600',
    danger: 'bg-red-500 dark:bg-red-600'
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[100] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="glass rounded-2xl border border-white/40 dark:border-white/10 shadow-2xl max-w-md w-full p-6 space-y-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl ${typeStyles[type]} flex items-center justify-center mx-auto mb-2`}>
            {type === 'info' && <i className="fa-solid fa-circle-info text-white text-xl"></i>}
            {type === 'warning' && <i className="fa-solid fa-triangle-exclamation text-white text-xl"></i>}
            {type === 'success' && <i className="fa-solid fa-check-circle text-white text-xl"></i>}
            {type === 'danger' && <i className="fa-solid fa-exclamation-circle text-white text-xl"></i>}
          </div>

          {/* Title */}
          <h3 className="text-lg font-extrabold ui-heading text-center">{title}</h3>

          {/* Message */}
          <p className="text-sm ui-text-secondary text-center">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/20 ui-text-primary font-bold text-sm hover:bg-white/80 dark:hover:bg-white/15 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-sm transition-all ${typeStyles[type]} hover:opacity-90 active:scale-95`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
