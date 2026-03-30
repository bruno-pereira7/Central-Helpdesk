export type Priority = "baixa" | "media" | "alta" | "critica";
export type Status = "aberto" | "em_andamento" | "resolvido" | "fechado" | "reaberto";
export type Category = 
  | "hardware" 
  | "software" 
  | "rede" 
  | "email" 
  | "impressora" 
  | "sistema" 
  | "acesso" 
  | "outro";

export interface Comment {
  id: string;
  autor: string;
  conteudo: string;
  data: string;
}

export interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Category;
  prioridade: Priority;
  status: Status;
  solicitante: string;
  email: string;
  departamento: string;
  dataAbertura: string;
  dataAtualizacao: string;
  comentarios: Comment[];
  parecerAdmin?: string;
  criticidadeFinal?: Priority;
}

export interface CreateTicketDTO {
  titulo: string;
  descricao: string;
  categoria: Category;
  prioridade: Priority;
  solicitante: string;
  email: string;
  departamento: string;
}

export interface UpdateTicketDTO {
  titulo?: string;
  descricao?: string;
  categoria?: Category;
  prioridade?: Priority;
  status?: Status;
  solicitante?: string;
  email?: string;
  departamento?: string;
  comentarios?: Comment[];
  parecerAdmin?: string;
  criticidadeFinal?: Priority;
}
