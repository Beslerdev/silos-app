const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Estado inicial seguro
let silos = Array.from({ length: 8 }, () => ({
  estado: "Libre",
  variedad: ""
}));

io.on("connection", (socket) => {
  console.log("Usuario conectado");

  socket.emit("estadoInicial", silos);

  socket.on("actualizarSilo", ({ index, data }) => {
    silos[index] = data;
    io.emit("estadoActualizado", silos);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto " + PORT);
});