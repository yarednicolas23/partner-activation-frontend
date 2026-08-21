#!/usr/bin/env bash
# Build + push de la imagen del frontend a ECR. Requiere Docker corriendo y
# AWS CLI configurado. Uso: ./push-image.sh [tag]
#
# --platform linux/amd64 es obligatorio: App Runner solo corre x86_64, y un
# `docker build` sin esa flag en una Mac Apple Silicon produce una imagen
# arm64 que el runtime ni siquiera puede ejecutar (falla sin logs).
set -euo pipefail

TAG="${1:-latest}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

REPO_URL="$(terraform -chdir="$TERRAFORM_DIR" output -raw ecr_repository_url)"
REGISTRY="${REPO_URL%%/*}"
REGION="$(echo "$REGISTRY" | cut -d. -f4)"

# NEXT_PUBLIC_* deben venir del .env del frontend — se inlinean en el build,
# no se pueden setear después en runtime.
if [ ! -f "$FRONTEND_DIR/.env" ]; then
  echo "Falta $FRONTEND_DIR/.env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "$FRONTEND_DIR/.env"
set +a

echo "==> Repo: $REPO_URL"
echo "==> Tag:  $TAG"

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -t "$REPO_URL:$TAG" "$FRONTEND_DIR" --push

echo "==> Listo: $REPO_URL:$TAG"
