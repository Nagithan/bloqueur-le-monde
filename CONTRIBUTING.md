# Contribuer

Les contributions doivent préciser l’exigence concernée et le résultat attendu. Utiliser Node.js 24 ; les commandes d’installation, de build et de recette figurent dans [INSTALLATION.md](docs/INSTALLATION.md). Exécuter `npm run check` avant de proposer un changement de comportement et vérifier le paquet réellement construit.

## Contributions techniques

- Préserver la limitation au domaine autorisé et l’absence de communications réseau applicatives.
- Ne pas ajouter de permission, dépendance ou chargement distant sans expliquer le besoin et mettre à jour le cahier des charges.
- Vérifier le chargement dynamique et la restauration ; un test sur des commentaires déjà présents ne suffit pas.
- N’ajouter dans les fixtures que du HTML minimal anonymisé avec des auteurs et textes fictifs. Aucun cookie, jeton, contenu de compte ou texte d’abonné.
- Préserver les réponses d’autres auteurs, le clavier, le lecteur d’écran et les thèmes disponibles.
- Décrire les vérifications réellement exécutées, sans présenter une simulation comme une recette du paquet complet.

Les améliorations doivent correspondre à un problème observé ou à une exigence. Les tests portent sur des comportements significatifs : règles, chargement, stockage, concurrence et restauration.

## Liste communautaire

Les ajouts, corrections et retraits se proposent par issue ou pull request. Ils sont revus par les responsables du projet et ne sont intégrés aux installations qu’avec une version publiée.

Fournir le pseudonyme exact, l’éventuel identifiant d’auteur public vérifiable et un contexte factuel minimal. Ne pas confondre ID de commentaire et ID de compte. Vérifier doublons et homonymes. La liste exprime une préférence de filtrage ; elle ne sert pas à publier des classements ou accusations sur des personnes.

Ne pas fournir de données privées, d’informations sur l’identité réelle, d’insultes ou d’appels à contacter un commentateur. Une correction ou un retrait peut être proposé sans révéler d’identité privée. Les responsables peuvent refuser une entrée insuffisamment établie ou fermer une discussion qui quitte le sujet du filtrage.

Les exceptions personnelles restent prioritaires. Une contribution ne doit pas réactiver une entrée qu’un lecteur a choisi d’afficher, ni convertir automatiquement ses choix locaux en proposition publique.

Modifier `data/community-list.json` et ajouter une entrée à `data/community-history.json` avec la nouvelle version, les ajouts et retraits. Le build valide le schéma et l’unicité ; les tests doivent rester compatibles avec l’évolution volontaire de la liste. Ne pas confondre des fixtures de test avec un avis sur une personne.

## Préparer une publication

1. Vérifier la matrice de recette et le paquet exact construit depuis le tag.
2. Relire le diff des permissions, du code exécuté et de la liste communautaire.
3. Documenter les ajouts/retraits et les changements de comportement.
4. Vérifier la fidélité de la politique de confidentialité et des captures.
5. Publier les sources, le paquet et son empreinte via les procédures prévues à ce stade du projet.

Les pièces du dossier local `audit/` et les paquets tiers restent exclus du dépôt public. Les contributions originales au projet sont proposées sous la licence MIT du dépôt.
