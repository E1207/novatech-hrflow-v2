#!/bin/bash
# Table de correspondance Container App <-> image ACR, partagée par les scripts
# de déploiement Blue/Green, de smoke test et de rollback.
#
# Format : "<container-app-name>|<image-repo-name>|<external:true|false>"
APPS=(
  "hrflow-frontend|hrflow-frontend|true"
  "hrftlow-api|hrflow-api-gateway|true"
  "hrflow-auth|hrflow-auth|false"
  "hrflow-paie|hrflow-paie|false"
  "hrflow-conges|hrflow-conges|false"
  "hrflow-recrutement|hrflow-recrutement|false"
)

RG="${RG:-rg-hrflow}"
