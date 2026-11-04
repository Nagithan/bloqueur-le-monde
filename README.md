# Bloqueur Le Monde

Projet d’extension Chrome indépendante pour masquer localement les commentaires d’auteurs choisis sur `www.lemonde.fr`.

**Version 1.0.0, en recette finale au 4 novembre 2026.** Extension Manifest V3 complète, compilable et installable localement. La publication sur le Chrome Web Store reste soumise à la validation de l’éditeur ; aucune soumission automatique n’est effectuée.

## Installer ou construire

Voir le [guide d’installation](docs/INSTALLATION.md). Le ZIP d’une release se décompresse et se charge via « Charger l’extension non empaquetée » dans `chrome://extensions`.

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm run check
npm run package
```

Node.js 24 et Python 3 sont nécessaires pour le développement. Le build se trouve dans `dist/`, le ZIP et son empreinte dans `release/`. Aucun compte, serveur ou clé d’API propre à l’extension.

## Documents

- [Cahier des charges](docs/CAHIER_DES_CHARGES.md) : parcours, règles de filtrage, confidentialité, critères de recette et étapes de réalisation.
- [Architecture](docs/ARCHITECTURE.md) : permissions, stockage, identité des auteurs, composants et stratégie de validation.
- [Recherche et audit de l’existant](docs/EXISTANT.md) : ce qui a été vérifié et les limites de l’audit.
- [Contribuer](CONTRIBUTING.md) : contributions techniques et propositions pour la liste communautaire.
- [Confidentialité](PRIVACY.md) : données utilisées localement, permissions et contrôle par le lecteur.
- [Recette et limites](docs/RECETTE.md) : preuves, environnements et vérifications restantes.
- [Dossier Chrome Web Store](store/PUBLICATION.md) : textes, captures de démonstration et préparation de soumission.

## Fonctionnement

1. « Bloquer cet utilisateur » apparaît immédiatement à gauche de « Signaler ».
2. Une confirmation précède l’enregistrement du choix et le masquage des commentaires de cet auteur, y compris ceux chargés plus tard.
3. Un encart indique le nombre de commentaires masqués parmi ceux chargés dans la discussion et permet de gérer les auteurs ou d’afficher temporairement les commentaires.
4. Une liste communautaire livrée avec l’extension est active par défaut, annoncée à la première utilisation et entièrement désactivable. Les exceptions personnelles restent prioritaires lors des mises à jour.

Le masquage concerne ce profil de navigateur. Il n’empêche pas un auteur de répondre et n’agit pas sur son compte Le Monde.

## Principes de réalisation

- Manifest V3 ; seule permission d’API prévue : `storage`.
- Accès de base à `https://www.lemonde.fr/*` uniquement.
- Traitement local, sans télémétrie ni serveur applicatif.
- Préférences conservées dans le stockage de l’extension, jamais dans celui du site.
- Détection du chargement dynamique des commentaires et des réponses.
- Interface cohérente avec Le Monde, accessible au clavier et adaptée au thème réellement affiché par le site.
- Code original sous [licence MIT](LICENSE) ; projet non affilié au journal Le Monde.

## Vérifications et limites

Les tests d’intégration chargent réellement l’extension dans un profil Chromium temporaire et utilisent des discussions fictives. Ils vérifient notamment le contenu tardif, les réponses, les exceptions, l’import/export, les écritures concurrentes, les erreurs de stockage et l’accessibilité. Les mesures de charge utilisent 1 000 commentaires et 5 000 règles. La matrice complète et les limites de la recette sur le site réel figurent dans [RECETTE.md](docs/RECETTE.md).

Les pseudonymes sont comparés exactement lorsque le DOM ne fournit pas un identifiant public d’auteur utilisable : homonymes et changements de pseudonyme restent une limite. Les préférences concernent le profil Chrome, sans synchronisation avec le compte du Monde ou d’autres appareils. Les commentaires réservés aux abonnés nécessitent toujours un accès légitime au site.

Les propositions pour la liste communautaire sont revues avant inclusion dans une version. Le fichier public actuel est [community-list.json](data/community-list.json) et son historique est [community-history.json](data/community-history.json).

Les pièces complètes de l’audit précédent sont conservées dans le dossier local `audit/`, exclu de Git. Aucun code de l’extension auditée n’est repris.
