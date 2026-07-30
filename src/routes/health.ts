import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /health
 * Endpoint de health check para validar la disponibilidad del servicio.
 * Usado por Docker, load balancers y scripts de monitoreo.
 * Responde 200 OK con:
 * - status: "ok"
 * - timestamp: fecha/hora actual del servidor
 * - uptime: tiempo de actividad del proceso en segundos
 */
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
