'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; type: ToastType; message: string };

type ToastContextValue = {
  showToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;
const DEFAULT_TOAST_DURATION_MS = 5000;
const ERROR_TOAST_DURATION_MS = 10000;

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-900 text-white',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIds = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timeoutId = timeoutIds.current.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutIds.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((current) => [...current, { id, type, message }]);
    const duration = type === 'error' ? ERROR_TOAST_DURATION_MS : DEFAULT_TOAST_DURATION_MS;
    const timeoutId = setTimeout(() => {
      timeoutIds.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, duration);
    timeoutIds.current.set(id, timeoutId);
  }, []);

  useEffect(() => {
    const activeTimeoutIds = timeoutIds.current;
    return () => {
      activeTimeoutIds.forEach(clearTimeout);
      activeTimeoutIds.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            // Errors interrupt (assertive) since they need attention now;
            // success/info are announced without interrupting other speech.
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`flex max-w-sm items-start gap-3 rounded-md px-4 py-3 text-sm font-medium shadow-lg ${TOAST_STYLES[toast.type]}`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
              className="-mr-1 -mt-1 rounded px-1 text-lg leading-none text-white/80 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/75"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
