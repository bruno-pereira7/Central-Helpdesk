"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts";
import { api } from "@/services";
import { useDevice } from "@/hooks";

interface Log {
  id: string;
  ticketId: string;
  acao: string;
  descricao: string;
  usuario: string;
  data: string;
}

interface TicketLog extends Log {
  titulo?: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  CRIACAO: { label: "Criação", color: "var(--color-primary)" },
  MUDANCA_STATUS: { label: "Mudança de Status", color: "#b366ff" },
  FECHAMENTO: { label: "Fechamento", color: "var(--color-danger)" },
  REABERTURA: { label: "Reabertura", color: "#f5a623" },
  EDICAO: { label: "Edição", color: "var(--color-info)" },
  COMENTARIO: { label: "Comentário", color: "var(--color-text-subtle)" },
  EXCLUSAO: { label: "Exclusão", color: "var(--color-danger)" },
};

export default function LogsPage() {
  const { user } = useAuth();
  const { isMobile } = useDevice();
  const [logs, setLogs] = useState<Log[]>([]);
  const [tickets, setTickets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketFilter, setTicketFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [logsResult, ticketsResult] = await Promise.all([
        api.get<Log[]>("/logs"),
        api.get<{ id: string; titulo: string }[]>("/tickets"),
      ]);

      if (logsResult.data) {
        setLogs(logsResult.data);
      }
      if (ticketsResult.data) {
        const ticketMap: Record<string, string> = {};
        ticketsResult.data.forEach((t) => {
          ticketMap[t.id] = t.titulo;
        });
        setTickets(ticketMap);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        log.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.usuario.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTicket = !ticketFilter || log.ticketId === ticketFilter;
      return matchesSearch && matchesTicket;
    });
  }, [logs, searchTerm, ticketFilter]);

  const uniqueTickets = useMemo(() => {
    const ticketIds = new Set(logs.map((l) => l.ticketId));
    return Array.from(ticketIds).sort();
  }, [logs]);

  if (user?.role !== "admin") {
    return (
      <div className="fade-in">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          <svg style={{ width: 64, height: 64, margin: "0 auto var(--space-md)", opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Acesso Restrito</h3>
          <p>Esta página é apenas para administradores.</p>
        </div>
      </div>
    );
  }

  const getActionStyle = (acao: string) => {
    return actionLabels[acao] || { label: acao, color: "var(--color-text)" };
  };

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: "var(--space-lg)" }}>Logs de Atividades</h2>

      <div className="card" style={{ marginBottom: "var(--space-lg)", padding: "var(--space-lg)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "var(--color-text-subtle)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por ID, ação, descrição ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
            <select
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              className="select-field"
              style={{ maxWidth: 250 }}
            >
              <option value="">Todos os Tickets</option>
              {uniqueTickets.map((id) => (
                <option key={id} value={id}>
                  {id} - {(tickets[id] || "").substring(0, 30)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p style={{ marginBottom: "var(--space-md)" }}>
        Mostrando <span style={{ fontWeight: 600 }}>{filteredLogs.length}</span> de{" "}
        <span style={{ fontWeight: 600 }}>{logs.length}</span> registros
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          <span className="loading-spinner" style={{ width: 40, height: 40, borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Nenhum log encontrado</h3>
          <p>Não há registros de atividades no momento.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {filteredLogs.map((log) => {
            const actionStyle = getActionStyle(log.acao);
            return (
              <div key={log.id} className="card" style={{ padding: isMobile ? "var(--space-md)" : "var(--space-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-md)", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-subtle)" }}>{log.ticketId}</span>
                      <span style={{ 
                        padding: "2px 8px", 
                        borderRadius: "var(--radius-sm)", 
                        background: `${actionStyle.color}20`, 
                        color: actionStyle.color,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}>
                        {actionStyle.label}
                      </span>
                    </div>
                    <p style={{ marginBottom: "var(--space-sm)" }}>{log.descricao}</p>
                    <div style={{ display: "flex", gap: "var(--space-lg)", fontSize: "0.8rem", color: "var(--color-text-subtle)", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {log.usuario}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(log.data).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
