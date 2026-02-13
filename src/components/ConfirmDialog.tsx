import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { ConfirmDialogProps } from '../props';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: 'bg-red-500 hover:bg-red-600',
      icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
      iconBg: 'bg-red-500/20'
    },
    warning: {
      button: 'bg-yellow-500 hover:bg-yellow-600',
      icon: <AlertCircle className="w-6 h-6 text-yellow-400" />,
      iconBg: 'bg-yellow-500/20'
    },
    info: {
      button: 'bg-cyan-500 hover:bg-cyan-600',
      icon: <Info className="w-6 h-6 text-cyan-400" />,
      iconBg: 'bg-cyan-500/20'
    }
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${style.iconBg}`}>
              {style.icon}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-300 mb-6 ml-11">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${style.button} rounded-lg transition-colors font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}