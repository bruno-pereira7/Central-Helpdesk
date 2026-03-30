"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, useAuth } from "@/contexts";
import { useDevice } from "@/hooks";

export default function NotificacoesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, unreadCount, refreshNotifications } = useNotifications();
  const { isMobile } = useDevice();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "chat":
        return (
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(62, 166, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke="var(--color-info)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case "status":
        return (
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(179, 102, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke="#b366ff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case "criacao":
        return (
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(29, 185, 84, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke="var(--color-primary)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case "comentario":
        return (
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245, 166, 35, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke="#f5a623" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        );
      default:
        return (
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(106, 106, 106, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke="var(--color-text-subtle)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.lida) {
      markAsRead(notification.id);
    }
    if (notification.ticketId) {
      router.push(`/dashboard/tickets/${notification.ticketId}`);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", flexWrap: "wrap", gap: "var(--space-md)" }}>
        <h2>Notificações</h2>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 64, height: 64, opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Nenhuma notificação</h3>
          <p>Você receberá notificações aqui quando houver novas mensagens ou atualizações.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="card hover-lift"
              style={{
                cursor: "pointer",
                opacity: notification.lida ? 0.7 : 1,
                background: notification.lida ? "var(--color-surface)" : "var(--color-surface-alt)",
                borderLeft: notification.lida ? "none" : "3px solid var(--color-primary)",
              }}
            >
              <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "flex-start" }}>
                {getIcon(notification.tipo)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <p style={{ fontWeight: notification.lida ? 400 : 600, fontSize: "0.95rem", margin: 0 }}>
                      {notification.titulo}
                    </p>
                    {!notification.lida && (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-subtle)", margin: 0, marginBottom: "var(--space-xs)" }}>
                    {notification.mensagem}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-subtle)", margin: 0 }}>
                    {new Date(notification.data).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
