# Rapport d'audit Jour 1

## Périmètre

Audit du dépôt fourni, de son historique Git, des services Node.js, du frontend, de Nginx, du script de déploiement et du workflow GitHub Actions.

## Synthèse

Le produit est un monorepo minimal composé d'un frontend React, d'une API Gateway et de quatre services Node.js. La chaîne de livraison est couplée à `main`, ne comporte pas de vrais tests ni de scans et peut déployer automatiquement en production. Le niveau de risque est critique pour les données RH et la paie.

## Problèmes priorisés

### Critique

| Constat | Preuve | Action attendue |
| --- | --- | --- |
| Secrets de production versionnés | `.env`, valeurs par défaut dans Auth et Paie | Révoquer et renouveler tous les secrets, puis utiliser GitHub Secrets ou AWS Secrets Manager |
| Injection SQL sur la connexion | `services/auth/src/index.js` | Utiliser exclusivement des paramètres PostgreSQL |
| Routes métier sans contrôle d'accès | Le Gateway ne branche pas `middleware/auth.js` | Authentifier chaque route et ajouter un contrôle de rôles |
| Migration BDD accessible par HTTP | `services/paie/src/index.js` | Supprimer la route publique et gérer les migrations dans un job contrôlé |
| Données RH exposées par endpoint debug | `services/conges/src/index.js` | Supprimer l'endpoint et auditer les données exposées |
| Déploiement SSH avec mot de passe | `scripts/deploy.sh` | Remplacer par une clé courte durée, un environnement protégé et un rollback |

### Élevé

- CORS accepte toutes les origines et toutes les méthodes.
- JWT_SECRET est écrit dans les logs au démarrage.
- Nginx sert les logs avec `autoindex on` et ne configure pas TLS.
- L'upload de CV ne limite ni la taille, ni le type, ni le nom de fichier.
- Le pipeline utilise Node.js 16 et déploie après un simple build frontend.
- Aucune sauvegarde, supervision, alerte ou procédure de rollback n'est versionnée.

### Moyen

- Les gestionnaires d'erreur sont incomplets dans les services.
- Les entrées métier ne sont pas validées : dates, heures, statuts et paramètres de paie.
- Le frontend ne gère pas explicitement l'expiration d'un JWT.
- Le README et l'architecture ne permettent pas une installation fiable.

### Faible

- Les commentaires contiennent de nombreux TODO non suivis.
- Les branches `dev` et `feature/recrutement-v2` contiennent du travail non fusionné.
- Le dépôt ne possède pas de verrouillage de versions npm.

## Historique Git

Branches présentes : `main`, `dev` et `feature/recrutement-v2`. Aucun commit de revert n'a été identifié. Les commits significatifs pour l'audit sont l'ajout du `.env`, la désactivation temporaire de l'authentification et l'ajout de l'endpoint debug Congés. Ces contournements sont restés en place sans ticket de sortie ni test de non-régression.

## Dépendances

Le dépôt ne contient aucun lockfile npm. Les installations ne sont donc pas
reproductibles à version exacte et le cache npm de GitHub Actions ne peut pas
être activé sans ajouter ces lockfiles. Les constructions Docker ont signalé
des dépendances obsolètes, notamment `multer` 1.x et plusieurs paquets de
l'écosystème Create React App. Elles ont également signalé des vulnérabilités
npm : 4 dans Auth et 30 dans le frontend lors de l'audit de construction.
Le traitement détaillé est planifié dans le stage Security des jours suivants.

Le schéma UML/importable draw.io du pipeline est disponible dans
`docs/architecture-cible-j1.drawio`.

## Plan de remédiation

1. Révoquer les secrets et suspendre tout déploiement automatique.
2. Fermer les routes debug et migration, puis activer l'authentification avec rôles.
3. Corriger l'injection SQL et sécuriser les uploads.
4. Ajouter les tests unitaires et E2E avec seuil de couverture.
5. Construire les images Docker et une CI progressive.
6. Provisionner staging et production séparément avec rollback.
7. Ajouter métriques, alertes, sauvegardes et runbook.
8. Finaliser OpenAPI, README et le rapport technique.

## Limites du Jour 1

La CI initiale valide la structure et la syntaxe JavaScript. Elle ne remplace pas les tests fonctionnels, les scans de sécurité ou un déploiement staging, qui sont planifiés aux jours suivants.
