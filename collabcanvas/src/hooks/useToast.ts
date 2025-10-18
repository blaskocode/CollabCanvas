import toast from 'react-hot-toast';

/**
 * Custom hook to use toast notifications
 * Wraps react-hot-toast for easy access throughout the app
 * 
 * @returns Object with toast notification methods
 * 
 * @example
 * const { success, error, loading } = useToast();
 * success('Operation completed!');
 * error('Something went wrong!');
 * const toastId = loading('Processing...');
 * // Later: toast.dismiss(toastId);
 */
export const useToast = () => {
  return {
    success: (message: string, options?: any) => toast.success(message, options),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
    promise: toast.promise,
    dismiss: toast.dismiss,
    custom: toast.custom,
  };
};

export default useToast;

