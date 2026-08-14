'use client'
import { toast } from '@/components/ui/Toast';

export const useToast = () => {
  return {
    success: (title: string, message?: string) => {
      return toast.success(title, message);
    },

    error: (title: string, message?: string) => {
      return toast.error(title, message);
    },

    warning: (title: string, message?: string) => {
      return toast.warning(title, message);
    },

    info: (title: string, message?: string) => {
      return toast.info(title, message);
    },

    dismiss: (id: string) => {
      toast.dismiss(id);
    },

    clear: () => {
      toast.clear();
    }
  };
};
