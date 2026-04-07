// 🔥 FIX FETCH PARA RENDER (MUY IMPORTANTE)
global.fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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

// 🔑 VARIABLES DE ENTORNO
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// DEBUG (podés borrar después)
console.log("URL:", SUPABASE_URL);
console.log("KEY:", SUPABASE_KEY ? "OK" : "NO KEY");

// 🔥 CLIENTE SUPABASE
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🟡 ESTADO INICIAL
let silos = Array.from({ length: 8 }, () => ({
  estado: "Libre",
  variedad: "",
  kilos: 0
}));

// 🔌 SOCKET
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado");

  socket.emit("estadoInicial", silos);

  socket.on("actualizarSilo", async ({ index, data }) => {
    try {
      console.log("📥 Actualizar silo", index, data);

      const anterior = silos[index];

      // ACTUALIZAR MEMORIA
      silos[index] = data;

      // ACTUALIZAR CLIENTES
      io.emit("estadoActualizado", silos);

      // 🧠 DEFINIR ACCIÓN
      let accion = "Carga";
      if (data.estado === "Libre") accion = "Vaciado";

      console.log("💾 Guardando en Supabase...");

      // 🔥 INSERTAR EN BD
      const { error } = await supabase
        .from("historial_silos")
        .insert([
          {
            silo: index + 1,
            accion: accion,
            variedad: data.variedad || anterior.variedad,
            kilos: data.kilos,
          }
        ]);

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

// 🧪 TEST DE CONEXIÓN
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("historial_silos")
      .select("*")
      .limit(1);

    if (error) {
      console.log("ERROR DB:", error);
      return res.send("ERROR DB");
    }

    res.send("OK DB");
  } catch (err) {
    console.log("ERROR FETCH:", err);
    res.send("ERROR FETCH");
  }
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});