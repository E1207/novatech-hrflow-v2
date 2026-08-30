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

set_registry_credentials() {
  local app=$1
  if [ -n "${ACR_USERNAME:-}" ] && [ -n "${ACR_PASSWORD:-}" ]; then
    az containerapp registry set -g "$RG" -n "$app" \
      --server "$ACR_LOGIN_SERVER" \
      --username "$ACR_USERNAME" \
      --password "$ACR_PASSWORD" \
      -o none
  fi
}

target_min_replicas() {
  local app=$1
  case "$app" in
    hrflow-frontend|hrftlow-api|hrflow-auth) echo 1 ;;
    *) echo 0 ;;
  esac
}

wait_ready() {
  local app=$1 revision=$2
  for _ in $(seq 1 36); do
    local state health running provisioning
    state=$(az containerapp revision show -g "$RG" -n "$app" --revision "$revision" \
      --query "[properties.healthState,properties.runningState,properties.provisioningState]" \
      -o tsv 2>/dev/null || echo "")
    health=$(echo "$state" | awk 'NR==1 {print $1}')
    running=$(echo "$state" | awk 'NR==1 {print $2}')
    provisioning=$(echo "$state" | awk 'NR==1 {print $3}')

    if [[ "$running" == "Failed" || "$provisioning" == "Failed" ]]; then
      echo "::error::$app revision $revision est en échec (running=$running, provisioning=$provisioning, health=$health)"
      az containerapp revision show -g "$RG" -n "$app" --revision "$revision" \
        --query "{health:properties.healthState,running:properties.runningState,provisioning:properties.provisioningState,image:properties.template.containers[0].image}" \
        -o json || true
      return 1
    fi

    if [[ "$health" == "Healthy" || "$running" == Running* ]]; then
      return 0
    fi
    sleep 5
  done
  echo "::error::$app revision $revision n'est jamais devenue prête (Healthy/Running)"
  az containerapp revision show -g "$RG" -n "$app" --revision "$revision" \
    --query "{health:properties.healthState,running:properties.runningState,provisioning:properties.provisioningState,image:properties.template.containers[0].image}" \
    -o json || true
  return 1
}

for entry in "${APPS[@]}"; do
  IFS='|' read -r app image external <<< "$entry"
  echo "=== $app : déploiement de la revision $REVISION_SUFFIX ==="

  previous_revision=$(az containerapp revision list -g "$RG" -n "$app" \
    --query "[?properties.active && properties.trafficWeight==\`100\`].name | [0]" -o tsv)
  echo "${app//-/_}_PREVIOUS_REVISION=$previous_revision" >> "$STATE_FILE"
  echo "  revision active avant déploiement : $previous_revision"

  set_registry_credentials "$app"
  min_replicas=$(target_min_replicas "$app")
  az containerapp update -g "$RG" -n "$app" \
    --image "$ACR_LOGIN_SERVER/$image:$IMAGE_TAG" \
    --min-replicas "$min_replicas" \
    --revision-suffix "$REVISION_SUFFIX" \
    -o none

  new_revision="${app}--${REVISION_SUFFIX}"
  echo "  attente de l'état Ready pour $new_revision..."
  wait_ready "$app" "$new_revision"

  echo "  cutover : bascule 100% du trafic vers $new_revision"
  az containerapp ingress traffic set -g "$RG" -n "$app" \
    --revision-weight "$new_revision=100" -o none

  echo "${app//-/_}_NEW_REVISION=$new_revision" >> "$STATE_FILE"
  echo "  ✅ $app basculé sans interruption de service"
done

echo "État de déploiement enregistré dans $STATE_FILE"
cat "$STATE_FILE"
