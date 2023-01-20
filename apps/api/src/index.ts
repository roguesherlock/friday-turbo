import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { db } from "./db";
import { syncHandler } from "./sync";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

io.use(async (socket, next) => {
  const email = socket.handshake.auth.email;
  const userId = await db.user.findUnique({ where: { email } });
  if (!userId) return next(new Error("not authorized"));
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  socket.join(`${socket.data.userId}`);
  socket.on("sync", syncHandler);
});

const port = process.env.PORT || 3000;

app.use(express.json());

httpServer.listen(port);
