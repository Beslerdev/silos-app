const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// 🔥 CONEXIÓN SUPABASE
const supabase = createClient(
  "https://nmthtqldqdkhgxaoqqth.supabase.com",
  "sb_publishable_32EeEQjApc64hDWcs7pxiQ_fdeulV8M"
);

// 🔄 OBTENER SILOS DESDE DB
async function obtenerSilos() {
  const { data, error } = await supabase
    .from("silos")
    .select("*")
    .order("id");

  if (error) {
    console.error("Error obteniendo silos:", error);
    return [];
  }

  return data;
}

// 💾 ACTUALIZAR SILO EN DB
async function actualizarSiloDB(index, silo) {
  const { error } = await supabase
    .from("silos")
    .update({
      estado: silo.estado,
      variedad: silo.variedad,
      kilos: silo.kilos
    })
    .eq("id", index);

  if (error) {
    console.error("Error actualizando silo:", error);
  }
}

// 🔌 CONEXIÓN SOCKET
io.on("connection", async (socket) => {
  console.log("Usuario conectado");

  // Enviar estado inicial
  const silos = await obtenerSilos();
  socket.emit("estadoInicial", silos);

  // Escuchar cambios
  socket.on("actualizarSilo", async ({ index, data }) => {
    await actualizarSiloDB(index, data);

    // Obtener estado actualizado
    const silosActualizados = await obtenerSilos();

    // Emitir a todos
    io.emit("estadoActualizado", silosActualizados);
  });
});

// 🚀 SERVIDOR
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto " + PORT);
});