import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "helpdesk.db");
class TicketStore {
    db;
    counter = 0;
    constructor() {
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        this.db = new Database(DB_PATH);
        this.db.pragma("journal_mode = WAL");
        this.initializeTables();
        this.initializeCounter();
    }
    initializeTables() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        ativo INTEGER DEFAULT 1,
        dataCriacao TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        categoria TEXT NOT NULL,
        prioridade TEXT NOT NULL,
        status TEXT NOT NULL,
        solicitante TEXT NOT NULL,
        email TEXT NOT NULL,
        departamento TEXT NOT NULL,
        dataAbertura TEXT NOT NULL,
        dataAtualizacao TEXT NOT NULL,
        parecerAdmin TEXT,
        criticidadeFinal TEXT
      );

      CREATE TABLE IF NOT EXISTS comentarios (
        id TEXT PRIMARY KEY,
        ticketId TEXT NOT NULL,
        autor TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS counter (
        id INTEGER PRIMARY KEY DEFAULT 1,
        value INTEGER DEFAULT 6
      );

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        ticketId TEXT NOT NULL,
        acao TEXT NOT NULL,
        descricao TEXT NOT NULL,
        usuario TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notificacoes (
        id TEXT PRIMARY KEY,
        tipo TEXT NOT NULL,
        titulo TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        ticketId TEXT,
        usuario TEXT NOT NULL,
        lida INTEGER DEFAULT 0,
        data TEXT NOT NULL
      );
    `);
        this.initializeDefaultUsers();
    }
    initializeDefaultUsers() {
        const count = this.db.prepare("SELECT COUNT(*) as count FROM usuarios").get();
        if (count.count > 0)
            return;
        const defaultUsers = [
            { id: uuidv4(), nome: "Administrador", email: "admin@helpdesk.com", senha: "admin123", role: "admin" },
            { id: uuidv4(), nome: "Usuário Teste", email: "user@helpdesk.com", senha: "user123", role: "user" },
        ];
        const insertUser = this.db.prepare(`
      INSERT INTO usuarios (id, nome, email, senha, role, ativo, dataCriacao)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);
        for (const user of defaultUsers) {
            insertUser.run(user.id, user.nome, user.email, user.senha, user.role, new Date().toISOString());
        }
    }
    authenticateUser(email, senha) {
        const user = this.db.prepare("SELECT * FROM usuarios WHERE email = ? AND ativo = 1").get(email);
        if (!user || user.senha !== senha) {
            return null;
        }
        return { id: user.id, name: user.nome, email: user.email, role: user.role };
    }
    initializeCounter() {
        const counterRow = this.db.prepare("SELECT value FROM counter WHERE id = 1").get();
        if (!counterRow) {
            this.db.prepare("INSERT INTO counter (id, value) VALUES (1, 6)").run();
            this.counter = 6;
        }
        else {
            this.counter = counterRow.value;
        }
    }
    initializeSampleData() {
        const count = this.db.prepare("SELECT COUNT(*) as count FROM tickets").get();
        if (count.count > 0)
            return;
        const sampleTickets = [
            {
                id: "HD-000001",
                titulo: "Computador não liga",
                descricao: "O computador do setor de atendimento não está ligando pela manhã.",
                categoria: "hardware",
                prioridade: "alta",
                status: "aberto",
                solicitante: "Maria Silva",
                email: "maria.silva@empresa.com",
                departamento: "Atendimento",
                dataAbertura: "2026-03-25T09:00:00",
                dataAtualizacao: "2026-03-25T09:00:00",
            },
            {
                id: "HD-000002",
                titulo: "Erro ao acessar sistema ERP",
                descricao: "Ao tentar acessar o sistema ERP, apresenta erro de conexão.",
                categoria: "sistema",
                prioridade: "critica",
                status: "em_andamento",
                solicitante: "João Santos",
                email: "joao.santos@empresa.com",
                departamento: "Financeiro",
                dataAbertura: "2026-03-24T14:30:00",
                dataAtualizacao: "2026-03-25T10:15:00",
            },
            {
                id: "HD-000003",
                titulo: "Impressora travando documentos",
                descricao: "A impressora do 3º andar está travando os documentos na impressão.",
                categoria: "impressora",
                prioridade: "media",
                status: "pendente",
                solicitante: "Ana Costa",
                email: "ana.costa@empresa.com",
                departamento: "RH",
                dataAbertura: "2026-03-23T11:00:00",
                dataAtualizacao: "2026-03-24T16:00:00",
            },
            {
                id: "HD-000004",
                titulo: "Rede Wi-Fi lenta",
                descricao: "A conexão Wi-Fi está muito lenta no setor administrativo.",
                categoria: "rede",
                prioridade: "baixa",
                status: "resolvido",
                solicitante: "Carlos Oliveira",
                email: "carlos.oliveira@empresa.com",
                departamento: "Administrativo",
                dataAbertura: "2026-03-20T08:00:00",
                dataAtualizacao: "2026-03-22T17:00:00",
            },
            {
                id: "HD-000005",
                titulo: "Outlook não recebe e-mails",
                descricao: "Cliente Outlook parou de sincronizar e-mails novos.",
                categoria: "email",
                prioridade: "alta",
                status: "aberto",
                solicitante: "Pedro Lima",
                email: "pedro.lima@empresa.com",
                departamento: "Vendas",
                dataAbertura: "2026-03-26T08:30:00",
                dataAtualizacao: "2026-03-26T08:30:00",
            },
        ];
        const insertTicket = this.db.prepare(`
      INSERT INTO tickets (id, titulo, descricao, categoria, prioridade, status, solicitante, email, departamento, dataAbertura, dataAtualizacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const insertComment = this.db.prepare(`
      INSERT INTO comentarios (id, ticketId, autor, conteudo, data)
      VALUES (?, ?, ?, ?, ?)
    `);
        const insertMany = this.db.transaction(() => {
            for (const ticket of sampleTickets) {
                insertTicket.run(ticket.id, ticket.titulo, ticket.descricao, ticket.categoria, ticket.prioridade, ticket.status, ticket.solicitante, ticket.email, ticket.departamento, ticket.dataAbertura, ticket.dataAtualizacao);
                if (ticket.id === "HD-000002") {
                    insertComment.run(uuidv4(), "HD-000002", "Técnico TI", "Verificando servidor de banco de dados.", "2026-03-25T10:15:00");
                }
                if (ticket.id === "HD-000004") {
                    insertComment.run(uuidv4(), "HD-000004", "Técnico TI", "Problema resolvido. Trocamos o access point.", "2026-03-22T17:00:00");
                }
            }
        });
        insertMany();
    }
    generateId() {
        this.counter++;
        this.db.prepare("UPDATE counter SET value = ? WHERE id = 1").run(this.counter);
        return `HD-${String(this.counter).padStart(6, "0")}`;
    }
    getComentarios(ticketId) {
        return this.db.prepare("SELECT * FROM comentarios WHERE ticketId = ? ORDER BY data ASC").all(ticketId);
    }
    getAll() {
        const rows = this.db.prepare("SELECT * FROM tickets ORDER BY dataAbertura DESC").all();
        return rows.map((row) => ({
            ...row,
            comentarios: this.getComentarios(row.id),
        }));
    }
    getById(id) {
        const row = this.db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
        if (!row)
            return undefined;
        return {
            ...row,
            comentarios: this.getComentarios(row.id),
        };
    }
    create(data) {
        const now = new Date().toISOString();
        const id = this.generateId();
        this.db.prepare(`
      INSERT INTO tickets (id, titulo, descricao, categoria, prioridade, status, solicitante, email, departamento, dataAbertura, dataAtualizacao)
      VALUES (?, ?, ?, ?, ?, 'aberto', ?, ?, ?, ?, ?)
    `).run(id, data.titulo, data.descricao, data.categoria, data.prioridade, data.solicitante, data.email, data.departamento, now, now);
        this.addLog(id, "CRIACAO", `Ticket criado por ${data.solicitante} (${data.email})`, data.solicitante);
        return this.getById(id);
    }
    update(id, data) {
        const existing = this.getById(id);
        if (!existing)
            return undefined;
        const now = new Date().toISOString();
        const fields = [];
        const values = [];
        if (data.titulo !== undefined) {
            fields.push("titulo = ?");
            values.push(data.titulo);
        }
        if (data.descricao !== undefined) {
            fields.push("descricao = ?");
            values.push(data.descricao);
        }
        if (data.categoria !== undefined) {
            fields.push("categoria = ?");
            values.push(data.categoria);
        }
        if (data.prioridade !== undefined) {
            fields.push("prioridade = ?");
            values.push(data.prioridade);
        }
        if (data.status !== undefined) {
            if (data.status === "reaberto") {
                this.addLog(id, "REABERTURA", `Ticket foi reaberto (anterior: ${existing.status})`, "Sistema");
                this.addNotificacao("status", "Ticket Reaberto", `Seu ticket ${id} foi reaberto e voltou para a fila de atendimento`, id, [existing.email]);
                fields.push("status = ?");
                values.push("aberto");
            }
            else if (data.status === "fechado") {
                this.addLog(id, "FECHAMENTO", `Ticket foi fechado (anterior: ${existing.status})`, "Sistema");
                this.addNotificacao("status", "Ticket Fechado", `Seu ticket ${id} foi fechado`, id, [existing.email]);
                fields.push("status = ?");
                values.push(data.status);
            }
            else if (data.status !== existing.status) {
                const statusLabel = data.status === "em_andamento" ? "Em Andamento" : data.status === "resolvido" ? "Resolvido" : data.status;
                this.addLog(id, "MUDANCA_STATUS", `Status alterado de ${existing.status} para ${data.status}`, "Sistema");
                this.addNotificacao("status", "Status Atualizado", `O ticket ${id} mudou para: ${statusLabel}`, id, [existing.email]);
                fields.push("status = ?");
                values.push(data.status);
            }
            else {
                fields.push("status = ?");
                values.push(data.status);
            }
        }
        if (data.solicitante !== undefined) {
            fields.push("solicitante = ?");
            values.push(data.solicitante);
        }
        if (data.email !== undefined) {
            fields.push("email = ?");
            values.push(data.email);
        }
        if (data.departamento !== undefined) {
            fields.push("departamento = ?");
            values.push(data.departamento);
        }
        if (data.parecerAdmin !== undefined) {
            fields.push("parecerAdmin = ?");
            values.push(data.parecerAdmin);
        }
        if (data.criticidadeFinal !== undefined) {
            fields.push("criticidadeFinal = ?");
            values.push(data.criticidadeFinal);
        }
        fields.push("dataAtualizacao = ?");
        values.push(now);
        values.push(id);
        this.db.prepare(`UPDATE tickets SET ${fields.join(", ")} WHERE id = ?`).run(...values);
        return this.getById(id);
    }
    delete(id) {
        const result = this.db.prepare("DELETE FROM tickets WHERE id = ?").run(id);
        return result.changes > 0;
    }
    addComment(ticketId, autor, conteudo) {
        const ticket = this.getById(ticketId);
        if (!ticket)
            return undefined;
        const comment = {
            id: uuidv4(),
            autor,
            conteudo,
            data: new Date().toISOString(),
        };
        this.db.prepare(`
      INSERT INTO comentarios (id, ticketId, autor, conteudo, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(comment.id, ticketId, autor, conteudo, comment.data);
        this.db.prepare("UPDATE tickets SET dataAtualizacao = ? WHERE id = ?").run(comment.data, ticketId);
        this.addLog(ticketId, "COMENTARIO", `${autor} enviou uma mensagem`, autor);
        const isAdminComment = autor.toLowerCase().includes("admin") || autor === "Administrador";
        if (isAdminComment) {
            this.addNotificacao("chat", "Nova mensagem", `Admin ${autor} respondeu ao seu ticket`, ticketId, [ticket.email]);
        }
        else {
            this.addNotificacao("chat", "Nova mensagem", `${autor} enviou uma mensagem no ticket ${ticketId}`, ticketId, ["admin@helpdesk.com"]);
        }
        return this.getById(ticketId);
    }
    exportData() {
        return {
            tickets: this.getAll(),
            timestamp: new Date().toISOString(),
        };
    }
    importData(data) {
        const insertTicket = this.db.prepare(`
      INSERT OR REPLACE INTO tickets (id, titulo, descricao, categoria, prioridade, status, solicitante, email, departamento, dataAbertura, dataAtualizacao, parecerAdmin, criticidadeFinal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const insertComment = this.db.prepare(`
      INSERT OR REPLACE INTO comentarios (id, ticketId, autor, conteudo, data)
      VALUES (?, ?, ?, ?, ?)
    `);
        const clearComments = this.db.prepare("DELETE FROM comentarios");
        const importMany = this.db.transaction(() => {
            clearComments.run();
            for (const ticket of data.tickets) {
                insertTicket.run(ticket.id, ticket.titulo, ticket.descricao, ticket.categoria, ticket.prioridade, ticket.status, ticket.solicitante, ticket.email, ticket.departamento, ticket.dataAbertura, ticket.dataAtualizacao, ticket.parecerAdmin || null, ticket.criticidadeFinal || null);
                for (const comment of ticket.comentarios || []) {
                    insertComment.run(comment.id, ticket.id, comment.autor, comment.conteudo, comment.data);
                }
            }
        });
        importMany();
        return { imported: data.tickets.length };
    }
    addLog(ticketId, acao, descricao, usuario) {
        const log = {
            id: uuidv4(),
            ticketId,
            acao,
            descricao,
            usuario,
            data: new Date().toISOString(),
        };
        this.db.prepare(`
      INSERT INTO logs (id, ticketId, acao, descricao, usuario, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(log.id, log.ticketId, log.acao, log.descricao, log.usuario, log.data);
        return log;
    }
    getLogs(ticketId) {
        if (ticketId) {
            return this.db.prepare("SELECT * FROM logs WHERE ticketId = ? ORDER BY data DESC").all(ticketId);
        }
        return this.db.prepare("SELECT * FROM logs ORDER BY data DESC LIMIT 100").all();
    }
    addNotificacao(tipo, titulo, mensagem, ticketId, usuarios) {
        const notificacoes = [];
        for (const usuario of usuarios) {
            const notif = {
                id: uuidv4(),
                tipo,
                titulo,
                mensagem,
                ticketId: ticketId || null,
                usuario,
                lida: 0,
                data: new Date().toISOString(),
            };
            this.db.prepare(`
        INSERT INTO notificacoes (id, tipo, titulo, mensagem, ticketId, usuario, lida, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(notif.id, notif.tipo, notif.titulo, notif.mensagem, notif.ticketId, notif.usuario, notif.lida, notif.data);
            notificacoes.push(notif);
        }
        return notificacoes;
    }
    getNotificacoes(usuario) {
        return this.db.prepare("SELECT * FROM notificacoes WHERE usuario = ? ORDER BY data DESC LIMIT 50").all(usuario);
    }
    markNotificacaoLida(id) {
        this.db.prepare("UPDATE notificacoes SET lida = 1 WHERE id = ?").run(id);
    }
    markAllNotificacoesLidas(usuario) {
        this.db.prepare("UPDATE notificacoes SET lida = 1 WHERE usuario = ?").run(usuario);
    }
    close() {
        this.db.close();
    }
    executeQuery(sql) {
        const stmt = this.db.prepare(sql);
        return stmt.all();
    }
    executeWrite(sql) {
        const stmt = this.db.prepare(sql);
        const result = stmt.run();
        return { changes: result.changes };
    }
    getSchema() {
        const tables = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
        const schema = {};
        for (const table of tables) {
            const columns = this.db.prepare(`PRAGMA table_info(${table.name})`).all();
            schema[table.name] = {
                name: table.name,
                columns,
            };
        }
        return schema;
    }
}
export const ticketStore = new TicketStore();
