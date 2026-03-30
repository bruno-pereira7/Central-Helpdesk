"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts";

interface Message {
  id: string;
  autor: string;
  destinatario: string;
  conteudo: string;
  data: string;
  isOwn: boolean;
}

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080";

export default function FloatingChat() {
  const { user: currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter((u: User) => u.id !== currentUser?.id));
      }
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    }
  };

  const fetchAllUnreadCounts = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/unread?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCounts(data);
      }
    } catch (err) {
      console.error("Erro ao buscar contagens:", err);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser || !currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/messages?de=${encodeURIComponent(currentUser.email)}&para=${encodeURIComponent(selectedUser.email)}`
      );
      if (res.ok) {
        const data = await res.json();
        const msgs = (data || []).map((m: any) => ({
          ...m,
          isOwn: m.autor === currentUser.email,
        }));
        setMessages(msgs);
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchAllUnreadCounts();
      
      const eventSource = new EventSource(`${API_URL}/api/events?email=${encodeURIComponent(currentUser?.email || "")}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_message") {
          fetchAllUnreadCounts();
          if (selectedUser && data.message.autor === selectedUser.email) {
            fetchMessages();
          }
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
      };
      
      return () => eventSource.close();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (isOpen && selectedUser) {
      fetchMessages();
      fetch(`${API_URL}/api/messages/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          de: currentUser?.email,
          para: selectedUser.email,
        }),
      }).then(() => {
        setUnreadCounts(prev => ({ ...prev, [selectedUser.email]: 0 }));
      });
    }
  }, [isOpen, selectedUser, currentUser]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    setSending(true);
    const tempMessage: Message = {
      id: Date.now().toString(),
      autor: currentUser.email,
      destinatario: selectedUser.email,
      conteudo: newMessage,
      data: new Date().toISOString(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autor: currentUser.email,
          destinatario: selectedUser.email,
          conteudo: messageToSend,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao enviar");
      }

      await fetchMessages();
      setUnreadCounts(prev => ({ ...prev, [selectedUser.email]: 0 }));
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      alert("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (data: string) => {
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (!currentUser) return null;

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const groupedMessages = messages.reduce((groups: { date: string; messages: Message[] }[], msg) => {
    const date = formatDate(msg.data);
    const existingGroup = groups.find(g => g.date === date);
    const autorNome = users.find(u => u.email === msg.autor)?.nome || msg.autor;
    if (existingGroup) {
      existingGroup.messages.push({ ...msg, autor: autorNome });
    } else {
      groups.push({ date, messages: [{ ...msg, autor: autorNome }] });
    }
    return groups;
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "var(--color-primary)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          zIndex: 1000,
        }}
      >
        {isOpen ? (
          <svg width="24" height="24" fill="none" stroke="#000" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="28" height="28" fill="none" stroke="#000" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {totalUnread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "2px solid var(--color-surface)",
            }}
          >
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 420,
            height: 600,
            background: "var(--color-surface)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              padding: "var(--space-md)",
              background: "var(--color-primary)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#000", fontWeight: 600 }}>Chat Direto</h3>
              <small style={{ color: "#333" }}>Selecione um usuário para conversar</small>
            </div>
            {totalUnread > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>

          <div style={{ padding: "var(--space-sm)", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)" }}>
            <select
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const user = users.find((u) => u.id === e.target.value);
                setSelectedUser(user || null);
                setMessages([]);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: "0.9rem",
              }}
            >
              <option value="">Selecione um usuário...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nome} ({user.role === "admin" ? "Admin" : "Usuário"}){unreadCounts[user.email] > 0 ? ` (${unreadCounts[user.email]})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "var(--space-md)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
              background: "var(--color-bg)",
            }}
          >
            {!selectedUser ? (
              <div style={{ textAlign: "center", color: "var(--color-text-subtle)", marginTop: 60 }}>
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: "0 auto 16px", opacity: 0.4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p style={{ fontSize: "1rem" }}>Selecione um usuário para iniciar a conversa</p>
              </div>
            ) : loading && messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--color-text-subtle)", marginTop: 60 }}>
                Carregando mensagens...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--color-text-subtle)", marginTop: 60 }}>
                <p>Nenhuma mensagem ainda.</p>
                <p style={{ fontSize: "0.9rem" }}>Envie uma mensagem para iniciar a conversa!</p>
              </div>
            ) : (
              <>
                {groupedMessages.map((group) => (
                  <div key={group.date}>
                    <div style={{ textAlign: "center", margin: "16px 0 8px" }}>
                      <span style={{ 
                        background: "var(--color-surface-alt)", 
                        padding: "4px 12px", 
                        borderRadius: 12, 
                        fontSize: "0.75rem",
                        color: "var(--color-text-subtle)"
                      }}>
                        {group.date}
                      </span>
                    </div>
                    {group.messages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: msg.isOwn ? "flex-end" : "flex-start",
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "75%",
                            padding: "10px 14px",
                            borderRadius: 16,
                            background: msg.isOwn ? "var(--color-primary)" : "var(--color-surface)",
                            color: msg.isOwn ? "#000" : "var(--color-text)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            borderBottomRightRadius: msg.isOwn ? 4 : 16,
                            borderBottomLeftRadius: msg.isOwn ? 16 : 4,
                          }}
                        >
                          {!msg.isOwn && (
                            <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-primary)" }}>
                              {msg.autor}
                            </p>
                          )}
                          <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.4 }}>{msg.conteudo}</p>
                          <small style={{ opacity: 0.6, fontSize: "0.7rem", display: "block", marginTop: 4, textAlign: "right" }}>
                            {formatTime(msg.data)}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedUser && (
            <div
              style={{
                padding: "var(--space-md)",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                gap: "var(--space-sm)",
                background: "var(--color-surface)",
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !sending && handleSendMessage()}
                placeholder={`Mensagem para ${selectedUser.nome}...`}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 24,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-alt)",
                  color: "var(--color-text)",
                  fontSize: "0.9rem",
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "none",
                  background: newMessage.trim() && !sending ? "var(--color-primary)" : "var(--color-surface-alt)",
                  color: newMessage.trim() && !sending ? "#000" : "var(--color-text-subtle)",
                  cursor: newMessage.trim() && !sending ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {sending ? (
                  <div style={{ width: 18, height: 18, border: "2px solid var(--color-text-subtle)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
