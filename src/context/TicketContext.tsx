"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Ticket } from "@/types";
import { api } from "@/services";

interface TicketContextType {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  addTicket: (ticket: Omit<Ticket, "id" | "dataAbertura" | "dataAtualizacao" | "comentarios">) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  getTicketById: (id: string) => Ticket | undefined;
  refreshTickets: () => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTickets = useCallback(async () => {
    const result = await api.get<Ticket[]>("/tickets");
    
    if (result.error) {
      setError(result.error);
      setTickets([]);
    } else if (result.data) {
      setTickets(result.data);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshTickets();
  }, []);

  const addTicket = async (ticketData: Omit<Ticket, "id" | "dataAbertura" | "dataAtualizacao" | "comentarios">) => {
    const result = await api.post<Ticket>("/tickets", ticketData);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (result.data) {
      setTickets((prev) => [result.data!, ...prev]);
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    const result = await api.put<Ticket>(`/tickets/${id}`, updates);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (result.data) {
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === id ? result.data! : ticket))
      );
    }
  };

  const deleteTicket = async (id: string) => {
    const result = await api.delete(`/tickets/${id}`);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  };

  const getTicketById = (id: string) => {
    return tickets.find((ticket) => ticket.id === id);
  };

  return (
    <TicketContext.Provider
      value={{ tickets, loading, error, addTicket, updateTicket, deleteTicket, getTicketById, refreshTickets }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error("useTickets must be used within a TicketProvider");
  }
  return context;
}
