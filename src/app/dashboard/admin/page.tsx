"use client";

import { useState } from "react";
import { useAuth } from "@/contexts";
import { api } from "@/services";
import { useDevice } from "@/hooks";

interface SqlResult {
  success: boolean;
  data?: unknown[];
  changes?: number;
  error?: string;
}

interface TableSchema {
  name: string;
  columns: {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState<"sql" | "schema">("sql");
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [schema, setSchema] = useState<Record<string, TableSchema> | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  if (user?.role !== "admin") {
    return (
      <div className="fade-in">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          <svg style={{ width: 64, height: 64, margin: "0 auto var(--space-md)", opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>Acesso Restrito</h3>
          <p>Esta página é apenas para administradores.</p>
        </div>
      </div>
    );
  }

  const executeSql = async () => {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    setSqlResult(null);

    const result = await api.post<SqlResult>("/admin/sql", { sql: sqlQuery });
    setSqlResult(result.data || { success: false, error: result.error });
    setSqlLoading(false);
  };

  const loadSchema = async () => {
    setSchemaLoading(true);
    const result = await api.get<Record<string, TableSchema>>("/admin/schema");
    if (result.data) {
      setSchema(result.data);
    }
    setSchemaLoading(false);
  };

  const tabStyle = (tab: "sql" | "schema") => ({
    padding: isMobile ? "var(--space-sm) var(--space-md)" : "var(--space-md) var(--space-lg)",
    background: activeTab === tab ? "var(--color-primary)" : "transparent",
    color: activeTab === tab ? "white" : "var(--color-text)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer" as const,
    fontWeight: 500,
    fontSize: isMobile ? "0.85rem" : "1rem",
    transition: "all 0.2s",
  });

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: "var(--space-lg)" }}>Administração</h2>

      <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("sql")} style={tabStyle("sql")}>
          SQL Explorer
        </button>
        <button onClick={() => { setActiveTab("schema"); if (!schema) loadSchema(); }} style={tabStyle("schema")}>
          Dicionário de Dados
        </button>
      </div>

      {activeTab === "sql" && (
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-md)" }}>Executar SQL</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-subtle)", marginBottom: "var(--space-md)" }}>
            Execute consultas SQL diretamente no banco de dados. Use SELECT para consultas e INSERT/UPDATE/DELETE para modificações.
          </p>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="SELECT * FROM tickets LIMIT 10"
            style={{
              width: "100%",
              minHeight: "150px",
              padding: "var(--space-md)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text)",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              resize: "vertical",
            }}
          />
          <div style={{ marginTop: "var(--space-md)", display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
            <button
              onClick={executeSql}
              disabled={sqlLoading || !sqlQuery.trim()}
              className="btn-primary"
            >
              {sqlLoading ? "Executando..." : "Executar"}
            </button>
            <button
              onClick={() => { setSqlQuery("SELECT * FROM tickets LIMIT 10"); }}
              className="btn-secondary"
            >
              Exemplo: SELECT
            </button>
            <button
              onClick={() => { setSqlQuery("SELECT * FROM comentarios LIMIT 10"); }}
              className="btn-secondary"
            >
              Exemplo: Comentários
            </button>
            <button
              onClick={() => { setSqlQuery("SELECT COUNT(*) as total FROM tickets"); }}
              className="btn-secondary"
            >
              Exemplo: Contagem
            </button>
          </div>

          {sqlResult && (
            <div style={{ marginTop: "var(--space-lg)" }}>
              {sqlResult.error ? (
                <div style={{ padding: "var(--space-md)", background: "var(--color-danger)20", borderRadius: "var(--radius-sm)", color: "var(--color-danger)" }}>
                  <strong>Erro:</strong> {sqlResult.error}
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: "var(--space-sm)", color: "var(--color-primary)" }}>
                    {sqlResult.data ? `${sqlResult.data.length} registros encontrados` : `${sqlResult.changes} registro(s) afetado(s)`}
                  </p>
                  {sqlResult.data && sqlResult.data.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr>
                            {Object.keys(sqlResult.data[0] as object).map((key) => (
                              <th key={key} style={{ padding: "var(--space-sm)", textAlign: "left", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)" }}>
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResult.data.map((row: unknown, idx: number) => (
                            <tr key={idx}>
                              {Object.values(row as object).map((value: unknown, vIdx: number) => (
                                <td key={vIdx} style={{ padding: "var(--space-sm)", borderBottom: "1px solid var(--color-border)" }}>
                                  {String(value ?? "").substring(0, 100)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "schema" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", flexWrap: "wrap", gap: "var(--space-md)" }}>
            <h3>Dicionário de Dados</h3>
            <button onClick={loadSchema} disabled={schemaLoading} className="btn-secondary">
              {schemaLoading ? "Carregando..." : "Atualizar"}
            </button>
          </div>

          {schema && Object.entries(schema).map(([tableName, tableInfo]) => (
            <div key={tableName} style={{ marginBottom: "var(--space-xl)" }}>
              <h4 style={{ marginBottom: "var(--space-md)", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                {tableName}
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "var(--space-sm)", textAlign: "left", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)", width: "20%" }}>Campo</th>
                      <th style={{ padding: "var(--space-sm)", textAlign: "left", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)", width: "15%" }}>Tipo</th>
                      <th style={{ padding: "var(--space-sm)", textAlign: "left", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)", width: "10%" }}>PK</th>
                      <th style={{ padding: "var(--space-sm)", textAlign: "left", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)", width: "10%" }}>Not Null</th>
                      <th style={{ padding: "var(--space-sm)", textAlign: "left", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)", width: "45%" }}>Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableInfo.columns.map((col) => (
                      <tr key={col.name}>
                        <td style={{ padding: "var(--space-sm)", borderBottom: "1px solid var(--color-border)", fontFamily: "monospace" }}>
                          <strong>{col.name}</strong>
                        </td>
                        <td style={{ padding: "var(--space-sm)", borderBottom: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
                          {col.type}
                        </td>
                        <td style={{ padding: "var(--space-sm)", borderBottom: "1px solid var(--color-border)" }}>
                          {col.pk ? "✓" : ""}
                        </td>
                        <td style={{ padding: "var(--space-sm)", borderBottom: "1px solid var(--color-border)" }}>
                          {col.notnull ? "✓" : ""}
                        </td>
                        <td style={{ padding: "var(--space-sm)", borderBottom: "1px solid var(--color-border)", fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {col.dflt_value ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
