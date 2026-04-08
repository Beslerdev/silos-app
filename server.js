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

// 🔥 SUPABASE (usar variables de entorno en Render)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔥 ESTADO GLOBAL
let silos = [];

// ===============================
// 🔥 CARGAR ESTADO DESDE DB
// ===============================
async function cargarEstadoInicial() {
  try {
    const { data, error } = await supabase
      .from("silos_estado")
      .select("*")
      .order("silo");

    if (error) {
      console.log("❌ Error cargando estado:", error.message);
      return;
    }

    silos = data.map(s => ({
      estado: s.estado,
      variedad: s.variedad,
      kilos: s.kilos
    }));

    console.log("✅ Estado cargado desde Supabase");
  } catch (err) {
    console.log("❌ ERROR GENERAL:", err.message);
  }
}

// ===============================
// 🔥 SOCKET
// ===============================
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado");

  socket.emit("estadoInicial", silos);

  socket.on("actualizarSilo", async ({ index, data }) => {
    try {
      console.log("📥 Actualizar silo", index, data);

      const anterior = silos[index];

      // 🔥 ACTUALIZA EN MEMORIA
      silos[index] = data;

      // 🔥 ENVIA A TODOS
      io.emit("estadoActualizado", silos);

      // ===============================
      // 🔥 GUARDAR ESTADO ACTUAL
      // ===============================
      const { error: errorEstado } = await supabase
        .from("silos_estado")
        .update({
          estado: data.estado,
          variedad: data.variedad,
          kilos: data.kilos
        })
        .eq("silo", index + 1);

      if (errorEstado) {
        console.log("❌ Error guardando estado:", errorEstado.message);
      } else {
        console.log("💾 Estado actualizado OK");
      }

      // ===============================
      // 🔥 GUARDAR HISTORIAL
      // ===============================
      let accion = "Carga";

      if (data.estado === "Libre") {
        accion = "Vaciado";
      }

      const { error: errorHistorial } = await supabase
        .from("historial_silos")
        .insert([{
          silo: index + 1,
          accion: accion,
          variedad: data.variedad || anterior.variedad,
          kilos: data.kilos,
        }]);

      if (errorHistorial) {
        console.log("❌ Error historial:", errorHistorial.message);
      } else {
        console.log("📦 Historial guardado OK");
      }

    } catch (err) {
      console.log("❌ ERROR GENERAL:", err.message);
    }
  });
});

// ===============================
// 🔥 INICIAR SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", async () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);

  await cargarEstadoInicial(); // 🔥 clave
});