# HRFlow — Plateforme RH SaaS

Plateforme de gestion RH pour les PME françaises.

## Stack
- Frontend : React 18
- Backend : Node.js / Express
- BDD : PostgreSQL + Redis
- Infra : OVH VPS + Nginx

## Installation
```bash
npm install
cp .env.example .env  # remplir les valeurs
npm run dev
```

## Déploiement
Voir Théo.

## Architecture
Voir [docs/architecture.md](/Users/emmanuel/Downloads/novatech-hrflow-v2.worktrees/project-analysis-and-deliverables-review/docs/architecture.md)
et les livrables par jour dans [docs/](/Users/emmanuel/Downloads/novatech-hrflow-v2.worktrees/project-analysis-and-deliverables-review/docs).

## Tests
```bash
npm run test:coverage
npm run lint
```

## Monitoring & Ops
- Prometheus / Grafana / Alertmanager : [monitoring/](/Users/emmanuel/Downloads/novatech-hrflow-v2.worktrees/project-analysis-and-deliverables-review/monitoring)
- Runbook incident : [docs/runbook-j4.md](/Users/emmanuel/Downloads/novatech-hrflow-v2.worktrees/project-analysis-and-deliverables-review/docs/runbook-j4.md)
- OpenAPI :
  - [auth.yaml](/Users/emmanuel/Downloads/novatech-hrflow-v2.worktrees/project-analysis-and-deliverables-review/docs/openapi/auth.yaml)
  - [conges.yaml](/Users/emmanuel/Downloads/novatech-hrflow-v2.worktrees/project-analysis-and-deliverables-review/docs/openapi/conges.yaml)
  - [paie.yaml](/Users/emmanuel/Downloads/novatech-hrflow-v2.worktrees/project-analysis-and-deliverables-review/docs/openapi/paie.yaml)
  - [recrutement.yaml](/Users/emmanuel/Downloads/novatech-hrflow-v2.worktrees/project-analysis-and-deliverables-review/docs/openapi/recrutement.yaml)

---
*Dernière mise à jour : mars 2022*
