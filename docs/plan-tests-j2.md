# Plan de tests - Jour 2

## Objectifs

- Vérifier les routes critiques des quatre services backend.
- Détecter les régressions sur l'authentification, la paie, les congés et le recrutement.
- Contrôler le parcours de connexion dans le navigateur.
- Publier la couverture et les résultats dans la CI.

## Tests backend

Les suites Jest/Supertest se trouvent dans `tests/` :

- Auth : connexion valide/invalide et vérification JWT ;
- Congés : calcul du solde, création d'une demande et endpoint debug identifié ;
- Paie : salarié absent, bulletin, paiement Stripe, migration et heures supplémentaires ;
- Recrutement : liste des candidatures et changement de statut.

Les appels PostgreSQL, Stripe et les dépendances externes sont mockés. Le seuil minimal est de 80 % de couverture des lignes.

## Tests E2E

Les cinq scénarios Playwright couvrent :

1. affichage de la page de connexion ;
2. saisie des identifiants ;
3. envoi des identifiants vers l'API ;
4. affichage d'une erreur d'authentification ;
5. stockage de la session après une connexion valide.

## Critères CI

- Un test en échec bloque le stage Test.
- La couverture est générée en format texte et HTML.
- Le rapport Playwright est conservé comme artefact.
- Trivy et OWASP ZAP produisent un rapport dans le stage Security.