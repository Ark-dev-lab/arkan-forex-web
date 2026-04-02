import express from "express";

const app = express();

// API untuk konfigurasi (URL, dll)
app.get("/api/config", (req, res) => {
  res.json({
    appUrl: process.env.APP_URL || `https://${process.env.VERCEL_URL}`
  });
});

// Tambahkan API lain di sini jika butuh, misal untuk fetch data forex
app.get("/api/status", (req, res) => {
  res.json({ status: "Forex Analyzer Active" });
});

// PENTING: Jangan pakai app.listen() di sini
export default app;
