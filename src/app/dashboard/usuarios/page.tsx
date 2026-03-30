"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts";
import { Modal } from "@/components";

interface User {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "user";
  ativo: number;
  dataCriacao: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3080";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"todos" | "admin" | "user">("todos");

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    role: "user" as "admin" | "user",
    senha: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error("Erro ao carregar usuários");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Erro ao carregar usuários");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "todos" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome: user.nome,
        email: user.email,
        role: user.role,
        senha: "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome: "",
        email: "",
        role: "user",
        senha: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      nome: "",
      email: "",
      role: "user",
      senha: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const updateData: any = {
          nome: formData.nome,
          email: formData.email,
          role: formData.role,
          usuario: currentUser?.name,
        };
        if (formData.senha) {
          updateData.senha = formData.senha;
        }

        const res = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        if (!res.ok) throw new Error("Erro ao atualizar usuário");
      } else {
        const res = await fetch(`${API_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: formData.nome,
            email: formData.email,
            senha: formData.senha,
            role: formData.role,
            usuario: currentUser?.name,
          }),
        });
        if (!res.ok) throw new Error("Erro ao criar usuário");
      }

      await fetchUsers();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar usuário");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: newStatus, usuario: currentUser?.name }),
      });
      if (!res.ok) throw new Error("Erro ao alterar status");
      await fetchUsers();
    } catch (err) {
      alert("Erro ao alterar status do usuário");
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        const res = await fetch(`${API_URL}/api/users/${userId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario: currentUser?.name }),
        });
        if (!res.ok) throw new Error("Erro ao excluir usuário");
        await fetchUsers();
      } catch (err) {
        alert("Erro ao excluir usuário");
      }
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="fade-in">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          <svg
            style={{ width: 64, height: 64, margin: "0 auto var(--space-md)", opacity: 0.5 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Acesso Restrito</h3>
          <p>Esta página é apenas para administradores.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fade-in">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", flexWrap: "wrap", gap: "var(--space-md)" }}>
        <h2>Gerenciamento de Usuários</h2>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "var(--space-lg)", padding: "var(--space-md)", backgroundColor: "var(--color-danger)", color: "#fff" }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: "var(--space-lg)", padding: "var(--space-lg)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "var(--color-text-subtle)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "todos" | "admin" | "user")}
              className="select-field"
              style={{ maxWidth: 200 }}
            >
              <option value="todos">Todos os Papéis</option>
              <option value="admin">Administrador</option>
              <option value="user">Usuário</option>
            </select>
          </div>
        </div>
      </div>

      <p style={{ marginBottom: "var(--space-md)" }}>
        Mostrando <span style={{ fontWeight: 600 }}>{filteredUsers.length}</span> de{" "}
        <span style={{ fontWeight: 600 }}>{users.length}</span> usuários
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        {filteredUsers.map((user) => (
          <div key={user.id} className="card hover-lift">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: user.role === "admin" ? "var(--color-primary)" : "var(--color-surface-alt)" }}>
                  <span style={{ color: user.role === "admin" ? "#000" : "var(--color-text)", fontWeight: 700 }}>
                    {user.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <p style={{ fontWeight: 500, color: !user.ativo ? "var(--color-text-subtle)" : "var(--color-text)" }}>
                      {user.nome}
                    </p>
                    <span className={`badge ${user.role === "admin" ? "status-em_andamento" : "status-aberto"}`}>
                      {user.role === "admin" ? "Admin" : "Usuário"}
                    </span>
                    {!user.ativo && (
                      <span className="badge status-pendente">Inativo</span>
                    )}
                  </div>
                  <small style={{ color: "var(--color-text-subtle)" }}>
                    {user.email}
                  </small>
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <button onClick={() => handleOpenModal(user)} className="btn-secondary" style={{ padding: "8px 12px" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => toggleUserStatus(user.id, user.ativo)} className="btn-secondary" style={{ padding: "8px 12px" }}>
                  {user.ativo ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
                <button onClick={() => deleteUser(user.id)} className="btn-danger" style={{ padding: "8px 12px" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingUser ? "Editar Usuário" : "Novo Usuário"}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="input-field"
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="email@empresa.com"
              required
            />
          </div>

          {!editingUser && (
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="input-field"
                placeholder="••••••••"
                required={!editingUser}
              />
            </div>
          )}

          {editingUser && formData.senha && (
            <div className="form-group">
              <label className="form-label">Nova Senha (deixe em branco para manter)</label>
              <input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Papel</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "user" })}
              className="select-field"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-md)" }}>
            <button type="button" onClick={handleCloseModal} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {editingUser ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
