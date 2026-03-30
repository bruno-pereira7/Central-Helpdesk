import express from "express";
import cors from "cors";
import { ticketStore } from "./store.js";
const app = express();
const PORT = parseInt(process.env.PORT || "3080", 10);
const HOST = process.env.HOST || "0.0.0.0";
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
});
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.post("/api/auth/login", (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: "E-mail e senha são obrigatórios" });
        }
        const user = ticketStore.authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({ success: false, error: "E-mail ou senha incorretos" });
        }
        res.json({ success: true, user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Erro ao fazer login" });
    }
});
app.get("/api/tickets", (_req, res) => {
    try {
        const tickets = ticketStore.getAll();
        res.json(tickets);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar tickets" });
    }
});
app.get("/api/tickets/:id", (req, res) => {
    try {
        const ticket = ticketStore.getById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket não encontrado" });
        }
        res.json(ticket);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar ticket" });
    }
});
app.post("/api/tickets", (req, res) => {
    try {
        const data = req.body;
        const ticketData = {
            titulo: data.titulo,
            descricao: data.descricao,
            categoria: data.categoria,
            prioridade: data.prioridade,
            solicitante: data.solicitante || "Usuário",
            email: data.email || "usuario@empresa.com",
            departamento: data.departamento || "Geral",
        };
        if (!ticketData.titulo || !ticketData.descricao || !ticketData.categoria || !ticketData.prioridade) {
            return res.status(400).json({ error: "Título, descrição, categoria e prioridade são obrigatórios" });
        }
        const ticket = ticketStore.create(ticketData);
        res.status(201).json(ticket);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao criar ticket" });
    }
});
app.put("/api/tickets/:id", (req, res) => {
    try {
        const data = req.body;
        const ticket = ticketStore.update(req.params.id, data);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket não encontrado" });
        }
        res.json(ticket);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao atualizar ticket" });
    }
});
app.delete("/api/tickets/:id", (req, res) => {
    try {
        const deleted = ticketStore.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Ticket não encontrado" });
        }
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao deletar ticket" });
    }
});
app.post("/api/tickets/:id/comments", (req, res) => {
    try {
        const { autor, conteudo } = req.body;
        if (!autor || !conteudo) {
            return res.status(400).json({ error: "Autor e conteúdo são obrigatórios" });
        }
        const ticket = ticketStore.addComment(req.params.id, autor, conteudo);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket não encontrado" });
        }
        res.status(201).json(ticket);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao adicionar comentário" });
    }
});
app.get("/api/export", (_req, res) => {
    try {
        const data = ticketStore.exportData();
        res.setHeader("Content-Disposition", `attachment; filename=helpdesk-backup-${new Date().toISOString().split("T")[0]}.json`);
        res.setHeader("Content-Type", "application/json");
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao exportar dados" });
    }
});
app.post("/api/import", (req, res) => {
    try {
        const data = req.body;
        if (!data.tickets || !Array.isArray(data.tickets)) {
            return res.status(400).json({ error: "Formato inválido. Esperado objeto com array de tickets." });
        }
        const result = ticketStore.importData(data);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao importar dados" });
    }
});
app.post("/api/admin/sql", (req, res) => {
    try {
        const { sql } = req.body;
        if (!sql || typeof sql !== "string") {
            return res.status(400).json({ error: "SQL é obrigatório" });
        }
        const normalizedSql = sql.trim().toLowerCase();
        if (normalizedSql.startsWith("select")) {
            const result = ticketStore.executeQuery(sql);
            res.json({ success: true, data: result });
        }
        else {
            const result = ticketStore.executeWrite(sql);
            res.json({ success: true, changes: result.changes });
        }
    }
    catch (error) {
        res.status(500).json({ error: `Erro ao executar SQL: ${error}` });
    }
});
app.get("/api/admin/schema", (_req, res) => {
    try {
        const schema = ticketStore.getSchema();
        res.json(schema);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar schema" });
    }
});
app.get("/api/logs", (req, res) => {
    try {
        const ticketId = req.query.ticketId;
        const logs = ticketStore.getLogs(ticketId);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar logs" });
    }
});
app.get("/api/notifications", (req, res) => {
    try {
        const usuario = req.query.usuario;
        if (!usuario) {
            return res.status(400).json({ error: "Usuário é obrigatório" });
        }
        const notificacoes = ticketStore.getNotificacoes(usuario);
        res.json(notificacoes);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar notificações" });
    }
});
app.put("/api/notifications/:id", (req, res) => {
    try {
        const { lida } = req.body;
        if (lida) {
            ticketStore.markNotificacaoLida(req.params.id);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao atualizar notificação" });
    }
});
app.put("/api/notifications/read-all", (req, res) => {
    try {
        const { usuario } = req.body;
        if (usuario) {
            ticketStore.markAllNotificacoesLidas(usuario);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao marcar notificações como lidas" });
    }
});
const server = app.listen(PORT, HOST, () => {
    const localUrl = `http://localhost:${PORT}`;
    console.log(`\n🚀 Help Desk API Server running on ${localUrl}`);
    console.log(`📋 Health check: ${localUrl}/api/health`);
    console.log(`📝 Tickets API: ${localUrl}/api/tickets`);
    console.log(`💾 Export: ${localUrl}/api/export`);
    console.log(`📥 Import: POST ${localUrl}/api/import`);
    console.log(`🌐 Para acesso em rede: Use o IP do computador na rede local\n`);
});
process.on("SIGINT", () => {
    console.log("\n🛑 Encerrando servidor...");
    ticketStore.close();
    server.close(() => {
        process.exit(0);
    });
});
