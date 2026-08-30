# Runbook Incident — Rollback de production

Ce runbook s'applique à un incident de type P1/P2 en production (ex: un
déploiement casse un service). Objectif : rollback en moins de 10 minutes,
sans étape manuelle sur le serveur (fini le SSH manuel de `scripts/deploy.sh`
et l'absence de procédure qui a coûté 3h07 d'indisponibilité en août 2024).

## 1. Détecter et confirmer l'incident

- Vérifier `/health` du Gateway public.
- Vérifier les logs du service suspect : `az containerapp logs show -g rg-hrflow -n <app> --tail 50`.
- Identifier le service en cause parmi : `hrflow-frontend`, `hrftlow-api`,
  `hrflow-auth`, `hrflow-paie`, `hrflow-conges`, `hrflow-recrutement`.

## 2. Identifier une révision cible saine

```bash
az containerapp revision list -g rg-hrflow -n <app> -o table
```

⚠️ Ne cibler que les **1 ou 2 révisions les plus récentes** ayant servi du
trafic avec succès. Une révision ancienne peut être incompatible avec la
configuration actuelle (secrets, variables d'environnement) — voir
[docs/livrable-j3.md](/docs/livrable-j3.md) pour un exemple concret rencontré.

## 3. Déclencher le rollback (chronométré)

**Option A — via GitHub Actions (recommandé, traçable) :**

1. Onglet *Actions* → workflow **"Rollback manuel (chronométré)"** →
   *Run workflow*.
2. Renseigner l'app concernée et, si nécessaire, la révision cible exacte
   (sinon la révision précédente est choisie automatiquement).
3. Le temps de bascule est publié dans le résumé du job.

**Option B — en ligne de commande (si GitHub indisponible) :**

```bash
time bash scripts/deploy/rollback.sh <app> <revision-cible>
```

## 4. Vérifier le retour à la normale

```bash
curl -s https://<gateway-fqdn>/health
bash scripts/deploy/smoke-test.sh
```

## 5. Post-mortem

Toute utilisation de ce runbook doit être suivie d'un post-mortem écrit
(cf. modèle [docs/incident-aout-2024.md](/docs/incident-aout-2024.md)) : cause racine, chronologie,
temps de rollback mesuré, actions correctives.

## Rappels

- Aucun accès SSH direct en production : tout déploiement/rollback passe par
  ce runbook ou par le pipeline CD.
- Les secrets ne sont jamais en clair : ils sont gérés via Azure Key Vault
  (`hrflow-kv`) et référencés par identité managée.
- Objectif contractuel Partech : rollback < 10 minutes. Mesure réalisée en
  démonstration : 17 secondes pour la bascule de trafic elle-même.
