"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts";
import { api } from "@/services";

const API_BASE = typeof window !== "undefined" 
  ? `${window.location.protocol}//${window.location.hostname}:3080`
  : "http://localhost:3080";

interface BackupData {
  tickets: any[];
  timestamp: string;
}

export default function BackupPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user?.role !== "admin") {
    return (
      <div className="fade-in">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          <svg
            style={{ width: 64, height: 64, margin: "0 auto var(--space-md)", opacity: 0.5 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Acesso Restrito</h3>
          <p>Esta página é apenas para administradores.</p>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/export`);
      
      if (!response.ok) {
        throw new Error("Erro ao exportar dados");
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `helpdesk-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Backup exportado com sucesso!" });
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao exportar backup. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      if (!data.tickets || !Array.isArray(data.tickets)) {
        throw new Error("Formato de arquivo inválido");
      }

      const response = await fetch(`${API_BASE}/api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao importar dados");
      }

      const result = await response.json();
      setMessage({ type: "success", text: `${result.imported} tickets importados com sucesso!` });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao importar backup. Verifique o formato do arquivo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: "var(--space-lg)" }}>Backup e Restauração</h2>

      <div style={{ display: "grid", gap: "var(--space-lg)", maxWidth: "600px" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)", flexShrink: 0 }}>
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h3>Exportar Dados</h3>
              <p style={{ fontSize: "0.9rem", marginTop: "var(--space-xs)" }}>
                Baixe todos os tickets em um arquivo JSON para backup.
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                Exportando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Backup
              </>
            )}
          </button>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "var(--color-warning)", flexShrink: 0 }}>
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3>Importar Dados</h3>
              <p style={{ fontSize: "0.9rem", marginTop: "var(--space-xs)" }}>
                Restaure os tickets a partir de um arquivo JSON exportado anteriormente.
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={loading}
            id="import-file"
            style={{ display: "none" }}
          />
          
          <label
            htmlFor="import-file"
            className="btn-secondary"
            style={{ 
              width: "100%", 
              justifyContent: "center", 
              display: "flex",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                Importando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Selecionar Arquivo
              </>
            )}
          </label>
          
          <p style={{ fontSize: "0.8rem", marginTop: "var(--space-sm)", color: "var(--color-warning)" }}>
            ⚠️ A importação substituirá todos os dados existentes!
          </p>
        </div>

        {message && (
          <div
            className="card"
            style={{
              background: message.type === "success" ? "rgba(29, 185, 84, 0.1)" : "rgba(224, 47, 68, 0.1)",
              border: `1px solid ${message.type === "success" ? "var(--color-primary)" : "var(--color-danger)"}`,
            }}
          >
            <p style={{ 
              color: message.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
            }}>
              {message.type === "success" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {message.text}
            </p>
          </div>
        )}

        <div className="card" style={{ background: "var(--color-surface-alt)" }}>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Informações</h3>
          <ul style={{ paddingLeft: "var(--space-lg)", color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.8 }}>
            <li>O arquivo de backup contém todos os tickets e comentários.</li>
            <li>A exportação cria um arquivo JSON com a data atual no nome.</li>
            <li>A importação substituirá TODOS os dados existentes.</li>
            <li>Após importar, a página será recarregada automaticamente.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
