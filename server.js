const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// 🔥 CONEXIÓN A SUPABASE (TU CONFIG REAL)
const supabase = createClient(
  "https://nmthtqldqdkhgxaoqqth.supabase.com",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tdGh0cWxkcWRraGd4YW9xcXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjYxMSwiZXhwIjoyMDkxMDc4NjExfQ.2sUjrlgGTtTntaAXNe22FTLDdKQSFaQm7FuuyulxWdc"
);

// 🔄 OBTENER SILOS
async function obtenerSilos() {
  const { data, error } = await supabase
    .from("silos")
    .select("*")
    .order("id");

  if (error) {
    console.error("❌ Error obteniendo silos:", error);
    return [];
  }

  console.log("✅ Silos cargados:", data);
  return data;
}

// 💾 ACTUALIZAR SILO
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
    console.error("❌ Error actualizando silo:", error);
  }
}

// 🔌 SOCKET.IO
io.on("connection", async (socket) => {
  console.log("🟢 Usuario conectado");

  // Estado inicial
  const silos = await obtenerSilos();
  socket.emit("estadoInicial", silos);

  // Actualizaciones
  socket.on("actualizarSilo", async ({ index, data }) => {
    await actualizarSiloDB(index, data);

    const silosActualizados = await obtenerSilos();
    io.emit("estadoActualizado", silosActualizados);
  });
});

// 🚀 SERVIDOR
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});