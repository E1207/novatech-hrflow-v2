# Stratégie Git retenue

## Choix

Le projet adopte un trunk-based development encadré :

- `main` est la branche protégée et représente la version livrable ;
- chaque changement passe par une branche courte et une Pull Request ;
- les contrôles CI sont obligatoires avant fusion ;
- le déploiement staging est automatique après fusion ;
- la production nécessite une approbation explicite.

## Justification

L'équipe est réduite, les livraisons sont fréquentes et le pipeline doit éviter les branches longues. Ce fonctionnement limite les divergences, rend les corrections traçables et permet une promotion progressive vers staging puis production.

## Règles

- Une Pull Request doit avoir une description, un reviewer et une CI verte.
- Aucun secret, fichier `.env` ou mot de passe ne doit être commité.
- Les commits décrivent une intention unique, par exemple `fix(auth): corriger la validation`.
- Les branches fusionnées sont supprimées.
- Les déploiements sont liés à un commit ou un tag immuable.
