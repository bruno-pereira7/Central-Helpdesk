"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Toast {
  id: string;
  tipo: "chat" | "status" | "info" | "sucesso" | "erro";
  titulo: string;
  mensagem: string;
  ticketId?: string;
  duracao?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duracao = toast.duracao || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duracao);
  }, []);

  const handleToastClick = (toast: Toast) => {
    if (toast.ticketId) {
      router.push(`/dashboard/tickets/${toast.ticketId}`);
    }
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  };

  const getToastStyle = (tipo: Toast["tipo"]) => {
    switch (tipo) {
      case "sucesso":
        return { borderLeft: "4px solid var(--color-primary)", background: "var(--color-surface)" };
      case "erro":
        return { borderLeft: "4px solid var(--color-danger)", background: "var(--color-surface)" };
      case "chat":
        return { borderLeft: "4px solid var(--color-info)", background: "var(--color-surface)" };
      case "status":
        return { borderLeft: "4px solid #b366ff", background: "var(--color-surface)" };
      default:
        return { borderLeft: "4px solid var(--color-text-subtle)", background: "var(--color-surface)" };
    }
  };

  const getIcon = (tipo: Toast["tipo"]) => {
    switch (tipo) {
      case "sucesso":
        return (
          <svg width="20" height="20" fill="none" stroke="var(--color-primary)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "erro":
        return (
          <svg width="20" height="20" fill="none" stroke="var(--color-danger)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case "chat":
        return (
          <svg width="20" height="20" fill="none" stroke="var(--color-info)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "status":
        return (
          <svg width="20" height="20" fill="none" stroke="#b366ff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" fill="none" stroke="var(--color-text-subtle)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          maxWidth: 350,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => handleToastClick(toast)}
            style={{
              ...getToastStyle(toast.tipo),
              padding: "var(--space-md)",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              cursor: toast.ticketId ? "pointer" : "default",
              animation: "slideIn 0.3s ease",
            }}
          >
            <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>{getIcon(toast.tipo)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 2, color: "var(--color-text)" }}>
                  {toast.titulo}
                </p>
                <p style={{ fontSize: "0.8rem", margin: 0, color: "var(--color-text-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {toast.mensagem}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "var(--color-text-subtle)",
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
