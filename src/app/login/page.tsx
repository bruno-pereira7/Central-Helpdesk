"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Erro ao fazer login");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Help Desk</h1>
        </div>

        <div className="card" style={{ padding: "var(--space-xl)" }}>
          <h2 style={{ marginBottom: "var(--space-lg)", textAlign: "center" }}>Entrar</h2>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-field ${error ? "error" : ""}`}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-field ${error ? "error" : ""}`}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ justifyContent: "center", marginTop: "var(--space-sm)" }}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
