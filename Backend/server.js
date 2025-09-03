// backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import routes from "./routes.js";
import {PORT} from "./config.js"

// Configurar variables de entorno
dotenv.config();

const app = express();

// __dirname en ESM (no existe por defecto)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors()); // en producción restringe el origin
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, "..", "public")));

// Rutas API prefix /api
app.use("/api", routes);

// Fallback: servir index.html para rutas no encontradas (útil en despliegues)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

