const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

// ESTADO
let silos = Array.from({ length: 8 }, () => ({
  estado: "Libre",
  variedad: "",
  kilos: 0
}));

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado");

  // 🔥 ENVIAR SIEMPRE ESTADO
  socket.emit("estadoInicial", silos);

  socket.on("actualizarSilo", ({ index, data }) => {
    console.log("📥 Actualizar silo", index, data);

    silos[index] = data;

    io.emit("estadoActualizado", silos);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});