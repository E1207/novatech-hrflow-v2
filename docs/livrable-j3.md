# Livrable Jour 3 — Staging, CD & Feature Flags

## Choix d'infrastructure : Azure au lieu d'AWS

Le brief Partech mentionne un budget sandbox AWS. Par contrainte de délai et de
disponibilité de crédits, l'équipe a réalisé ce livrable sur **Azure**
(souscription sandbox `Training`), avec des services strictement équivalents :
Azure Container Apps (≈ ECS Fargate + ALB), Azure Container Registry (≈ ECR),
Azure Database for PostgreSQL Flexible Server, Azure Key Vault (≈ AWS Secrets
Manager). Les mécanismes démontrés (Blue/Green, rollback, feature flag,
secrets managés) sont transposables 1:1 sur AWS si le budget le permet plus
tard — voir la section "Portabilité AWS" en fin de document.

## 1. Infrastructure cloud opérationnelle

**Resource group** `rg-hrflow` (région `francecentral`) :

| Ressource | Nom | Rôle |
| --- | --- | --- |
| Azure Container Registry | `hrflowacr` | Registre des images Docker (staging) |
| Container Apps Environment | `managedEnvironment-rghrflow-a84e` | Environnement partagé des 6 apps |
| Container App (externe) | `hrflow-frontend` | Frontend React (Nginx) |
| Container App (externe) | `hrftlow-api` | API Gateway (proxy vers les 4 services) |
| Container App (interne) | `hrflow-auth` | Service Auth |
| Container App (interne) | `hrflow-paie` | Service Paie |
| Container App (interne) | `hrflow-conges` | Service Congés |
| Container App (interne) | `hrflow-recrutement` | Service Recrutement |
| PostgreSQL Flexible Server | `hrflow-db` | Base de données applicative |
| Key Vault | `hrflow-kv` | Secrets (DB, JWT, Stripe) |

Seuls le frontend et l'API Gateway sont exposés publiquement (`ingress:
external`) ; les 4 microservices sont en `ingress: internal`, uniquement
joignables depuis le Gateway au sein de l'environnement Container Apps —
réduction de la surface d'attaque identifiée dans l'audit Partech (accès
direct aux microservices non requis).

### Secrets : suppression des valeurs en clair

Les secrets (`db-host`, `db-password`, `jwt-secret`, `stripe-secret-key`,
`database-url`) sont stockés dans `hrflow-kv` et référencés par les Container
Apps via **identité managée système + `keyvaultref`** (aucune valeur en clair
dans la configuration des apps). Chaque app n'a accès qu'aux secrets dont elle
a besoin (rôle RBAC `Key Vault Secrets User` scopé par identité).

### Corrections apportées pendant la mise en place

En câblant l'infrastructure réelle, plusieurs bugs latents du code hérité ont
été révélés et corrigés :

- **Gateway** ([services/api-gateway/src/index.js](/services/api-gateway/src/index.js)) : les URLs des 4 services
  étaient en dur sur `localhost` (jamais fonctionnel hors environnement local)
  → passées en variables d'environnement `*_SERVICE_URL`. Absence de
  `pathRewrite` sur le proxy (`/api/paie/...` n'était jamais réécrit en
  `/paie/...` côté service) → ajouté.
- **Auth** ([services/auth/src/index.js](/services/auth/src/index.js)) : la connexion PostgreSQL ne déclarait
  pas `ssl`, provoquant un rejet immédiat par PostgreSQL managé (« no
  encryption ») et un crash du process (promesse rejetée non interceptée) →
  `ssl: { rejectUnauthorized: false }` ajouté (désactivable via `DB_SSL=false`
  en local).
- **Schéma de base de données** : aucun schéma n'existait ([scripts/db/schema.sql](/scripts/db/schema.sql)
  créé — tables `employees`, `conges`, `bulletins_paie`, `candidats`, `users`
  + données minimales de smoke test). L'absence de schéma provoquait un crash
  des services à la première requête (promesse Postgres rejetée non
  catchée) — **point d'attention robustesse** reporté au backlog technique :
  les routes métier devraient encapsuler leurs requêtes dans un `try/catch`
  pour éviter qu'une erreur SQL ne fasse crasher tout le service.

## 2. Pipeline CD : Staging → Production Blue/Green

Le pipeline (`.github/workflows/deploy.yml`) complète les stages J1/J2
(Build → Test → Security) avec deux stages supplémentaires, sans étape
manuelle :

```
Build → Test → Security → Staging (build & push images taguées SHA)
                              → Production (Blue/Green + smoke tests + rollback auto)
