'use client'
import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "p-4 rounded-2xl shadow-lg border backdrop-blur-sm min-w-[320px] max-w-md transition-all duration-300";

    const typeStyles = {
      success: "bg-green-50/90 border-green-200",
      error: "bg-red-50/90 border-red-200",
      warning: "bg-orange-50/90 border-orange-200",
      info: "bg-blue-50/90 border-blue-200"
    };

    return `${baseStyles} ${typeStyles[toast.type]} ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`;
  };

  const getIcon = () => {
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-green-600" />,
      error: <XCircle className="w-5 h-5 text-red-600" />,
      warning: <AlertCircle className="w-5 h-5 text-orange-600" />,
      info: <Info className="w-5 h-5 text-blue-600" />
    };

    return icons[toast.type];
  };

  const getTitleColor = () => {
    const colors = {
      success: "text-green-900",
      error: "text-red-900",
      warning: "text-orange-900",
      info: "text-blue-900"
    };

    return colors[toast.type];
  };

  const getMessageColor = () => {
    const colors = {
      success: "text-green-700",
      error: "text-red-700",
      warning: "text-orange-700",
      info: "text-blue-700"
    };

    return colors[toast.type];
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${getTitleColor()}`}>
            {toast.title}
          </p>
          {toast.message && (
            <p className={`text-sm mt-1 ${getMessageColor()}`}>
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Global Toast Manager
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toasts]));
};

export const toast = {
  show: (type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, type, title, message, duration };
    toasts = [...toasts, newToast];
    notifyListeners();
    return id;
  },

  success: (title: string, message?: string) => {
    return toast.show('success', title, message);
  },

  error: (title: string, message?: string) => {
    return toast.show('error', title, message, 0); // No auto-dismiss
  },

  warning: (title: string, message?: string) => {
    return toast.show('warning', title, message);
  },

  info: (title: string, message?: string) => {
    return toast.show('info', title, message);
  },

  dismiss: (id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  },

  clear: () => {
    toasts = [];
    notifyListeners();
  },

  subscribe: (listener: (toasts: Toast[]) => void) => {
    toastListeners.push(listener);
    listener([...toasts]);

    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }
};

export const ToastContainer: React.FC = () => {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    return toast.subscribe(setToastList);
  }, []);

  if (toastList.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toastList.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onClose={toast.dismiss} />
        </div>
      ))}
    </div>
  );
};
