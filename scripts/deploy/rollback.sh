#!/bin/bash
# Rollback Azure Container Apps : bascule 100% du trafic vers la révision
# précédente (immuable, toujours disponible) et mesure le temps écoulé.
#
# Usage :
#   rollback.sh auto                 -> lit rollback-state.env (généré par
#                                        blue-green-deploy.sh dans le même run)
#                                        et revient en arrière pour tous les
#                                        services déployés.
#   rollback.sh <app> <revision>     -> rollback manuel/chronométré d'un seul
#                                        service vers une révision précise
#                                        (utilisé par le runbook d'incident et
#                                        par le workflow rollback.yml).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source ./apps.sh

START=$(date +%s)

rollback_one() {
  local app=$1 revision=$2
  echo "=== Rollback $app -> $revision ==="
  az containerapp ingress traffic set -g "$RG" -n "$app" \
    --revision-weight "$revision=100" -o none
  echo "  ✅ 100% du trafic de $app redirigé vers $revision"
}

if [ "${1:-}" = "auto" ]; then
  STATE_FILE="rollback-state.env"
  [ -f "$STATE_FILE" ] || { echo "::error::$STATE_FILE introuvable, rollback impossible"; exit 1; }
  # shellcheck disable=SC1090
  source "$STATE_FILE"
  for entry in "${APPS[@]}"; do
    IFS='|' read -r app _ _ <<< "$entry"
    var="${app//-/_}_PREVIOUS_REVISION"
    previous="${!var:-}"
    [ -n "$previous" ] || { echo "::warning::pas de révision précédente connue pour $app, ignoré"; continue; }
    rollback_one "$app" "$previous"
  done
else
  APP=${1:?usage: rollback.sh <app> <revision>}
  REVISION=${2:?usage: rollback.sh <app> <revision>}
  rollback_one "$APP" "$REVISION"
fi

END=$(date +%s)
ELAPSED=$((END - START))
echo "⏱  Rollback terminé en ${ELAPSED}s (objectif < 600s / 10 min)"
if [ "$ELAPSED" -gt 600 ]; then
  echo "::warning::Rollback plus long que l'objectif de 10 minutes"
fi
