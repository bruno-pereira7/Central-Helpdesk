"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTickets, useAuth } from "@/contexts";
import { Status, Priority } from "@/types";
import { Modal, TicketForm } from "@/components";
import { useDevice } from "@/hooks";

export default function TicketsPage() {
  const router = useRouter();
  const { tickets, loading, deleteTicket } = useTickets();
  const { user } = useAuth();
  const { isMobile } = useDevice();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "todos">("todos");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "todos">("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");

  const isAdmin = user?.role === "admin";

  const categoryLabels: Record<string, string> = {
    hardware: "Hardware",
    software: "Software",
    rede: "Rede",
    email: "E-mail",
    impressora: "Impressora",
    sistema: "Sistema",
    acesso: "Acesso",
    outro: "Outro",
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este ticket?")) return;
    await deleteTicket(id);
  };

  const filteredTickets = useMemo(() => {
    let filtered = tickets;
    
    if (!isAdmin) {
      filtered = tickets.filter((ticket) => ticket.email === user?.email);
    }

    return filtered.filter((ticket) => {
      const matchesSearch =
        ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "todos" || ticket.prioridade === priorityFilter;
      const matchesCategory = categoryFilter === "todos" || ticket.categoria === categoryFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, isAdmin, user?.email]);

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

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", flexWrap: "wrap", gap: "var(--space-md)" }}>
        <h2>{isAdmin ? "Chamados" : "Meus Chamados"}</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Chamado
        </button>
      </div>

      {isAdmin && (
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
                onChange={(e) => setStatusFilter(e.target.value as Status | "todos")}
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
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | "todos")}
                className="select-field"
                style={{ maxWidth: 200 }}
              >
                <option value="todos">Todas Prioridades</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select-field"
                style={{ maxWidth: 200 }}
              >
                <option value="todos">Todas Categorias</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="card" style={{ marginBottom: "var(--space-lg)", padding: "var(--space-lg)", background: "var(--color-surface-alt)" }}>
          <p style={{ marginBottom: "var(--space-sm)" }}>
            <strong>Visualize apenas os seus chamados.</strong>
          </p>
          <p style={{ fontSize: "0.9rem" }}>
            Para criar um novo chamado, clique no botão "Novo Chamado" acima.
          </p>
        </div>
      )}

      <p style={{ marginBottom: "var(--space-md)" }}>
        Mostrando <span style={{ fontWeight: 600 }}>{filteredTickets.length}</span> de{" "}
        <span style={{ fontWeight: 600 }}>{isAdmin ? tickets.length : filteredTickets.length}</span> chamados
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
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Nenhum chamado encontrado</h3>
          <p>Abra um novo chamado de suporte.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {filteredTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="card hover-lift" 
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-md)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-subtle)" }}>{ticket.id}</span>
                    <span className={`badge status-${ticket.status}`}>{statusLabels[ticket.status]}</span>
                    <span className={`badge priority-${ticket.prioridade}`}>{priorityLabels[ticket.prioridade]}</span>
                    <span className="badge" style={{ background: "var(--color-surface-alt)", color: "var(--color-text)" }}>{categoryLabels[ticket.categoria]}</span>
                  </div>
                  <h3 style={{ marginBottom: "var(--space-sm)" }}>{ticket.titulo}</h3>
                  <p style={{ marginBottom: "var(--space-md)", WebkitLineClamp: 2 }}>{ticket.descricao}</p>
                  <div style={{ display: "flex", gap: "var(--space-lg)", fontSize: "0.85rem", color: "var(--color-text-subtle)", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {ticket.solicitante}
                    </span>
                    <span>{ticket.departamento}</span>
                    <span>{new Date(ticket.dataAbertura).toLocaleDateString("pt-BR")}</span>
                    {ticket.comentarios && ticket.comentarios.length > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {ticket.comentarios.length}
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: isMobile ? "var(--space-sm)" : 0 }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)} 
                      className="btn-secondary" 
                      style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, ticket.id)} 
                      className="btn-secondary" 
                      style={{ padding: "6px 12px", fontSize: "0.85rem", color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Abrir Novo Chamado">
        <TicketForm onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
