import { Toaster } from 'react-hot-toast';

/**
 * Toast notification component
 * This wraps react-hot-toast's Toaster component with our custom configuration
 */
export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: 'rgba(17, 24, 39, 0.95)',
          color: '#fff',
          fontSize: '14px',
          padding: '16px 24px',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontWeight: '500',
        },
        // Success toast style
        success: {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
            boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        // Error toast style
        error: {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
            boxShadow: '0 10px 40px rgba(239, 68, 68, 0.4)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
        // Loading toast style
        loading: {
          style: {
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))',
            boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#6366f1',
          },
        },
      }}
    />
  );
};

export default ToastContainer;

