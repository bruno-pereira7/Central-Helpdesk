import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { ticketStore } from "./store.js";
import { CreateTicketDTO, UpdateTicketDTO } from "./types.js";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3080", 10);

const clients = new Map<string, Set<Response>>();

function broadcastMessage(para: string, message: any) {
  const clientSet = clients.get(para);
  if (clientSet) {
    clientSet.forEach(res => {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    });
  }
}
const HOST = process.env.HOST || "0.0.0.0";

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro ao fazer login" });
  }
});

app.get("/api/tickets", (_req: Request, res: Response) => {
  try {
    const tickets = ticketStore.getAll();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

app.get("/api/tickets/:id", (req: Request, res: Response) => {
  try {
    const ticket = ticketStore.getById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar ticket" });
  }
});

app.post("/api/tickets", (req: Request, res: Response) => {
  try {
    const data: CreateTicketDTO = req.body;
    
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
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar ticket" });
  }
});

app.put("/api/tickets/:id", (req: Request, res: Response) => {
  try {
    const data: UpdateTicketDTO = req.body;
    const ticket = ticketStore.update(req.params.id, data);
    
    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar ticket" });
  }
});

app.delete("/api/tickets/:id", (req: Request, res: Response) => {
  try {
    const deleted = ticketStore.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar ticket" });
  }
});

app.post("/api/tickets/:id/comments", (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: "Erro ao adicionar comentário" });
  }
});

app.get("/api/export", (_req: Request, res: Response) => {
  try {
    const data = ticketStore.exportData();
    res.setHeader("Content-Disposition", `attachment; filename=helpdesk-backup-${new Date().toISOString().split("T")[0]}.json`);
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao exportar dados" });
  }
});

app.post("/api/import", (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    if (!data.tickets || !Array.isArray(data.tickets)) {
      return res.status(400).json({ error: "Formato inválido. Esperado objeto com array de tickets." });
    }

    const result = ticketStore.importData(data);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: "Erro ao importar dados" });
  }
});

app.post("/api/admin/sql", (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    
    if (!sql || typeof sql !== "string") {
      return res.status(400).json({ error: "SQL é obrigatório" });
    }

    const normalizedSql = sql.trim().toLowerCase();
    
    if (normalizedSql.startsWith("select")) {
      const result = ticketStore.executeQuery(sql);
      res.json({ success: true, data: result });
    } else {
      const result = ticketStore.executeWrite(sql);
      res.json({ success: true, changes: result.changes });
    }
  } catch (error) {
    res.status(500).json({ error: `Erro ao executar SQL: ${error}` });
  }
});

app.get("/api/admin/schema", (_req: Request, res: Response) => {
  try {
    const schema = ticketStore.getSchema();
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar schema" });
  }
});

app.get("/api/logs", (req: Request, res: Response) => {
  try {
    const ticketId = req.query.ticketId as string | undefined;
    const logs = ticketStore.getLogs(ticketId);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar logs" });
  }
});

app.get("/api/users", (_req: Request, res: Response) => {
  try {
    const users = ticketStore.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.get("/api/users/:id", (req: Request, res: Response) => {
  try {
    const user = ticketStore.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

app.post("/api/users", (req: Request, res: Response) => {
  try {
    const { nome, email, senha, role, usuario } = req.body;
    
    if (!nome || !email || !senha || !role) {
      return res.status(400).json({ error: "Nome, email, senha e role são obrigatórios" });
    }

    const user = ticketStore.createUser({ nome, email, senha, role, usuario: usuario || "Sistema" });
    res.status(201).json(user);
  } catch (error: any) {
    if (error.message && error.message.includes("UNIQUE constraint")) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

app.put("/api/users/:id", (req: Request, res: Response) => {
  try {
    const { nome, email, senha, role, ativo, usuario } = req.body;
    const user = ticketStore.updateUser(req.params.id, { nome, email, senha, role, ativo }, usuario || "Sistema");
    
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json(user);
  } catch (error: any) {
    if (error.message && error.message.includes("UNIQUE constraint")) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

app.delete("/api/users/:id", (req: Request, res: Response) => {
  try {
    const { usuario } = req.body;
    const deleted = ticketStore.deleteUser(req.params.id, usuario || "Sistema");
    
    if (!deleted) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

app.get("/api/messages", (req: Request, res: Response) => {
  try {
    const de = req.query.de as string;
    const para = req.query.para as string;
    if (!de || !para) {
      return res.status(400).json({ error: "Parâmetros 'de' e 'para' são obrigatórios" });
    }
    const mensagens = ticketStore.getMessages(de, para);
    res.json(mensagens);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

app.post("/api/messages", (req: Request, res: Response) => {
  try {
    const { autor, destinatario, conteudo } = req.body;
    
    if (!autor || !destinatario || !conteudo) {
      return res.status(400).json({ error: "Autor, destinatário e conteúdo são obrigatórios" });
    }

    const mensagem = ticketStore.addMessage(autor, destinatario, conteudo);
    
    broadcastMessage(destinatario, { type: "new_message", message: mensagem });
    
    res.status(201).json(mensagem);
  } catch (error) {
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
});

app.get("/api/messages/unread", (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório" });
    }
    const counts = ticketStore.getUnreadCounts(email);
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar contagens" });
  }
});

app.post("/api/messages/read", (req: Request, res: Response) => {
  try {
    const { de, para } = req.body;
    if (!de || !para) {
      return res.status(400).json({ error: "Parâmetros 'de' e 'para' são obrigatórios" });
    }
    ticketStore.markMessagesAsRead(de, para);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao marcar mensagens como lidas" });
  }
});

app.get("/api/events", (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!clients.has(email)) {
    clients.set(email, new Set());
  }
  clients.get(email)!.add(res);

  req.on("close", () => {
    const clientSet = clients.get(email);
    if (clientSet) {
      clientSet.delete(res);
      if (clientSet.size === 0) {
        clients.delete(email);
      }
    }
  });
});

app.get("/api/notifications", (req: Request, res: Response) => {
  try {
    const usuario = req.query.usuario as string;
    if (!usuario) {
      return res.status(400).json({ error: "Usuário é obrigatório" });
    }
    const notificacoes = ticketStore.getNotificacoes(usuario);
    res.json(notificacoes);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

app.put("/api/notifications/:id", (req: Request, res: Response) => {
  try {
    const { lida } = req.body;
    if (lida) {
      ticketStore.markNotificacaoLida(req.params.id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar notificação" });
  }
});

app.put("/api/notifications/read-all", (req: Request, res: Response) => {
  try {
    const { usuario } = req.body;
    if (usuario) {
      ticketStore.markAllNotificacoesLidas(usuario);
    }
    res.json({ success: true });
  } catch (error) {
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
