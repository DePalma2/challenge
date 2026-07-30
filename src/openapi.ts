/**
 * Especificación OpenAPI 3.0.3 para la API de validación MD5.
 * Se exporta como objeto JS para ser consumido por swagger-ui-express.
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "MD5 Validation API",
    description: `API REST para validación de hashes MD5.

## Cálculo del MD5

El MD5 se calcula sobre la **serialización canónica** del campo \`json_body\`:
1. Se ordenan las keys del JSON recursivamente (orden lexicográfico)
2. Se serializa con \`JSON.stringify\` sin espacios
3. Se calcula el hash MD5 del string resultante (UTF-8)

Esto garantiza que \`{ "a": 1, "b": 2 }\` y \`{ "b": 2, "a": 1 }\` produzcan el mismo hash.`,
    version: "1.0.0",
    contact: {
      name: "Challenge Urbetrack",
    },
  },
  servers: [
    {
      url: "/",
      description: "Servidor actual",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        description:
          "Verifica la disponibilidad del servicio. Responde 200 OK si el servicio está operativo.",
        operationId: "healthCheck",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Servicio disponible",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
                example: {
                  status: "ok",
                  timestamp: "2026-07-30T12:00:00.000Z",
                  uptime: 3600.5,
                },
              },
            },
          },
        },
      },
    },
    "/validate-md5": {
      post: {
        summary: "Validar MD5",
        description: `Recibe un objeto JSON y un hash MD5. Valida que el hash corresponda a la serialización canónica del contenido JSON enviado.

El MD5 se calcula sobre el \`json_body\` serializado con keys ordenadas recursivamente.`,
        operationId: "validateMd5",
        tags: ["Validation"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidateMd5Request",
              },
              examples: {
                valid: {
                  summary: "Request válido con MD5 correcto",
                  value: {
                    json_body: { key: "value" },
                    md5: "a7353f7cddce808de0032747a0b7be50",
                  },
                },
                invalid_hash: {
                  summary: "Request con MD5 incorrecto",
                  value: {
                    json_body: { key: "value" },
                    md5: "0000000000000000000000000000000",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "MD5 válido — el hash coincide con el contenido",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidateMd5SuccessResponse",
                },
              },
            },
          },
          "400": {
            description:
              "Bad Request — faltan campos requeridos o formato inválido",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Bad Request",
                  message:
                    "Los campos 'json_body' y 'md5' son requeridos",
                  status: 400,
                },
              },
            },
          },
          "422": {
            description:
              "Unprocessable Entity — el MD5 no coincide con el contenido",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Md5MismatchResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["ok"],
            description: "Estado del servicio",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Timestamp del servidor en formato ISO 8601",
          },
          uptime: {
            type: "number",
            description: "Tiempo de actividad del proceso en segundos",
          },
        },
        required: ["status", "timestamp", "uptime"],
      },
      ValidateMd5Request: {
        type: "object",
        properties: {
          json_body: {
            description:
              "Objeto JSON cuyo contenido se validará contra el hash MD5 proporcionado. Puede ser cualquier JSON válido.",
          },
          md5: {
            type: "string",
            pattern: "^[a-fA-F0-9]{32}$",
            description:
              "Hash MD5 en formato hexadecimal (32 caracteres). Se compara contra el MD5 calculado de json_body.",
            example: "a7353f7cddce808de0032747a0b7be50",
          },
        },
        required: ["json_body", "md5"],
      },
      ValidateMd5SuccessResponse: {
        type: "object",
        properties: {
          valid: {
            type: "boolean",
            enum: [true],
            description: "Indica que el MD5 es válido",
          },
          md5: {
            type: "string",
            description: "El hash MD5 validado",
          },
        },
        required: ["valid", "md5"],
      },
      Md5MismatchResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "MD5 Mismatch",
          },
          message: {
            type: "string",
            example: "El MD5 proporcionado no coincide con el contenido",
          },
          status: {
            type: "integer",
            example: 422,
          },
          expected_md5: {
            type: "string",
            description: "El MD5 correcto calculado del json_body",
            example: "a7353f7cddce808de0032747a0b7be50",
          },
          received_md5: {
            type: "string",
            description: "El MD5 recibido en el request",
            example: "0000000000000000000000000000000",
          },
        },
        required: ["error", "message", "status", "expected_md5", "received_md5"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Tipo de error",
          },
          message: {
            type: "string",
            description: "Descripción detallada del error",
          },
          status: {
            type: "integer",
            description: "Código de estado HTTP",
          },
        },
        required: ["error", "message", "status"],
      },
    },
  },
  tags: [
    {
      name: "Health",
      description: "Endpoints de monitoreo y disponibilidad",
    },
    {
      name: "Validation",
      description: "Endpoints de validación de integridad",
    },
  ],
};
