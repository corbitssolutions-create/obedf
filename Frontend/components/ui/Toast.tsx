"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

/* ─── Config ─────────────────────────────────────────────────────────────── */
const CONFIG: Record<ToastType, { icon: React.FC<{ className?: string }>; cls: string; titleCls: string }> = {
  success: { icon: CheckCircle2, cls: "border-green-100 bg-green-50",  titleCls: "text-green-800" },
  error:   { icon: XCircle,      cls: "border-red-100 bg-red-50",      titleCls: "text-red-800"   },
  warning: { icon: AlertCircle,  cls: "border-amber-100 bg-amber-50",  titleCls: "text-amber-800" },
  info:    { icon: Info,         cls: "border-blue-100 bg-blue-50",    titleCls: "text-blue-800"  },
};

/* ─── Single toast item ───────────────────────────────────────────────────── */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const { icon: Icon, cls, titleCls } = CONFIG[toast.type];
  const [visible, setVisible] = useState(false);

  // Fade in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss after 4 s
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300
        ${cls} ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${titleCls}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${titleCls}`}>{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-md p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Container (fixed portal) ───────────────────────────────────────────── */
export function ToastContainer({ toasts, onRemove }: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

/* ─── Hook ────────────────────────────────────────────────────────────────── */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(p => [...p, { id, type, title, message }]);
  }, []);

  const success = useCallback((title: string, message?: string) => toast("success", title, message), [toast]);
  const error   = useCallback((title: string, message?: string) => toast("error",   title, message), [toast]);
  const warning = useCallback((title: string, message?: string) => toast("warning", title, message), [toast]);
  const info    = useCallback((title: string, message?: string) => toast("info",    title, message), [toast]);

  return { toasts, remove, toast, success, error, warning, info };
}
