#!/usr/bin/env bash
# dev.sh — Desarrollo local con rebuild/restart automático ante cambios
# Opciones:
#   --local    Ejecutar con nodemon (sin Docker)
#   --docker   Ejecutar con Docker Compose watch (default)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MODE="${1:---docker}"

cd "$PROJECT_DIR"

case "$MODE" in
    --local)
        echo "Start local development server"
        echo "=================================================="
        echo "The server will restart automatically on file changes."
        echo ""
        npm run dev
        ;;
    --docker)
        echo "Start Docker development with auto-rebuild..."
        echo "====================================================="
        echo "Services will rebuild automatically on file changes."
        echo ""
        # Usar docker compose watch (requiere Docker Compose v2.22+)
        # Fallback a rebuild manual si watch no está disponible
        if docker compose version 2>/dev/null | grep -q "v2\.\(2[2-9]\|[3-9][0-9]\)"; then
            docker compose up --build --watch
        else
            echo "Docker Compose watch not available. Using build + up..."
            echo "For auto-rebuild, update Docker Compose to v2.22+"
            docker compose up --build
        fi
        ;;
    *)
        echo "Usage: $0 [--local|--docker]"
        echo "  --local   Run with nodemon (no Docker)"
        echo "  --docker  Run with Docker Compose watch (default)"
        exit 1
        ;;
esac
