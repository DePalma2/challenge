import express from "express";
import swaggerUi from "swagger-ui-express";
import healthRouter from "./routes/health";
import validateMd5Router from "./routes/validate-md5";
import { openApiSpec } from "./openapi";

const app = express();

// Middleware

// Parse JSON bodies (limit 1MB para evitar payloads excesivos)
app.use(express.json({ limit: "1mb" }));

// Swagger UI - Documentación interactiva de la API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Endpoint para obtener el spec OpenAPI en formato JSON
app.get("/api-docs.json", (_req, res) => {
  res.json(openApiSpec);
});

// Rutas de la API
app.use(healthRouter);
app.use(validateMd5Router);

// Manejo de errores global

// 404 - Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "El endpoint solicitado no existe",
    status: 404,
  });
});

// Error handler genérico
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[ERROR]", err.message);

    // Error de JSON parsing 
    if ((err as unknown as Record<string, unknown>).type === "entity.parse.failed") {
      res.status(400).json({
        error: "Bad Request",
        message: "El body no contiene JSON válido",
        status: 400,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "Error interno del servidor",
      status: 500,
    });
  }
);

export default app;
