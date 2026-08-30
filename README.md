# HRFlow — Plateforme RH SaaS

HRFlow est une plateforme RH monorepo pour PME : congés, paie, recrutement, auth,
API gateway, frontend React et pipeline CI/CD complet.

## Architecture

- Frontend React 18 : `frontend/`
- API Gateway Express : `services/api-gateway/`
- Microservices : `services/auth/`, `services/paie/`, `services/conges/`, `services/recrutement/`
- Base de données : PostgreSQL
- Infra de prod : Azure Container Apps + ACR + Key Vault + PostgreSQL Flexible Server

Voir aussi :
- [docs/architecture.md](docs/architecture.md)
- [docs/livrable-j3.md](docs/livrable-j3.md)
- [docs/livrable-j4.md](docs/livrable-j4.md)

## Démarrage local

```bash
npm install
cp .env.example .env
npm run dev
```

Le frontend est dans `frontend/` et le gateway expose l'API sur le port 3000.

## Variables d’environnement

### Frontend

- `REACT_APP_API_URL` : URL du gateway, ex:
  `https://hrftlow-api.salmonsand-7377abaa.francecentral.azurecontainerapps.io/api`

### Backend

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `FEATURE_HEURES_SUP_V2`

## Commandes utiles

```bash
npm run lint
npm run test:coverage
npm run test:e2e
```

## CI/CD

Pipeline GitHub Actions :
- Build
- Test
- Security
- Staging
- Production

Voir [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Monitoring & Ops

- Prometheus / Grafana / Alertmanager : [`monitoring/`](monitoring/)
- Runbook incident : [`docs/runbook-j4.md`](docs/runbook-j4.md)
- Runbook rollback : [`docs/runbook-incident.md`](docs/runbook-incident.md)
- OpenAPI : [`docs/openapi/`](docs/openapi/)

## Déploiement

Le déploiement de production repose sur Azure Container Apps en Blue/Green.
Le rollback est automatisé et testable via :

```bash
bash scripts/deploy/rollback.sh <service> <revision>
```

## Smoke tests

```bash
bash scripts/deploy/smoke-test.sh
```

## Documentation finale

- [Rapport technique final](docs/rapport-technique-final.md)
- [Support de soutenance](docs/support-soutenance.md)

