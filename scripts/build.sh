#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GIT_SHA=$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || echo "latest")
IMAGE_TAG="${IMAGE_TAG:-$GIT_SHA}"

echo "Build images (tag: $IMAGE_TAG)..."

cd "$PROJECT_DIR"

echo ""
echo "Build Image API"
docker compose build api

echo ""
echo "Build Image Nginx"
docker compose build nginx

echo ""
echo "Build images completed (tag: $IMAGE_TAG)"
docker compose images
