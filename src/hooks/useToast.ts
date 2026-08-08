import { useCallback } from 'react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'danger' | 'warning';

export function useToast() {
  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    if (type === 'danger') {
      toast.error(message);
      return;
    }
    if (type === 'warning') {
      toast.warning(message);
      return;
    }
    toast.success(message);
  }, []);

  const removeToast = useCallback((_id: string) => {
    toast.dismiss();
  }, []);

  return { addToast, removeToast };
}
