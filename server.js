const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const server = http.createServer(app);

// 🔥 IMPORTANTE PARA RENDER
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 📁 archivos estáticos
app.use(express.static("public"));

// 🔥 SUPABASE
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
    console.log("❌ Error Supabase:", error);
    return [];
  }

  console.log("✅ Datos:", data);
  return data;
}

// 💾 ACTUALIZAR SILO
async function actualizarSiloDB(index, silo) {
  const { error } = await supabase
    .from("silos")
    .update({
      estado: silo.estado,
      variedad: silo.variedad,
      kilos: silo.kilos,
    })
    .eq("id", index);

  if (error) {
    console.log("❌ Error update:", error);
  }
}

// 🔌 SOCKET
io.on("connection", async (socket) => {
  console.log("🟢 Cliente conectado");

  const silos = await obtenerSilos();
  socket.emit("estadoInicial", silos);

  socket.on("actualizarSilo", async ({ index, data }) => {
    await actualizarSiloDB(index, data);

    const nuevos = await obtenerSilos();
    io.emit("estadoActualizado", nuevos);
  });
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});