import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClasses = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    error: 'bg-rose-50 text-rose-950 border-rose-200',
  };

  const indicatorClasses = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    error: 'bg-rose-500',
  };

  return (
    <div
      id="toast-notification"
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center space-x-3 border transition-all duration-300 transform scale-100 print:hidden ${bgClasses[type]}`}
    >
      <div className={`w-2 h-2 rounded-full animate-ping ${indicatorClasses[type]}`} />
      <span className="font-semibold text-sm">{message}</span>
      <button
        onClick={onClose}
        className="text-stone-400 hover:text-stone-700 font-bold text-xs pl-2 cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}
