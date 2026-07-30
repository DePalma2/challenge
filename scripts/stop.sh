#!/usr/bin/env bash
# stop.sh — Detiene y limpia el entorno
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Stop services"

cd "$PROJECT_DIR"

docker compose down --remove-orphans

echo ""
echo "Services stopped and cleaned up"
