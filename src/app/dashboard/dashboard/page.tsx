"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts";
import { api } from "@/services";
import { Ticket } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface Stats {
  total: number;
  aberto: number;
  emAndamento: number;
  resolvido: number;
  fechado: number;
}

const COLORS = ["#3ea6ff", "#b366ff", "#f5a623", "#1db954", "#6a6a6a"];

export default function DashboardGraphicsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    aberto: 0,
    emAndamento: 0,
    resolvido: 0,
    fechado: 0,
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      const result = await api.get<Ticket[]>("/tickets");
      if (result.data) {
        const userTickets = isAdmin 
          ? result.data 
          : result.data.filter((t) => t.email === user?.email);
        
        setTickets(userTickets);
        setStats({
          total: userTickets.length,
          aberto: userTickets.filter((t) => t.status === "aberto").length,
          emAndamento: userTickets.filter((t) => t.status === "em_andamento").length,
          resolvido: userTickets.filter((t) => t.status === "resolvido").length,
          fechado: userTickets.filter((t) => t.status === "fechado").length,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [isAdmin, user?.email]);

  const statusData = [
    { name: "Abertos", value: stats.aberto },
    { name: "Em Andamento", value: stats.emAndamento },
    { name: "Resolvidos", value: stats.resolvido },
    { name: "Fechados", value: stats.fechado },
  ];

  const priorityData = [
    { name: "Baixa", value: tickets.filter((t) => t.prioridade === "baixa").length },
    { name: "Média", value: tickets.filter((t) => t.prioridade === "media").length },
    { name: "Alta", value: tickets.filter((t) => t.prioridade === "alta").length },
    { name: "Crítica", value: tickets.filter((t) => t.prioridade === "critica").length },
  ];

  const categoryData = [
    { name: "Hardware", value: tickets.filter((t) => t.categoria === "hardware").length },
    { name: "Software", value: tickets.filter((t) => t.categoria === "software").length },
    { name: "Rede", value: tickets.filter((t) => t.categoria === "rede").length },
    { name: "Email", value: tickets.filter((t) => t.categoria === "email").length },
    { name: "Impressora", value: tickets.filter((t) => t.categoria === "impressora").length },
    { name: "Sistema", value: tickets.filter((t) => t.categoria === "sistema").length },
    { name: "Acesso", value: tickets.filter((t) => t.categoria === "acesso").length },
    { name: "Outro", value: tickets.filter((t) => t.categoria === "outro").length },
  ].filter((d) => d.value > 0);

  const monthlyData = tickets.reduce((acc: { name: string; tickets: number }[], ticket) => {
    const month = new Date(ticket.dataAbertura).toLocaleDateString("pt-BR", { month: "short" });
    const existing = acc.find((item) => item.name === month);
    if (existing) {
      existing.tickets++;
    } else {
      acc.push({ name: month, tickets: 1 });
    }
    return acc;
  }, []);

  const statCards = isAdmin
    ? [
        { label: "Total", value: stats.total, color: "var(--color-text-muted)" },
        { label: "Abertos", value: stats.aberto, color: "var(--color-info)" },
        { label: "Em Andamento", value: stats.emAndamento, color: "#b366ff" },
        { label: "Resolvidos", value: stats.resolvido, color: "var(--color-primary)" },
        { label: "Fechados", value: stats.fechado, color: "var(--color-text-subtle)" },
      ]
    : [
        { label: "Meus Total", value: stats.total, color: "var(--color-text-muted)" },
        { label: "Abertos", value: stats.aberto, color: "var(--color-info)" },
        { label: "Em Andamento", value: stats.emAndamento, color: "#b366ff" },
        { label: "Resolvidos", value: stats.resolvido, color: "var(--color-primary)" },
        { label: "Fechados", value: stats.fechado, color: "var(--color-text-subtle)" },
      ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
        <span className="loading-spinner" style={{ width: 40, height: 40, borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: "var(--space-xl)", fontSize: "1.75rem" }}>
        {isAdmin ? "Dashboard - Gráficos e Estatísticas" : "Meus Chamados - Estatísticas"}
      </h2>

      <div className="dashboard-grid" style={{ marginBottom: "var(--space-xl)" }}>
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card hover-lift">
            <div className="stat-icon" style={{ background: `${stat.color}20` }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: stat.color }}>{stat.value}</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, color: stat.color, fontSize: "2rem" }}>{stat.value}</p>
              <small style={{ fontSize: "0.95rem" }}>{stat.label}</small>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-md)" }}>Chamados por Status</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "var(--space-md)" }}>Chamados por Prioridade</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Bar dataKey="value" fill="#1db954" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-md)" }}>Chamados por Categoria</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" />
              <YAxis dataKey="name" type="category" stroke="#888" width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#3ea6ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "var(--space-md)" }}>Evolução de Chamados por Mês</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tickets" stroke="#b366ff" strokeWidth={2} dot={{ fill: "#b366ff" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {user?.role === "admin" && (
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-md)" }}>Resumo Geral</h3>
          <p>
            Total de <strong>{stats.total}</strong> chamados registrados no sistema.
            <br />
            <strong>{stats.aberto + stats.emAndamento}</strong> chamados estão em aberto ou em andamento.
            <br />
            <strong>{stats.resolvido + stats.fechado}</strong> chamados foram finalizados.
          </p>
        </div>
      )}
    </div>
  );
}
