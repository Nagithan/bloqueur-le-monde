# Produit

## Usage

Une extension Chrome pour les lecteurs du Monde qui souhaitent ne plus voir les commentaires de certains auteurs, sur l’ensemble des articles consultés avec le même profil de navigateur.

La réussite se mesure à une lecture plus sereine : un blocage prend effet immédiatement, reste valable pour les commentaires chargés ensuite et peut être annulé facilement. L’utilisateur garde le contrôle sur la liste communautaire et ses propres choix.

## Surfaces et autorité visuelle

- Mode principal : **Operate**, pour le blocage et les réglages.
- Dans les articles : identité visuelle du site Le Monde déjà chargé, son bouton « Signaler », ses typographies et son thème effectif.
- Dans les options : interface sobre, cohérente avec ces usages, portant clairement la mention « Extension indépendante ».
- Le produit conserve cette autorité visuelle. Les interfaces et captures de la version 1.0.0 emploient des contenus de démonstration pour la recette, sans reprendre de textes d’abonnés.

## Contraintes établies

- Extension Chrome Manifest V3, développement indépendant, dépôt destiné à être public.
- Permissions limitées à l’usage sur Le Monde et au stockage local de l’extension.
- Bouton de blocage à gauche de « Signaler » et confirmation explicite.
- Liste initiale incluant le pseudonyme « Peps72 », fourni comme préférence de filtrage par l’initiateur du projet.
- Liste communautaire active par défaut, visible et désactivable ; exceptions personnelles persistantes.
- Aucun réseau applicatif, profilage ou mécanisme de signalement automatique.

## Périmètre de livraison

Le cahier des charges dans `docs/CAHIER_DES_CHARGES.md` est la référence fonctionnelle. Les points techniques non vérifiés y sont distingués des exigences. La recette de la version 1.0.0 et ses limites sont décrites dans `docs/RECETTE.md`. La préparation du paquet et du dossier Store ne constitue pas une autorisation de soumission ou de publication.
