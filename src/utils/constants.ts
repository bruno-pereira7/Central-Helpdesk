export const COLORS = {
  primary: "var(--color-primary)",
  info: "var(--color-info)",
  success: "var(--color-primary)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  purple: "#b366ff",
  orange: "#f5a623",
};

export const PRIORITY_COLORS: Record<string, string> = {
  baixa: COLORS.primary,
  media: COLORS.warning,
  alta: COLORS.danger,
  critica: "#ff6b6b",
};

export const STATUS_COLORS: Record<string, string> = {
  aberto: COLORS.info,
  em_andamento: COLORS.purple,
  resolvido: COLORS.success,
  fechado: "var(--color-text-subtle)",
  reaberto: COLORS.orange,
};

export const NOTIFICATION_TYPES = {
  CHAT: "chat",
  STATUS: "status",
  CRIACAO: "criacao",
  COMENTARIO: "comentario",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export const API_ENDPOINTS = {
  TICKETS: "/tickets",
  TICKET_BY_ID: (id: string) => `/tickets/${id}`,
  COMMENTS: (id: string) => `/tickets/${id}/comments`,
  NOTIFICATIONS: "/notifications",
  LOGS: "/logs",
  EXPORT: "/export",
  IMPORT: "/import",
  ADMIN_SQL: "/admin/sql",
  ADMIN_SCHEMA: "/admin/schema",
} as const;
