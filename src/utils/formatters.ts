export const priorityLabels: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
  reaberto: "Reaberto",
};

export const categoryLabels: Record<string, string> = {
  hardware: "Hardware",
  software: "Software",
  rede: "Rede",
  email: "E-mail",
  impressora: "Impressora",
  sistema: "Sistema",
  acesso: "Acesso",
  outro: "Outro",
};

export const actionLabels: Record<string, { label: string; color: string }> = {
  CRIACAO: { label: "Criação", color: "var(--color-primary)" },
  MUDANCA_STATUS: { label: "Mudança de Status", color: "#b366ff" },
  FECHAMENTO: { label: "Fechamento", color: "var(--color-danger)" },
  REABERTURA: { label: "Reabertura", color: "#f5a623" },
  EDICAO: { label: "Edição", color: "var(--color-info)" },
  COMENTARIO: { label: "Comentário", color: "var(--color-text-subtle)" },
  EXCLUSAO: { label: "Exclusão", color: "var(--color-danger)" },
};

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR");
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("pt-BR");
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
