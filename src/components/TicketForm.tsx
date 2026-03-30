"use client";

import { useState } from "react";
import { useTickets, useAuth } from "@/contexts";
import { Priority, Category } from "@/types";

interface TicketFormProps {
  onClose: () => void;
}

export default function TicketForm({ onClose }: TicketFormProps) {
  const { addTicket } = useTickets();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoria: "" as Category | "",
    prioridade: "" as Priority | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.titulo.trim()) newErrors.titulo = "Título é obrigatório";
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.categoria) newErrors.categoria = "Categoria é obrigatória";
    if (!formData.prioridade) newErrors.prioridade = "Prioridade é obrigatória";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      await addTicket({
        titulo: formData.titulo,
        descricao: formData.descricao,
        categoria: formData.categoria as Category,
        prioridade: formData.prioridade as Priority,
        solicitante: user?.name || "Usuário",
        email: user?.email || "usuario@empresa.com",
        departamento: "Geral",
        status: "aberto",
      });
      onClose();
    } catch {
      setErrors({ submit: "Erro ao criar chamado. Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <div className="form-group">
        <label className="form-label">Título do Chamado *</label>
        <input
          type="text"
          value={formData.titulo}
          onChange={(e) => handleChange("titulo", e.target.value)}
          placeholder="Descreva brevemente o problema"
          className={`input-field ${errors.titulo ? "error" : ""}`}
        />
        {errors.titulo && <p className="form-error">{errors.titulo}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Descrição do Problema *</label>
        <textarea
          value={formData.descricao}
          onChange={(e) => handleChange("descricao", e.target.value)}
          placeholder="Descreva detalhadamente o problema..."
          rows={4}
          className={`input-field ${errors.descricao ? "error" : ""}`}
          style={{ resize: "none" }}
        />
        {errors.descricao && <p className="form-error">{errors.descricao}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-md)" }}>
        <div className="form-group">
          <label className="form-label">Categoria *</label>
          <select
            value={formData.categoria}
            onChange={(e) => handleChange("categoria", e.target.value)}
            className={`select-field ${errors.categoria ? "error" : ""}`}
          >
            <option value="">Selecione...</option>
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="rede">Rede</option>
            <option value="email">E-mail</option>
            <option value="impressora">Impressora</option>
            <option value="sistema">Sistema</option>
            <option value="acesso">Acesso</option>
            <option value="outro">Outro</option>
          </select>
          {errors.categoria && <p className="form-error">{errors.categoria}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Prioridade *</label>
          <select
            value={formData.prioridade}
            onChange={(e) => handleChange("prioridade", e.target.value)}
            className={`select-field ${errors.prioridade ? "error" : ""}`}
          >
            <option value="">Selecione...</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
          {errors.prioridade && <p className="form-error">{errors.prioridade}</p>}
        </div>
      </div>

      <div style={{ padding: "var(--space-md)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-sm)" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-subtle)", margin: 0 }}>
          <strong>Você:</strong> {user?.name} ({user?.email})
        </p>
      </div>

      {errors.submit && <p className="form-error">{errors.submit}</p>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-md)", paddingTop: "var(--space-md)", borderTop: "1px solid var(--color-border)" }}>
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? (
            <>
              <span className="loading-spinner" />
              Enviando...
            </>
          ) : (
            "Abrir Chamado"
          )}
        </button>
      </div>
    </form>
  );
}
