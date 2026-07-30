# 1: Builder — instala dependencias y compilar TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

# 2: Copiar archivos de dependencias primero (para aprovechar cache de Docker layers)
COPY package.json package-lock.json* ./

# 3: Instalar todas las dependencias 
RUN npm ci

# 4: Copiar código fuente
COPY tsconfig.json ./
COPY src ./src

# 5: Compilar TypeScript a JavaScript
RUN npm run build

# 6: Runner — imagen de producción 
FROM node:22-alpine AS runner

# 7: Metadata OCI estándar
LABEL org.opencontainers.image.title="challenge-urbetrack-api" \
      org.opencontainers.image.description="API REST" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.source="https://github.com/challenge-urbetrack"

WORKDIR /app

# 8: Copiar solo archivos de dependencias de producción
COPY package.json package-lock.json* ./

# 9: Instalar solo dependencias de producción (sin devDependencies)
RUN npm ci --omit=dev && npm cache clean --force

# 10: Copiar código compilado desde el builder
COPY --from=builder /app/dist ./dist

# 11: Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

# 12: Puerto por defecto de la API
ENV PORT=3000
EXPOSE 3000

# 13: Health check integrado en la imagen
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# 14: Iniciar la aplicación
CMD ["node", "dist/server.js"]
