#!/bin/bash
# Smoke tests post-cutover exécutés contre le Gateway public, juste après le
# basculement Blue/Green. Un échec ici déclenche le rollback automatique
# (voir le job "production" de .github/workflows/deploy.yml).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source ./apps.sh

GATEWAY_FQDN=$(az containerapp show -g "$RG" -n hrftlow-api \
  --query "properties.configuration.ingress.fqdn" -o tsv)
FRONTEND_FQDN=$(az containerapp show -g "$RG" -n hrflow-frontend \
  --query "properties.configuration.ingress.fqdn" -o tsv)
BASE="https://$GATEWAY_FQDN"

check() {
  local name=$1 method=$2 url=$3 expected=$4 body=${5:-}
  local args=(-s -o /dev/null -w "%{http_code}" --max-time 20 -X "$method" "$url")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  local status curl_exit
  for attempt in 1 2 3; do
    status=""
    curl_exit=0
    status=$(curl "${args[@]}") || curl_exit=$?
    if [ "$curl_exit" -eq 0 ] && [ "$status" = "$expected" ]; then
      echo "  ✅ $name -> $status"
      return 0
    fi
    sleep 2
  done
  if [ "$curl_exit" -ne 0 ]; then
    echo "::error::Smoke test '$name' a échoué (curl exit=$curl_exit, attendu $expected)"
    return 1
  fi
  echo "::error::Smoke test '$name' a échoué (attendu $expected, reçu $status)"
  return 1
}

echo "=== Smoke tests post-cutover ($BASE) ==="
check "gateway health"        GET  "$BASE/health"                       200
check "frontend"              GET  "https://$FRONTEND_FQDN/"            200
check "conges solde"          GET  "$BASE/api/conges/solde/1"           200
check "recrutement candidats" GET  "$BASE/api/recrutement/candidats"    200
check "paie calculer"         POST "$BASE/api/paie/calculer"            200 '{"employeeId":1,"mois":1,"annee":2026}'
check "auth verify (invalid)" POST "$BASE/api/auth/verify"              401 '{"token":"invalid"}'

echo "Tous les smoke tests sont passés — cutover confirmé."
