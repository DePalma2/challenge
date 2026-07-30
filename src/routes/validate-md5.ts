import { Router, Request, Response } from "express";
import { z } from "zod";
import { computeMd5 } from "../utils/md5";

const router = Router();

/**
 * Request body de POST /validate-md5.
 *
 * - json_body: cualquier valor JSON válido 
 * - md5: string hexadecimal de 32 caracteres
 */
const validateMd5Schema = z.object({
  json_body: z.unknown().refine((val) => val !== undefined, {
    message: "El campo 'json_body' es requerido",
  }),
  md5: z
    .string({
      required_error: "El campo 'md5' es requerido",
      invalid_type_error: "El campo 'md5' debe ser un string",
    })
    .regex(/^[a-fA-F0-9]{32}$/, {
      message:
        "El campo 'md5' debe ser un hash MD5 válido (32 caracteres hexadecimales)",
    }),
});

/**
 * POST /validate-md5
 *
 * Recibe un objeto JSON y un hash MD5. Valida que el hash corresponda
 * a la serialización canónica del json_body.
 *
 * Cálculo del MD5:
 * 1. Se toma el valor de json_body
 * 2. Se serializa con keys ordenadas recursivamente 
 * 3. Se calcula el MD5 del string UTF-8 resultante
 * 4. Se compara (case-insensitive) con el md5 recibido
 *
 * Respuestas:
 * - 200: MD5 coincide → valido 
 * - 400: Faltan campos o formato inválido
 * - 422: MD5 no coincide con el contenido
 */
router.post("/validate-md5", (req: Request, res: Response) => {
  const parseResult = validateMd5Schema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((e) => e.message).join("; ");
    res.status(400).json({
      error: "Bad Request",
      message: errors,
      status: 400,
    });
    return;
  }

  const { json_body, md5 } = parseResult.data;

  const computedMd5 = computeMd5(json_body);

  if (computedMd5.toLowerCase() === md5.toLowerCase()) {
    res.status(200).json({
      valid: true,
      md5: computedMd5,
    });
    return;
  }

  // MD5 no coincide, se devuelve 422
  res.status(422).json({
    error: "MD5 Mismatch",
    message: "El MD5 proporcionado no coincide con el contenido",
    status: 422,
    expected_md5: computedMd5,
    received_md5: md5,
  });
  return;
});

export default router;
