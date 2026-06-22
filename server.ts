import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request bodies up to 10MB (in case of large tournaments)
  app.use(express.json({ limit: '10mb' }));

  // API router for proxying to Google Apps Script
  app.post("/api/export-sheets", async (req, res) => {
    try {
      const { spreadsheetId, tournamentName, category, rows } = req.body;
      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUFlGii-VBnOZqow6PndayGxLN2CcrMuybIwHvS2RnLzNqEjPeGNsmHoC6UvDSgMUyQw/exec';

      console.log(`[Proxy] Exporting category: "${category}" of tournament: "${tournamentName}"`);

      // Node.JS native fetch handles redirects beautifully
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          spreadsheetId,
          tournamentName,
          category,
          rows,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script respondió con estado ${response.status}`);
      }

      const text = await response.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("[Proxy] Failed to parse Apps Script response as JSON. Body was:\n", text);
        throw new Error(`La respuesta de Google Apps Script no es un JSON válido. Asegúrate de que el script esté publicado como Web App para "Cualquiera" (Anyone) con la última versión de código activa.`);
      }

      res.json(result);
    } catch (error: any) {
      console.error("[Proxy] Error routing request to Google Apps Script:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Error desconocido del servidor proxy' 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
