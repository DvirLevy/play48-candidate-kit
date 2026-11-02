#!/usr/bin/env bash
# Runs the whole stack (Postgres + backend + frontend) in Docker.
#
#   ./scripts/docker.sh up       build and start everything in the background (default)
#   ./scripts/docker.sh down     stop and remove the containers (keeps the database volume)
#   ./scripts/docker.sh reset    like down, but also deletes the database volume
#   ./scripts/docker.sh logs     follow logs of all services
#   ./scripts/docker.sh ps       show service status
#   ./scripts/docker.sh restart  down + up
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="backend/.env"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f docker-compose.yml)

die() { echo "error: $*" >&2; exit 1; }

env_value() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- || true; }

preflight() {
  command -v docker >/dev/null || die "docker is not installed"
  docker info >/dev/null 2>&1 || die "the Docker daemon is not running"
  [[ -f "$ENV_FILE" ]] || die "$ENV_FILE not found (it holds the API keys and is not committed)"
  [[ -f frontend/.env ]] || echo "warn: frontend/.env missing, the frontend will use its default API URL"

  # Warn about host ports held by something other than this stack
  local port_api port_db
  port_api="$(env_value PORT)"; port_api="${port_api:-4000}"
  port_db="$(env_value POSTGRES_PORT)"; port_db="${port_db:-5433}"
  for port in "$port_api" "$port_db" 5173; do
    local owner
    owner="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | awk 'NR>1{print $1}' | sort -u | tr '\n' ' ' || true)"
    if [[ -n "$owner" && "$owner" != *docker* && "$owner" != *com.docke* ]]; then
      echo "warn: port $port is in use by: $owner (the stack may fail to start)"
    fi
  done
}

up() {
  preflight
  "${COMPOSE[@]}" up --build -d --remove-orphans
  local api; api="$(env_value PORT)"; api="${api:-4000}"
  echo
  echo "Waiting for the API to become healthy..."
  for _ in $(seq 1 60); do
    if curl -fsS "http://localhost:${api}/health/ready" >/dev/null 2>&1; then
      echo
      echo "  Frontend : http://localhost:5173"
      echo "  API      : http://localhost:${api}"
      echo "  Swagger  : http://localhost:${api}/docs"
      echo "  Logs     : ./scripts/docker.sh logs"
      return 0
    fi
    sleep 2
  done
  echo "The API did not become ready in time. Check: ./scripts/docker.sh logs" >&2
  exit 1
}

case "${1:-up}" in
  up) up ;;
  down) "${COMPOSE[@]}" down --remove-orphans ;;
  reset) "${COMPOSE[@]}" down --remove-orphans --volumes ;;
  logs) "${COMPOSE[@]}" logs -f --tail 100 ;;
  ps) "${COMPOSE[@]}" ps ;;
  restart) "${COMPOSE[@]}" down --remove-orphans; up ;;
  *) die "unknown command '$1' (use: up | down | reset | logs | ps | restart)" ;;
esac
