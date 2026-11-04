# Bloqueur Le Monde

Projet d’extension Chrome indépendante pour masquer localement les commentaires d’auteurs choisis sur `www.lemonde.fr`.

**État : cadrage, au 4 novembre 2026.** Le dépôt contient le cahier des charges et les décisions d’architecture. Il ne contient pas encore d’extension installable. Le dépôt est local ; aucun dépôt GitHub ni publication sur le Chrome Web Store n’a encore été créé.

## Documents

- [Cahier des charges](docs/CAHIER_DES_CHARGES.md) : parcours, règles de filtrage, confidentialité, critères de recette et étapes de réalisation.
- [Architecture proposée](docs/ARCHITECTURE.md) : permissions, stockage, identité des auteurs, composants et stratégie de validation.
- [Recherche et audit de l’existant](docs/EXISTANT.md) : ce qui a été vérifié et les limites de l’audit.
- [Contribuer](CONTRIBUTING.md) : contributions techniques et propositions pour la liste communautaire.
- [Engagement de confidentialité visé](PRIVACY.md) : exigences auxquelles devra satisfaire l’extension avant diffusion.

## Comportement prévu

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

## Prochaine étape

Le premier travail de développement sera une vérification ciblée du DOM actuel, de l’identité disponible des auteurs et du comportement de la fenêtre de commentaires, puis un prototype de blocage personnel. Les hypothèses à vérifier figurent à la fin du cahier des charges.

Les pièces complètes de l’audit précédent sont conservées dans le dossier local `audit/`, exclu de Git. Aucun code de l’extension auditée n’est repris.
