#!/usr/bin/env bash
# healthcheck.sh — Ejecuta health check cada 5 segundos contra /health
# Uso: ./scripts/healthcheck.sh [URL]
# Default URL: http://localhost/health
# Presionar Ctrl+C para detener
set -euo pipefail

URL="${1:-http://localhost/health}"
INTERVAL=5

echo "Health check monitor"
echo "========================"
echo "URL:      $URL"
echo "Interval: ${INTERVAL}s"
echo "Press Ctrl+C to stop"
echo "------------------------"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Realizar request y capturar código HTTP y body
    HTTP_CODE=$(curl -s -o /tmp/healthcheck_response.txt -w "%{http_code}" "$URL" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        BODY=$(cat /tmp/healthcheck_response.txt 2>/dev/null || echo "")
        echo "[$TIMESTAMP] HTTP $HTTP_CODE — $BODY"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo "[$TIMESTAMP] CONNECTION FAILED — Service unreachable"
    else
        echo "[$TIMESTAMP] HTTP $HTTP_CODE — Unexpected status"
    fi

    sleep $INTERVAL
done
