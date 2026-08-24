# Architecture cible CI/CD - Jour 1

## Architecture applicative existante

```mermaid
flowchart LR
    Browser[Navigateur React] --> Nginx[Nginx :80]
    Nginx --> Gateway[API Gateway :3000]
    Gateway --> Auth[Auth :3001]
    Gateway --> Paie[Paie :3002]
    Gateway --> Conges[Congés :3003]
    Gateway --> Recrutement[Recrutement :3004]
    Auth --> PostgreSQL[(PostgreSQL)]
    Paie --> PostgreSQL
    Conges --> PostgreSQL
    Recrutement --> PostgreSQL
    Paie --> Stripe[Stripe]
```

Redis est déclaré dans l'environnement, mais son usage n'est pas présent dans le code fourni. L'infrastructure annoncée est un VPS OVH sans définition versionnée.

## Pipeline cible

```mermaid
flowchart LR
    Commit[Push / Pull Request] --> Build[1. Source & Build]
    Build --> Tests[2. Tests]
    Tests --> Security[3. Sécurité]
    Security --> Staging[4. Staging + health check]
    Staging --> Production[5. Production avec rollback]
```

Le workflow du Jour 1 implémente le premier contrôle de build, lint et syntaxe JavaScript. Les stages de tests métier, sécurité et déploiement seront complétés aux jours suivants.
