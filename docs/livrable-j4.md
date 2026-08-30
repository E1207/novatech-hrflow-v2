# Livrable Jour 4 — Monitoring, Alerting & Ops

## Ce qui est livré

- **Métriques Prometheus** exposées sur le Gateway et les 4 services :
  - `http_requests_total`
  - `http_request_duration_seconds`
  - `http_request_errors_total`
  - métriques système par défaut de `prom-client`
- **Dashboard Grafana** (source JSON) : [monitoring/grafana-dashboard.json](../monitoring/grafana-dashboard.json)
- **Règles d'alertes** :
  - alerte `HrflowHighErrorRate`
  - alerte `HrflowHighLatencyP99`
- **Stack Azure opérationnel** :
  - Prometheus
  - Alertmanager
  - Grafana
  - alert sink
- **Stack local reproductible** :
  - Prometheus
  - Alertmanager
  - Grafana
- **OpenAPI** pour les 4 services backend
- **Runbook d'incident** step-by-step

## Validation

### 1. Vérifier les métriques

Ouvrir :

- `/metrics` sur le gateway
- `/metrics` sur chacun des microservices

### 2. Vérifier le dashboard Azure

Ouvrir Grafana :

`https://hrflow-grafana.salmonsand-7377abaa.francecentral.azurecontainerapps.io`

### 3. Vérifier le dashboard local (optionnel)

Lancer le stack local :

```bash
docker compose -f monitoring/docker-compose.yml up -d
```

Puis ouvrir Grafana sur `http://localhost:3001`.

### 4. Vérifier les alertes

Les alertes sont déclenchées si :

- le taux d'erreur 5xx dépasse 5% pendant 2 minutes
- la latence P99 dépasse 1 seconde pendant 5 minutes

### 5. Vérifier la doc OpenAPI

Consulter :

- `docs/openapi/auth.yaml`
- `docs/openapi/conges.yaml`
- `docs/openapi/paie.yaml`
- `docs/openapi/recrutement.yaml`

## Remarque

Le projet utilise une stack Azure en production, mais le modèle de monitoring
reste portable vers Prometheus/Grafana/Alertmanager standard.
