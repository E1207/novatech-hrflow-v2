# Runbook incident — J4

## 1. Détection

1. Ouvrir Grafana.
2. Vérifier :
   - latence P99
   - taux d'erreur
   - saturation (CPU/RAM si exposée)
3. Confirmer l'alerte via Alertmanager / Slack.

## 2. Triage

- Identifier le service en erreur.
- Vérifier `/health`.
- Vérifier `/metrics`.
- Corréler avec le déploiement le plus récent.

## 3. Action immédiate

Si l'incident vient d'un déploiement :

```bash
bash scripts/deploy/rollback.sh <service> <revision_saine>
```

## 4. Vérification

- `curl /health`
- tester l'endpoint métier du service touché
- vérifier que l'alerte disparaît

## 5. Post-mortem

- cause racine
- durée
- impact client
- action corrective
- action préventive
