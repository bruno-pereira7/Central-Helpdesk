"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "400px",
    md: "500px",
    lg: "700px",
    xl: "900px",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-md)" }}>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", transition: "opacity 0.2s" }}
        onClick={onClose}
      />
      <div 
        className="fade-in"
        style={{ 
          position: "relative", 
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          boxShadow: "var(--shadow-lg)",
          width: "100%",
          maxWidth: sizeClasses[size],
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-lg)", borderBottom: "1px solid var(--color-border)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "var(--space-sm)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-subtle)",
              transition: "var(--transition-fast)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--color-surface-alt)";
              e.currentTarget.style.color = "var(--color-text)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--color-text-subtle)";
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ padding: "var(--space-lg)" }}>{children}</div>
      </div>
    </div>
  );
}
