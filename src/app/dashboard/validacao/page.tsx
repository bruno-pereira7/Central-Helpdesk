"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth, useTickets } from "@/contexts";
import { api } from "@/services";
import { Ticket, Priority } from "@/types";
import { Modal } from "@/components";

interface TicketWithValidation extends Ticket {
  criticidadeFinal?: Priority;
  parecerAdmin?: string;
  validado?: boolean;
}

export default function ValidacaoPage() {
  const { user } = useAuth();
  const { tickets, refreshTickets } = useTickets();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedTicket, setSelectedTicket] = useState<TicketWithValidation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [parecer, setParecer] = useState("");
  const [criticidadeFinal, setCriticidadeFinal] = useState<Priority>("media");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshTickets();
    setLoading(false);
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  const ticketsPendentes = tickets.filter((t) => t.status === "aberto");

  const statusLabels: Record<string, string> = {
    aberto: "Aberto",
    em_andamento: "Em Andamento",
    resolvido: "Resolvido",
    fechado: "Fechado",
    reaberto: "Reaberto",
  };

  const priorityLabels: Record<string, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    critica: "Crítica",
  };

  const priorityColors: Record<string, string> = {
    baixa: "var(--color-primary)",
    media: "var(--color-warning)",
    alta: "var(--color-danger)",
    critica: "#ff6b6b",
  };

  const handleOpenValidation = (ticket: Ticket) => {
    setSelectedTicket(ticket as TicketWithValidation);
    setParecer("");
    setCriticidadeFinal(ticket.prioridade);
    setShowModal(true);
  };

  const handleSubmitValidation = async () => {
    if (!selectedTicket) return;

    setSaving(true);

    const updates = {
      prioridade: criticidadeFinal,
      status: "em_andamento" as const,
      parecerAdmin: parecer,
      criticidadeFinal: criticidadeFinal,
      validado: true,
    };

    await api.put(`/tickets/${selectedTicket.id}`, updates);
    await refreshTickets();
    setShowModal(false);
    setSelectedTicket(null);
    setSaving(false);
  };

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
          <p>Esta página é apenas para administradores validarem a criticidade dos tickets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", flexWrap: "wrap", gap: "var(--space-md)" }}>
        <h2>Validação de Criticidade</h2>
        <span className="badge status-aberto" style={{ fontSize: "0.9rem", padding: "8px 16px" }}>
          {ticketsPendentes.length} tickets aguardando validação
        </span>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-lg)", padding: "var(--space-lg)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "var(--color-text-subtle)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por título, ID ou solicitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field"
              style={{ maxWidth: 200 }}
            >
              <option value="todos">Todos Status</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
              <option value="reaberto">Reaberto</option>
            </select>
          </div>
        </div>
      </div>

      <p style={{ marginBottom: "var(--space-md)" }}>
        Mostrando <span style={{ fontWeight: 600 }}>{filteredTickets.length}</span> de{" "}
        <span style={{ fontWeight: 600 }}>{tickets.length}</span> tickets
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          <span className="loading-spinner" style={{ width: 40, height: 40, borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="card empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Nenhum ticket encontrado</h3>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="card hover-lift">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-md)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-subtle)" }}>{ticket.id}</span>
                    <span className={`badge status-${ticket.status}`}>{statusLabels[ticket.status]}</span>
                    <span className={`badge priority-${ticket.prioridade}`}>Solicitada: {priorityLabels[ticket.prioridade]}</span>
                    {(ticket as TicketWithValidation).validado && (
                      <>
                        <span className="badge priority-media" style={{ background: `${priorityColors[(ticket as TicketWithValidation).criticidadeFinal!]}20`, color: priorityColors[(ticket as TicketWithValidation).criticidadeFinal!] }}>
                          Definida: {priorityLabels[(ticket as TicketWithValidation).criticidadeFinal!]}
                        </span>
                        <span className="badge status-resolvido">Validado</span>
                      </>
                    )}
                  </div>
                  <h3 style={{ marginBottom: "var(--space-sm)" }}>{ticket.titulo}</h3>
                  <div style={{ display: "flex", gap: "var(--space-lg)", fontSize: "0.85rem", color: "var(--color-text-subtle)", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {ticket.solicitante}
                    </span>
                    <span>{ticket.departamento}</span>
                    <span>{new Date(ticket.dataAbertura).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {(ticket as TicketWithValidation).parecerAdmin && (
                    <div style={{ marginTop: "var(--space-md)", padding: "var(--space-md)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-sm)" }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500, marginBottom: "var(--space-xs)" }}>Parecer do Admin:</p>
                      <p style={{ fontSize: "0.9rem" }}>{(ticket as TicketWithValidation).parecerAdmin}</p>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                  {ticket.status === "aberto" && (
                    <button onClick={() => handleOpenValidation(ticket)} className="btn-primary" style={{ whiteSpace: "nowrap" }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Validar
                    </button>
                  )}
                  {ticket.status === "em_andamento" && (
                    <button onClick={() => handleOpenValidation(ticket)} className="btn-secondary" style={{ whiteSpace: "nowrap" }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Alterar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Validar Criticidade do Ticket">
        {selectedTicket && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
            <div className="card" style={{ background: "var(--color-surface-alt)" }}>
              <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-subtle)" }}>{selectedTicket.id}</span>
              </div>
              <h3 style={{ marginBottom: "var(--space-sm)" }}>{selectedTicket.titulo}</h3>
              <p style={{ marginBottom: "var(--space-md)" }}>{selectedTicket.descricao}</p>
              <div style={{ display: "flex", gap: "var(--space-lg)", fontSize: "0.85rem", color: "var(--color-text-subtle)" }}>
                <span>Solicitante: {selectedTicket.solicitante}</span>
                <span>Depto: {selectedTicket.departamento}</span>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: "var(--space-sm)", display: "block" }}>
                Criticidade Solicitada pelo Usuário
              </label>
              <span className={`badge priority-${selectedTicket.prioridade}`}>
                {priorityLabels[selectedTicket.prioridade]}
              </span>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: "var(--space-sm)", display: "block" }}>
                Definir Criticidade Final *
              </label>
              <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                {(["baixa", "media", "alta", "critica"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCriticidadeFinal(p)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "var(--radius-sm)",
                      border: `2px solid ${criticidadeFinal === p ? priorityColors[p] : "var(--color-border)"}`,
                      background: criticidadeFinal === p ? `${priorityColors[p]}20` : "transparent",
                      color: criticidadeFinal === p ? priorityColors[p] : "var(--color-text)",
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: "var(--space-sm)", display: "block" }}>
                Parecer / Observação do Administrador
              </label>
              <textarea
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
                className="input-field"
                placeholder="Descreva o parecer sobre a criticidade definida..."
                rows={4}
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: "var(--space-md)" }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                Cancelar
              </button>
              <button onClick={handleSubmitValidation} disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                {saving ? (
                  <>
                    <span className="loading-spinner" />
                    Salvando...
                  </>
                ) : (
                  "Confirmar Validação"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
