"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/services";
import { useAuth } from "@/contexts";

export interface Notification {
  id: string;
  tipo: "chat" | "status" | "criacao" | "comentario";
  titulo: string;
  mensagem: string;
  ticketId?: string;
  lida: boolean;
  data: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, "id" | "lida" | "data">) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    const result = await api.get<Notification[]>(`/notifications?usuario=${encodeURIComponent(user.email)}`);
    if (result.data) {
      const sorted = result.data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setNotifications(sorted);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  const markAsRead = async (id: string) => {
    await api.put(`/notifications/${id}`, { lida: true });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (user) {
      await api.put("/notifications/read-all", { usuario: user.email });
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const addNotification = (notification: Omit<Notification, "id" | "lida" | "data">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      lida: false,
      data: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
