"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, useTickets } from "@/contexts";
import { api } from "@/services";
import { Ticket, Priority, Status } from "@/types";
import { useDevice } from "@/hooks";

const priorityLabels: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
  reaberto: "Reaberto",
};

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

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { refreshTickets, updateTicket, deleteTicket } = useTickets();
  const { isMobile } = useDevice();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Ticket>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin";
  const isOwner = ticket?.email === user?.email;

  useEffect(() => {
    const fetchTicket = async () => {
      const result = await api.get<Ticket>(`/tickets/${id}`);
      if (result.data) {
        setTicket(result.data);
        setEditData(result.data);
      }
      setLoading(false);
    };
    if (id) fetchTicket();
  }, [id]);

  useEffect(() => {
    const refreshChat = async () => {
      if (!id) return;
      const result = await api.get<Ticket>(`/tickets/${id}`);
      if (result.data) {
        setTicket(result.data);
      }
    };

    const interval = setInterval(refreshChat, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.comentarios]);

  const sendMessage = async () => {
    if (!message.trim() || message.length > 300) return;
    setSendingMessage(true);

    const result = await api.post<Ticket>(`/tickets/${id}/comments`, {
      autor: user?.name || "Usuário",
      conteudo: message.trim(),
    });

    if (result.data) {
      setTicket(result.data);
      setMessage("");
    }
    setSendingMessage(false);
  };

  const handleCloseTicket = async () => {
    if (!confirm("Deseja fechar este ticket? Ele não poderá mais receber mensagens.")) return;
    
    await updateTicket(id as string, { status: "fechado" });
    const result = await api.get<Ticket>(`/tickets/${id}`);
    if (result.data) setTicket(result.data);
  };

  const handleReopenTicket = async () => {
    if (!confirm("Deseja reabrir este ticket? Ele voltará para a fila de atendimento.")) return;
    await updateTicket(id as string, { status: "reaberto" });
    const result = await api.get<Ticket>(`/tickets/${id}`);
    if (result.data) setTicket(result.data);
  };

  const handleSaveEdit = async () => {
    await updateTicket(id as string, editData);
    setEditing(false);
    const result = await api.get<Ticket>(`/tickets/${id}`);
    if (result.data) setTicket(result.data);
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este ticket?")) return;
    await deleteTicket(id as string);
    router.push("/dashboard/tickets");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
        <span className="loading-spinner" style={{ width: 40, height: 40, borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="fade-in">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          <h3>Ticket não encontrado</h3>
          <button onClick={() => router.push("/dashboard/tickets")} className="btn-primary" style={{ marginTop: "var(--space-md)" }}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "var(--space-lg)", display: "flex", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap" }}>
        <button onClick={() => router.push("/dashboard/tickets")} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-subtle)" }}>{ticket.id}</span>
        <span className={`badge status-${ticket.status}`}>{statusLabels[ticket.status]}</span>
        <span className={`badge priority-${ticket.prioridade}`}>{priorityLabels[ticket.prioridade]}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 400px", gap: "var(--space-lg)" }}>
        <div>
          <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                <div className="form-group">
                  <label className="form-label">Título</label>
                  <input
                    type="text"
                    value={editData.titulo || ""}
                    onChange={(e) => setEditData({ ...editData, titulo: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea
                    value={editData.descricao || ""}
                    onChange={(e) => setEditData({ ...editData, descricao: e.target.value })}
                    className="input-field"
                    rows={4}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select
                      value={editData.categoria || ""}
                      onChange={(e) => setEditData({ ...editData, categoria: e.target.value as Ticket["categoria"] })}
                      className="select-field"
                    >
                      {Object.keys(categoryLabels).map((cat) => (
                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prioridade</label>
                    <select
                      value={editData.prioridade || ""}
                      onChange={(e) => setEditData({ ...editData, prioridade: e.target.value as Priority })}
                      className="select-field"
                    >
                      {Object.keys(priorityLabels).map((p) => (
                        <option key={p} value={p}>{priorityLabels[p]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {isAdmin && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={editData.status || ""}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as Status })}
                      className="select-field"
                    >
                      {Object.keys(statusLabels).map((s) => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: "flex", gap: "var(--space-md)" }}>
                  <button onClick={handleSaveEdit} className="btn-primary">Salvar</button>
                  <button onClick={() => { setEditing(false); setEditData(ticket); }} className="btn-secondary">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-md)" }}>
                  <h2 style={{ margin: 0 }}>{ticket.titulo}</h2>
                  {isAdmin && (
                    <button onClick={() => setEditing(true)} className="btn-secondary" style={{ padding: "4px 8px" }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p style={{ whiteSpace: "pre-wrap", marginBottom: "var(--space-lg)" }}>{ticket.descricao}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-md)", fontSize: "0.9rem" }}>
                  <div>
                    <strong>Solicitante:</strong>
                    <p>{ticket.solicitante}</p>
                  </div>
                  <div>
                    <strong>E-mail:</strong>
                    <p>{ticket.email}</p>
                  </div>
                  <div>
                    <strong>Departamento:</strong>
                    <p>{ticket.departamento}</p>
                  </div>
                  <div>
                    <strong>Categoria:</strong>
                    <p>{categoryLabels[ticket.categoria]}</p>
                  </div>
                  <div>
                    <strong>Abertura:</strong>
                    <p>{new Date(ticket.dataAbertura).toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <strong>Última atualização:</strong>
                    <p>{new Date(ticket.dataAtualizacao).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                {ticket.parecerAdmin && (
                  <div style={{ marginTop: "var(--space-lg)", padding: "var(--space-md)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-sm)" }}>
                    <strong>Parecer do Admin:</strong>
                    <p>{ticket.parecerAdmin}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {(isAdmin || isOwner) && ticket.status !== "fechado" && (
            <div style={{ display: "flex", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
              <button onClick={handleCloseTicket} className="btn-primary" style={{ background: "var(--color-danger)" }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Fechar Ticket
              </button>
              {isAdmin && (
                <button onClick={handleDelete} className="btn-secondary" style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}>
                  Excluir
                </button>
              )}
            </div>
          )}

          {ticket.status === "fechado" && (isAdmin || isOwner) && (
            <button onClick={handleReopenTicket} className="btn-primary" style={{ marginBottom: "var(--space-lg)" }}>
              Reabrir Ticket
            </button>
          )}
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", height: isMobile ? "400px" : "calc(100vh - 200px)", minHeight: "400px" }}>
          <h3 style={{ marginBottom: "var(--space-md)" }}>Mensagens</h3>
          
          <div style={{ flex: 1, overflowY: "auto", marginBottom: "var(--space-md)", padding: "var(--space-sm)", background: "var(--color-bg)", borderRadius: "var(--radius-sm)" }}>
            {ticket.comentarios?.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--color-text-subtle)", padding: "var(--space-lg)" }}>
                Nenhuma mensagem ainda. Seja o primeiro a comentar!
              </p>
            ) : (
              ticket.comentarios?.map((comment) => (
                <div key={comment.id} style={{ marginBottom: "var(--space-md)", padding: "var(--space-sm)", background: "var(--color-surface)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--color-primary)" }}>{comment.autor}</strong>
                    <small style={{ color: "var(--color-text-subtle)" }}>{new Date(comment.data).toLocaleString("pt-BR")}</small>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9rem", wordBreak: "break-word" }}>{comment.conteudo}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {ticket.status !== "fechado" ? (
            <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                  placeholder="Digite sua mensagem (máx 300 caracteres)"
                  rows={2}
                  className="input-field"
                  style={{ resize: "none", width: "100%" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <small style={{ color: "var(--color-text-subtle)" }}>{message.length}/300</small>
              </div>
              <button onClick={sendMessage} disabled={sendingMessage || !message.trim()} className="btn-primary" style={{ padding: "8px 16px" }}>
                {sendingMessage ? "Enviando..." : "Enviar"}
              </button>
            </div>
          ) : (
            <div style={{ padding: "var(--space-md)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
              <p style={{ margin: 0, color: "var(--color-text-subtle)" }}>Este ticket está fechado. Não é possível enviar mensagens.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
