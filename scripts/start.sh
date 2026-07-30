#!/usr/bin/env bash
# start.sh — Levanta el entorno completo (API + Nginx)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Start services"

cd "$PROJECT_DIR"

# Build si no existen las imágenes
docker compose build

# Levantar servicios en background
docker compose up -d

echo ""
echo "Wait Services Healthy"

# Esperar a que los servicios estén healthy (máximo 60 segundos)
TIMEOUT=60
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
    API_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' challenge-api 2>/dev/null || echo "starting")
    NGINX_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' challenge-nginx 2>/dev/null || echo "starting")

    if [ "$API_HEALTH" = "healthy" ] && [ "$NGINX_HEALTH" = "healthy" ]; then
        echo ""
        echo "All services are healthy!"
        echo ""
        echo "Swagger UI:    http://localhost/api-docs"
        echo "Health check:  http://localhost/health"
        echo "Validate MD5:  POST http://localhost/validate-md5"
        echo ""
        docker compose ps
        exit 0
    fi

    printf "\r   API: %-10s | Nginx: %-10s (${ELAPSED}s/${TIMEOUT}s)" "$API_HEALTH" "$NGINX_HEALTH"
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

echo ""
echo "Timeout esperando servicios healthy. Estado actual:"
docker compose ps
exit 1
