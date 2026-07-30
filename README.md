# Challenge Urbetrack 

API REST documentada con Swagger/OpenAPI que valida hashes MD5, desplegada con Docker y Nginx como reverse proxy.


---

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Levantar el entorno](#levantar-el-entorno)
- [Detener el entorno](#detener-el-entorno)
- [Endpoints](#endpoints)
- [Ejemplos de requests](#ejemplos-de-requests)
- [Swagger UI](#swagger-ui)
- [Scripts disponibles](#scripts-disponibles)
- [Decisiones técnicas](#decisiones-técnicas)
- [Cálculo del MD5](#cálculo-del-md5)
- [Supuestos y limitaciones](#supuestos-y-limitaciones)
- [Riesgos y producción](#riesgos-y-producción)
- [Estructura del proyecto](#estructura-del-proyecto)

---

## Arquitectura

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Cliente    │──────▶│  Nginx (proxy)  │──────▶│  API (Express)  │
│  (curl/web)  │◀──────│    puerto 80    │◀──────│   puerto 3000   │
└─────────────┘       └─────────────────┘       └─────────────────┘
                              │                         │
                       Rate limiting              Validación MD5
                       Headers seguridad          Swagger UI
                       Gzip compression           Health check
```

- **Nginx**: Reverse proxy con rate limiting (10 req/s), headers de seguridad, gzip y logs JSON.
- **API**: Express 5 + TypeScript con validación Zod, documentación OpenAPI 3.0 y health check.
- **Comunicación**: Los servicios se comunican a través de una red Docker bridge interna (`app-network`).

---

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) >= 20.10
- [Docker Compose](https://docs.docker.com/compose/) >= 2.0
- `curl` (para probar los endpoints)
- `bash` (para los scripts)

**Nota**: No es necesario tener Node.js instalado localmente; la compilación se realiza dentro del contenedor Docker.

---

## Levantar el entorno

```bash
# Opción 1: Usando el script
./scripts/start.sh

# Opción 2: Usando Docker Compose directamente
docker compose build
docker compose up -d
```

El script `start.sh` construye las imágenes, levanta los servicios y espera hasta que ambos estén healthy.

Una vez levantado:
- **API**: http://localhost
- **Swagger UI**: http://localhost/api-docs
- **Health check**: http://localhost/health

---

## Detener el entorno

```bash
# Opción 1: Usando el script
./scripts/stop.sh

# Opción 2: Usando Docker Compose directamente
docker compose down --remove-orphans
```

---

## Endpoints

| Método | Endpoint         | Descripción                        |
|--------|------------------|------------------------------------|
| GET    | `/health`        | Health check del servicio          |
| POST   | `/validate-md5`  | Validar MD5 de un contenido JSON   |
| GET    | `/api-docs`      | Swagger UI (documentación)         |
| GET    | `/api-docs.json` | Spec OpenAPI en formato JSON       |

---

## Ejemplos de requests

### Health check

```bash
curl http://localhost/health
```

**Respuesta (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-07-30T12:00:00.000Z",
  "uptime": 42.5
}
```

### Validar MD5 — Request válido

```bash
curl -X POST http://localhost/validate-md5 \
  -H "Content-Type: application/json" \
  -d '{"json_body": {"key": "value"}, "md5": "a7353f7cddce808de0032747a0b7be50"}'
```

**Respuesta (200 OK):**
```json
{
  "valid": true,
  "md5": "a7353f7cddce808de0032747a0b7be50"
}
```

### Validar MD5 — MD5 incorrecto

```bash
curl -X POST http://localhost/validate-md5 \
  -H "Content-Type: application/json" \
  -d '{"json_body": {"key": "value"}, "md5": "00000000000000000000000000000000"}'
```

**Respuesta (422 Unprocessable Entity):**
```json
{
  "error": "MD5 Mismatch",
  "message": "El MD5 proporcionado no coincide con el contenido",
  "status": 422,
  "expected_md5": "a7353f7cddce808de0032747a0b7be50",
  "received_md5": "00000000000000000000000000000000"
}
```

### Validar MD5 — Campos faltantes

```bash
curl -X POST http://localhost/validate-md5 \
  -H "Content-Type: application/json" \
  -d '{"json_body": {"key": "value"}}'
```

**Respuesta (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "El campo 'md5' es requerido",
  "status": 400
}
```

### Validar MD5 — Formato MD5 inválido

```bash
curl -X POST http://localhost/validate-md5 \
  -H "Content-Type: application/json" \
  -d '{"json_body": {"key": "value"}, "md5": "not-a-valid-md5"}'
```

**Respuesta (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "El campo 'md5' debe ser un hash MD5 válido (32 caracteres hexadecimales)",
  "status": 400
}
```

### Validar MD5 — Orden de keys diferente

El orden de las keys no afecta el resultado (serialización canónica):

```bash

curl -X POST http://localhost/validate-md5 \
  -H "Content-Type: application/json" \
  -d '{"json_body": {"b": 2, "a": 1}, "md5": "608de49a4600dbb5b173492759792e4a"}'

curl -X POST http://localhost/validate-md5 \
  -H "Content-Type: application/json" \
  -d '{"json_body": {"a": 1, "b": 2}, "md5": "608de49a4600dbb5b173492759792e4a"}'
```

**Ambos responden (200 OK):**
```json
{
  "valid": true,
  "md5": "608de49a4600dbb5b173492759792e4a"
}
```

---

## Swagger UI

Documentación de la API en: **http://localhost/api-docs**

Podés probar los endpoints directamente desde el navegador.

También podés obtener el spec OpenAPI en JSON: **http://localhost/api-docs.json**

---

## Scripts disponibles

| Script                    | Descripción                                          |
|---------------------------|------------------------------------------------------|
| `./scripts/build.sh`     | Construye las imágenes Docker                        |
| `./scripts/start.sh`     | Levanta el entorno completo (build + up + wait)      |
| `./scripts/stop.sh`      | Detiene y limpia el entorno                          |
| `./scripts/healthcheck.sh` | Health check cada 5 segundos                        |
| `./scripts/dev.sh`       | Desarrollo local con auto-rebuild                    |

### Desarrollo local (opcional)

```bash
# Con Docker (auto-rebuild ante cambios)
./scripts/dev.sh --docker

# Sin Docker (requiere Node.js local)
npm install
./scripts/dev.sh --local
```

---

## Decisiones técnicas

### Stack tecnológico

| Componente    | Tecnología          | Justificación                                                    |
|---------------|---------------------|------------------------------------------------------------------|
| Runtime       | Node.js 22 LTS      | LTS actual, rendimiento                                          |
| Lenguaje      | TypeScript 5        | Type safety, mejor DX y mantenibilidad                           |
| Framework     | Express 5           | Lightweight, ampliamente adoptado, soporte async nativo           |
| Validación    | Zod                 | Schema validation con inferencia de tipos TypeScript             |
| MD5           | `crypto` (nativo)   | No agrega dependencias externas, performante                     |
| Docs API      | swagger-ui-express  | Swagger UI integrado directamente en la app                        |
| Reverse proxy | Nginx 1.27          | Estándar de la industria, rate limiting, headers de seguridad    |
| Contenedores  | Docker multi-stage  |

### Códigos de error HTTP

| Código | Uso                           | Justificación                                                |
|--------|-------------------------------|--------------------------------------------------------------|
| 200    | MD5 válido                    | Operación exitosa                                            |
| 400    | Campos faltantes/inválidos    | El request es sintácticamente incorrecto                     |
| 422    | MD5 no coincide               | El request es válido pero semánticamente incorrecto          |
| 404    | Endpoint no existe            | Ruta no encontrada                                           |
| 500    | Error interno                 | Error inesperado del servidor                                |

**Nota**: Se eligió `422 Unprocessable Entity` para el mismatch de MD5 porque el request es sintácticamente correcto (JSON válido, campos presentes) pero semánticamente inválido (el hash no coincide).

---

## Cálculo del MD5

### Método

El MD5 se calcula sobre el campo `json_body` del request, utilizando **serialización canónica** (keys ordenadas recursivamente).

### Proceso paso a paso

1. Se toma el valor del campo `json_body` del request
2. Se serializa usando **canonical JSON** (keys ordenadas lexicográficamente, recursivo)
3. Se calcula el hash MD5 del string resultante (codificación UTF-8)
4. Se compara con el campo `md5` recibido (case-insensitive)

### Ejemplo detallado

```
Input json_body:   { "b": 2, "a": 1 }
Canonical JSON:    {"a":1,"b":2}         ← keys ordenadas
MD5:               608de49a4600dbb5b173492759792e4a
```

### ¿Por qué serialización canónica?

- **Determinismo**: `{ "a": 1, "b": 2 }` y `{ "b": 2, "a": 1 }` producen el mismo hash
- **Reproducibilidad**: El cliente puede calcular el MD5 exactamente igual
- **Interoperabilidad**: No depende de la implementación JSON del lenguaje del cliente

### Cómo generar el MD5 como cliente

```bash
# Python
python3 -c "import hashlib; print(hashlib.md5('{\"key\":\"value\"}'.encode()).hexdigest())"

# Node.js
node -e "console.log(require('crypto').createHash('md5').update('{\"key\":\"value\"}').digest('hex'))"
```

**Importante**: Asegurate de que las keys estén ordenadas antes de calcular el hash.

---

## Supuestos y limitaciones

### Supuestos

- El campo `json_body` puede contener cualquier valor JSON válido (objeto, array, string, número, booleano, null)
- El MD5 se compara case-insensitive (acepta mayúsculas y minúsculas)
- El body del request no excede 1MB (límite de seguridad configurado en Express)
- Los servicios corren en una red Docker interna; solo Nginx expone el puerto 80

### Limitaciones

- **MD5 no es seguro criptográficamente**: MD5 tiene vulnerabilidades conocidas. Para producción se recomendaría SHA-256
- **Sin persistencia**: La API no almacena datos; cada request es stateless
- **Sin autenticación**: No hay auth implementado
- **Sin HTTPS**: El entorno usa HTTP; en producción se necesitaría TLS
- **Rate limiting básico**: 10 req/s por IP; configurable pero no distribuido
- **Sin tests unitarios**: Por alcance del ejercicio no se incluyen, pero serían necesarios en producción

---

## Riesgos y producción

### Riesgos de la solución actual

| Riesgo                          | Impacto | Mitigación propuesta                                    |
|---------------------------------|---------|----------------------------------------------------------|
| MD5 es vulnerable               | Alto    | Migrar a SHA-256                                         |
| Sin HTTPS                       | Alto    | Implementar TLS                                          |
| Sin autenticación               | Alto    | Agregar API keys                                         |
| Rate limiting no distribuido    | Alto    | Usar Redis como backend                                  |
| Sin monitoreo                   | Alto    | Integrar Prometheus + Grafana + alertas                  |
| Imagen Docker puede tener CVEs  | Medio   | Escanear con Trivy/Snyk en CI                            |
| Sin tests unitarios             | Medio   | Agregar Jest/Vitest con cobertura                        |
| Logs no centralizados           | Alto    | Integrar ELK/Loki para log aggregation                   |

### Qué ajustaría para producción

#### Despliegue y orquestación
- **Kubernetes** para orquestación, con Deployments, Services e Ingress
- **Helm charts** para configuración declarativa y templating
- **GitOps** con ArgoCD para deployments automáticos
- **Blue-green** o **canary deployments** para releases sin downtime

#### Rollback
- **Versionado semántico** de imágenes Docker (no usar `latest`)
- **Image tags inmutables** basados en git SHA + semver
- Rollback con `kubectl rollout undo` o revert del commit en GitOps
- **Database migrations** con herramientas de rollback 

#### Logs y observabilidad
- **Structured logging** con JSON (ya implementado en Nginx)
- **ELK Stack** (Elasticsearch + Logstash + Kibana) o **Loki + Grafana**
- **Correlation IDs** (request ID) propagados entre servicios
- Niveles de log configurables por entorno

#### Métricas y alertas
- **Prometheus** para métricas de la aplicación (latencia, errores, throughput)
- **Grafana** dashboards con SLOs/SLIs
- **Alertmanager** con alertas a Slack
- Métricas RED: Rate, Errors, Duration

#### Secrets
- **Vault** (HashiCorp) o **AWS Secrets Manager** para gestión de secrets
- **Kubernetes Secrets** encriptados con **Sealed Secrets** 
- Nunca hardcodear secrets en código ni en imágenes Docker
- Rotación automática de secrets

#### Seguridad
- **HTTPS/TLS** obligatorio con cert-manager
- **Network policies** en Kubernetes 
- **Escaneo de imágenes** con Trivy en CI/CD
- **RBAC** para control de acceso
- **Pod Security Standards** 
- **Web Application Firewall** (WAF) en el ingress
- Auditoría y compliance logging

#### Escalabilidad
- **Horizontal Pod Autoscaler** (HPA) basado en CPU/memoria/custom metrics
- **Load balancing** con Ingress Controller (nginx-ingress o Envoy)
- **Connection pooling** y circuit breakers si se conecta a bases de datos
- **CDN** para assets estáticos
- **Redis** para caching y rate limiting distribuido

#### Registry y versionado de imágenes
- **Registry privado** ECR
- Tags inmutables
- **Política de retención** de imágenes
- **Vulnerability scanning** automático en el registry

#### Límites de recursos
- **Resource requests/limits** en Kubernetes (CPU, memoria)
- **LimitRanges** y **ResourceQuotas** por namespace
- **PodDisruptionBudgets** para alta disponibilidad
- **Quality of Service** 

---

## Estructura del proyecto

```
challenge-urbetrack/
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline CI/CD
├── nginx/
│   ├── Dockerfile              # Imagen Nginx custom
│   └── nginx.conf              # Configuración reverse proxy
├── scripts/
│   ├── build.sh                # Construir imágenes Docker
│   ├── start.sh                # Levantar entorno
│   ├── stop.sh                 # Detener entorno
│   ├── healthcheck.sh          # Health check cada 5s
│   └── dev.sh                  # Desarrollo local (opcional)
├── src/
│   ├── app.ts                  # Configuración Express
│   ├── server.ts               # Entry point
│   ├── openapi.ts              # Spec OpenAPI 3.0
│   ├── routes/
│   │   ├── health.ts           # GET /health
│   │   └── validate-md5.ts     # POST /validate-md5
│   └── utils/
│       └── md5.ts              # Cálculo MD5 canónico
├── .dockerignore
├── .gitignore
├── Dockerfile                  # Multi-stage build API
├── docker-compose.yml          # API + Nginx
├── package.json
├── tsconfig.json
└── README.md                   
```

---

