import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { db } from "./db";
import { syncHandler } from "./sync";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }
  /* options */
});

io.use(async (socket, next) => {
  const email = socket.handshake.auth.email;
  const deviceId = socket.handshake.auth.deviceId
  const userId = await db.user.findUnique({ where: { email } });
  if (!userId) return next(new Error("not authorized"));
  if (!deviceId) return next(new Error("device id not provided"));
  socket.data.userId = userId;
  socket.data.deviceId = deviceId
  next();
});

io.on("connection", (socket) => {
  socket.join(`${socket.data.userId}`);
  socket.on("sync", syncHandler);
});

const port = process.env.PORT || 4000;

app.use(express.json());

httpServer.listen(port);
