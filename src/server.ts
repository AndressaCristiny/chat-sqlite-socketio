import express from "express";
import http from "http";
import { Server } from "socket.io";
import sqlite3 from "sqlite3";
import path from "path";

const app = express();

app.use("/css", express.static("node_modules/bootstrap/dist/css"));
app.use("/js", express.static("node_modules/bootstrap/dist/js"));
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

const db = new sqlite3.Database("./chat.db");

db.run(`CREATE TABLE IF NOT EXISTS mensagens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT,
  mensagem TEXT,
  data DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  db.all(`SELECT * FROM mensagens ORDER BY data ASC`, [], (err, rows) => {
    if (!err && rows) {
      socket.emit("historico", rows);
    }
  });

  socket.on("mensagem", (data: { usuario: string; mensagem: string }) => {
    const { usuario, mensagem } = data;

    db.run(`INSERT INTO mensagens (usuario, mensagem) VALUES (?, ?)`, [
      usuario,
      mensagem,
    ]);

    io.emit("mensagem", data);
  });

  socket.on("disconnect", () => {
    console.log("Usuário saiu:", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Servidor rodando em http://0.0.0.0:3000");
});
