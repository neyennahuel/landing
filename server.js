import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { z } from "zod";

dotenv.config();

// ================================
// Configuración inicial
// ================================
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Necesario para formularios

// Servir archivos estáticos
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));

// ================================
// Validación con Zod
// ================================
const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

// ================================
// Función de envío de email
// ================================
async function sendEmail({ name, email, message }) {
  const hasSMTP =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSMTP) {
    console.log("⚠ No hay configuración SMTP. Se usa fallback local.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const to = process.env.CONTACT_TO || process.env.SMTP_USER;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: `Nuevo contacto: ${name} <${email}>`,
      text: `Nombre: ${name}
Email: ${email}

Mensaje:
${message}
`,
    });

    console.log("📨 Email enviado correctamente a:", to);
    return true;

  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
}

// ================================
// Endpoint API /contact
// ================================
app.post("/api/contact", async (req, res) => {
  try {
    const parsed = ContactSchema.parse(req.body);
    const sent = await sendEmail(parsed);

    if (!sent) {
      // Fallback a archivo local
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const file = path.join(dataDir, "messages.json");

      const current = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file, "utf8"))
        : [];

      current.push({ ...parsed, at: new Date().toISOString() });

      fs.writeFileSync(file, JSON.stringify(current, null, 2), "utf8");

      console.log("💾 Guardado local en messages.json");
    }

    return res.json({ ok: true });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Datos inválidos", details: err.errors });
    }

    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ================================
// Init
// ================================
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
