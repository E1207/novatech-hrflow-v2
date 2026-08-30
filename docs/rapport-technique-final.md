# Rapport technique final — NovaTech HRFlow

## 1. Contexte

NovaTech HRFlow est une plateforme RH SaaS pour PME. Le projet était livré avec
une dette technique importante : déploiement manuel, absence de monitoring,
tests faibles, secrets exposés et architecture non documentée.

## 2. Objectifs du projet

- sécuriser la chaîne de livraison ;
- fiabiliser les services critiques (auth, paie, congés, recrutement) ;
- rendre la mise en production observable et rollbackable ;
- produire une documentation exploitable par l’équipe et le jury.

## 3. Architecture retenue

- Frontend React
- API Gateway Express
- 4 microservices Node.js
- PostgreSQL
- Redis (présent dans l’environnement historique)
- Azure Container Apps pour l’exécution
- Key Vault pour les secrets
- ACR pour les images Docker

## 4. Choix techniques majeurs

### CI/CD

Pipeline en 5 stages :
Build → Test → Security → Staging → Production.

### Déploiement

Blue/Green sur Azure Container Apps avec traffic split et rollback.

### Sécurité

- secrets sortis du repo ;
- Key Vault + identité managée ;
- SSL côté PostgreSQL ;
- correction du frontend pour utiliser l’URL du gateway.

### Monitoring

- métriques Prometheus sur tous les services ;
- dashboard Grafana ;
- alertes d’erreur et de latence ;
- runbook d’incident.

## 5. Validation

- tests unitaires et d’intégration : OK ;
- couverture globale > 80% : OK ;
- smoke tests : OK ;
- rollback chronométré : OK ;
- feature flag démontré : OK.

## 6. Limites connues

- le projet a été livré sur Azure, pas AWS ;
- certains endpoints historiques restent à durcir ;
- le monitoring livré est portable, mais la démonstration est locale.

## 7. Conclusion

Le projet est désormais industrialisable : la mise en prod est observable,
testée, documentée et rollbackable.