```

### Staging
Construit et pousse les 6 images vers `hrflowacr` avec un tag immuable
(SHA du commit) et le tag flottant `staging`.

### Production — Blue/Green
Script [scripts/deploy/blue-green-deploy.sh](/scripts/deploy/blue-green-deploy.sh), pour chacun des 6 services :
1. déploie une nouvelle révision ("green") à 0% de trafic ;
2. attend l'état `Healthy` (probes Container Apps) ;
3. bascule 100% du trafic sur la nouvelle révision (cutover atomique —
   l'ancienne révision reste active en arrière-plan, donc **zéro coupure**) ;
4. conserve la référence de la révision précédente pour un rollback immédiat.

Puis [scripts/deploy/smoke-test.sh](/scripts/deploy/smoke-test.sh) valide en conditions réelles, via le Gateway
public : `/health`, connexion frontend, `/api/conges/solde/:id`,
`/api/recrutement/candidats`, `/api/paie/calculer`, `/api/auth/verify`. Un
échec déclenche automatiquement [scripts/deploy/rollback.sh](/scripts/deploy/rollback.sh) `auto`, qui
rebascule chaque service vers sa révision précédente.

**Preuve d'exécution (démo manuelle, avant intégration continue complète)** :
séquence testée en conditions réelles le 29/08 — health check `200`,
`/api/conges/solde/1` → `200` (`{"solde":25,...}`), `/api/recrutement/candidats`
→ `200 []`, `/api/paie/calculer` → `200` (bulletin calculé), `/api/auth/login`
→ `401` (réponse métier correcte, pas d'erreur de connexion).

## 3. Feature flag démontré

Fonctionnalité choisie : calcul des heures supplémentaires
([services/paie/src/index.js](/services/paie/src/index.js), route `POST /paie/heures-sup`).

- **Flag** : `FEATURE_HEURES_SUP_V2` (variable d'environnement de la
  Container App `hrflow-paie`, lue à chaque requête — donc activable/
  désactivable **sans rebuild d'image ni redéploiement complet**, juste un
  `az containerapp update --set-env-vars`).
- **Comportement V1 (flag OFF, défaut)** : majoration flat 25 % —
  comportement historique inchangé (tests de non-régression conservés).
- **Comportement V2 (flag ON)** : taux progressif légal — 25 % jusqu'à 8h,
  50 % au-delà.
- **Validation réalisée** : pour 10h supplémentaires à un taux horaire de
  19,78 €, le flag OFF renvoie `majorationHeuresSup: 247.25`, le flag ON
  renvoie `257.14` — bascule confirmée en direct sur l'environnement staging,
  sans interruption de service, puis flag remis à OFF (état stable par
  défaut).
- Tests unitaires couvrant les deux états dans [tests/paie.test.js](/tests/paie.test.js).

## 4. Rollback chronométré

- **Script** : [scripts/deploy/rollback.sh](/scripts/deploy/rollback.sh), utilisable en mode `auto` (post-échec
  smoke test dans le pipeline) ou manuel `rollback.sh <app> <revision>`.
- **Workflow dédié** : `.github/workflows/rollback.yml` (`workflow_dispatch`),
  pour un rollback manuel chronométré en dehors du pipeline (simulation
  d'incident), avec vérification finale (`/health`).
- **Mesure réalisée** : rollback d'un service (bascule de trafic 100 % vers
  la révision précédente) exécuté en **17 secondes** — largement sous
  l'objectif de 10 minutes fixé par Partech. Le temps dominant d'un rollback
  réel sera l'investigation (identifier quelle révision est saine), pas la
  bascule technique elle-même.
- **Leçon retenue** : lors du premier essai, la « révision précédente »
  ciblée était une révision ancienne créée avant le câblage des secrets
  applicatifs (donc non fonctionnelle) — la bascule de trafic a réussi
  techniquement, mais vers une révision cassée. **Action runbook** : ne
  conserver comme cible de rollback que les 1-2 révisions les plus récentes
  et connues comme saines (voir `docs/runbook-incident.md`), et purger/
  désactiver les révisions obsolètes après chaque déploiement réussi.

## 5. Limites connues et suite

- Les 4 microservices n'ont pas de gestion d'erreur (`try/catch`) sur leurs
  routes : une erreur SQL fait crasher tout le process (Node 20 termine le
  process sur une promesse rejetée non interceptée). À corriger avant mise en
  production réelle.
- Une seule paire staging/production partagée (contrainte de temps/budget) :
  la "validation staging" est réalisée via la révision à 0 % de trafic
  (canari) avant bascule, plutôt que par un environnement physiquement séparé.
  À séparer si le budget le permet.
- Vulnérabilités applicatives identifiées en J1 (injection SQL dans Auth,
  endpoint debug Congés, route `/paie/migrate` publique, CORS ouvert) **non
  corrigées à ce stade** — restent dans le backlog de remédiation, hors
  périmètre strict infra/CD/feature-flag de ce J3.

## Portabilité AWS

| Azure (utilisé) | Équivalent AWS (brief initial) |
| --- | --- |
| Container Apps | ECS Fargate + ALB |
| Container Apps revisions + traffic split | ECS Blue/Green (CodeDeploy) ou service à 2 target groups derrière l'ALB |
| Azure Container Registry | Amazon ECR |
| Key Vault + identité managée | AWS Secrets Manager + IAM role |
| App Configuration / env var flag | AWS AppConfig ou variable d'environnement ECS |
