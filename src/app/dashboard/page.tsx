"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts";
import { api } from "@/services";
import { Ticket } from "@/types";

interface Stats {
  total: number;
  aberto: number;
  emAndamento: number;
  resolvido: number;
  fechado: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, aberto: 0, emAndamento: 0, resolvido: 0, fechado: 0 });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      const result = await api.get<Ticket[]>("/tickets");
      if (result.data) {
        setTickets(result.data);
        setStats({
          total: result.data.length,
          aberto: result.data.filter((t) => t.status === "aberto").length,
          emAndamento: result.data.filter((t) => t.status === "em_andamento").length,
          resolvido: result.data.filter((t) => t.status === "resolvido").length,
          fechado: result.data.filter((t) => t.status === "fechado").length,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const userTickets = isAdmin ? tickets : tickets.filter((t) => t.email === user?.email);
  const userStats = {
    total: userTickets.length,
    aberto: userTickets.filter((t) => t.status === "aberto").length,
    emAndamento: userTickets.filter((t) => t.status === "em_andamento").length,
    resolvido: userTickets.filter((t) => t.status === "resolvido").length,
    fechado: userTickets.filter((t) => t.status === "fechado").length,
  };

  const statCards = isAdmin
    ? [
        { label: "Total", value: stats.total, color: "var(--color-text-muted)" },
        { label: "Abertos", value: stats.aberto, color: "var(--color-info)" },
        { label: "Em Andamento", value: stats.emAndamento, color: "#b366ff" },
        { label: "Resolvidos", value: stats.resolvido, color: "var(--color-primary)" },
        { label: "Fechados", value: stats.fechado, color: "var(--color-text-subtle)" },
      ]
    : [
        { label: "Meus Total", value: userStats.total, color: "var(--color-text-muted)" },
        { label: "Abertos", value: userStats.aberto, color: "var(--color-info)" },
        { label: "Em Andamento", value: userStats.emAndamento, color: "#b366ff" },
        { label: "Resolvidos", value: userStats.resolvido, color: "var(--color-primary)" },
        { label: "Fechados", value: userStats.fechado, color: "var(--color-text-subtle)" },
      ];

  return (
    <div className="fade-in">
      <div className="dashboard-grid">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card hover-lift">
            <div className="stat-icon" style={{ background: `${stat.color}20` }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: stat.color }}>{stat.value}</span>
            </div>
            <div>
              <p style={{ fontWeight: 500, color: stat.color }}>{stat.value}</p>
              <small>{stat.label}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", flexWrap: "wrap", gap: "var(--space-md)" }}>
          <h2>{isAdmin ? "Chamados Recentes" : "Meus Chamados Recentes"}</h2>
          <Link href="/dashboard/tickets" className="btn-primary">
            Ver Todos
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
            <span className="loading-spinner" style={{ width: 32, height: 32, borderTopColor: "var(--color-primary)" }} />
          </div>
        ) : userTickets.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>Nenhum chamado encontrado</p>
            {!isAdmin && (
              <Link href="/dashboard/tickets" className="btn-primary" style={{ marginTop: "var(--space-md)" }}>
                Criar Primeiro Chamado
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {userTickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-md)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-alt)",
                  gap: "var(--space-md)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={{ fontWeight: 500, marginBottom: "var(--space-xs)" }}>{ticket.titulo}</p>
                  <small>{ticket.id} • {ticket.solicitante}</small>
                </div>
                <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                  <span className={`badge status-${ticket.status}`}>{ticket.status.replace("_", " ")}</span>
                  <span className={`badge priority-${ticket.prioridade}`}>{ticket.prioridade}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-md)" }}>Acesso Rápido</h3>
          <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
            <Link href="/dashboard/dashboard" className="btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Gráficos
            </Link>
            <Link href="/dashboard/validacao" className="btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validar Criticidade
            </Link>
            <Link href="/dashboard/usuarios" className="btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Usuários
            </Link>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-md)" }}>Suas Permissões</h3>
          <p>Como usuário, você pode:</p>
          <ul style={{ marginTop: "var(--space-sm)", paddingLeft: "var(--space-lg)", color: "var(--color-text-muted)" }}>
            <li>Criar novos chamados de suporte</li>
            <li>Acompanhar o status dos seus chamados</li>
            <li>Visualizar o histórico dos seus chamados</li>
          </ul>
        </div>
      )}
    </div>
  );
}
