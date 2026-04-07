console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY:", process.env.SUPABASE_KEY ? "OK" : "NO KEY");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

// 🔥 SUPABASE (IMPORTANTE: poner tu SERVICE ROLE KEY)
const supabase = createClient(
  "https://nmthtqldqdkhgxaoqqth.supabase.com",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tdGh0cWxkcWRraGd4YW9xcXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjYxMSwiZXhwIjoyMDkxMDc4NjExfQ.2sUjrlgGTtTntaAXNe22FTLDdKQSFaQm7FuuyulxWdc"
);

// ESTADO INICIAL
let silos = Array.from({ length: 8 }, () => ({
  estado: "Libre",
  variedad: "",
  kilos: 0
}));

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado");

  socket.emit("estadoInicial", silos);

  socket.on("actualizarSilo", async ({ index, data }) => {
    try {
      const anterior = silos[index];

      // ACTUALIZA EN MEMORIA
      silos[index] = data;

      // ACTUALIZA EN CLIENTES
      io.emit("estadoActualizado", silos);

      // 🔥 GUARDAR HISTORIAL
      let accion = "Carga";

      if (data.estado === "Libre") {
        accion = "Vaciado";
      }

      const { error } = await supabase
        .from("historial_silos")
        .insert([{
          silo: index + 1,
          accion: accion,
          variedad: data.variedad || anterior.variedad,
          kilos: data.kilos,
        }]);

      if (error) {
        console.log("❌ Error guardando historial:", error.message);
      } else {
        console.log("📦 Historial guardado OK");
      }

    } catch (err) {
      console.log("❌ ERROR GENERAL:", err.message);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});