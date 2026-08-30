#!/bin/bash
# Déploiement Blue/Green sur Azure Container Apps.
#
# Pour chaque service :
#   1. crée une nouvelle révision ("green") à partir de l'image taguée avec le
#      SHA du commit, sans lui donner de trafic (0%) ;
#   2. attend qu'elle soit "Healthy" (probes Container Apps) ;
#   3. bascule 100% du trafic dessus (cutover atomique, zero-downtime) ;
#   4. conserve l'ancienne révision ("blue") active en arrière-plan pour un
#      rollback immédiat si les smoke tests post-cutover échouent.
#
# L'état avant/après est écrit dans rollback-state.env pour être réutilisé par
# rollback.sh en cas d'échec des smoke tests dans le même run.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source ./apps.sh

: "${IMAGE_TAG:?IMAGE_TAG requis (ex: SHA du commit)}"
: "${ACR_LOGIN_SERVER:?ACR_LOGIN_SERVER requis}"

REVISION_SUFFIX="gh${IMAGE_TAG:0:8}"
STATE_FILE="rollback-state.env"
: > "$STATE_FILE"

wait_healthy() {
  local app=$1 revision=$2
  for _ in $(seq 1 30); do
    local state
    state=$(az containerapp revision show -g "$RG" -n "$app" --revision "$revision" \
      --query "properties.healthState" -o tsv 2>/dev/null || echo "")
    if [ "$state" = "Healthy" ]; then
      return 0
    fi
    sleep 5
  done
  echo "::error::$app revision $revision n'est jamais devenue Healthy"
  return 1
}

for entry in "${APPS[@]}"; do
  IFS='|' read -r app image external <<< "$entry"
  echo "=== $app : déploiement de la revision $REVISION_SUFFIX ==="

  previous_revision=$(az containerapp revision list -g "$RG" -n "$app" \
    --query "[?properties.active && properties.trafficWeight==\`100\`].name | [0]" -o tsv)
  echo "${app//-/_}_PREVIOUS_REVISION=$previous_revision" >> "$STATE_FILE"
  echo "  revision active avant déploiement : $previous_revision"

  az containerapp update -g "$RG" -n "$app" \
    --image "$ACR_LOGIN_SERVER/hrflow-$image:$IMAGE_TAG" \
    --revision-suffix "$REVISION_SUFFIX" \
    -o none

  new_revision="${app}--${REVISION_SUFFIX}"
  echo "  attente de l'état Healthy pour $new_revision..."
  wait_healthy "$app" "$new_revision"

  echo "  cutover : bascule 100% du trafic vers $new_revision"
  az containerapp ingress traffic set -g "$RG" -n "$app" \
    --revision-weight "$new_revision=100" -o none

  echo "${app//-/_}_NEW_REVISION=$new_revision" >> "$STATE_FILE"
  echo "  ✅ $app basculé sans interruption de service"
done

echo "État de déploiement enregistré dans $STATE_FILE"
cat "$STATE_FILE"
