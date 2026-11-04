# Recherche et audit de l’existant

Recherche effectuée le 4 novembre 2026 sur le web, le Chrome Web Store et GitHub.

## Solution ciblée retrouvée

[La Diligence du Monde](https://chromewebstore.google.com/detail/la-diligence-du-monde/aihnagehppemcdicdjleikcedkjhffbl) annonce le masquage ou la mise en valeur de commentateurs du Monde. Lors de la consultation directe, sa fiche affiche la version 0.0.2, une mise à jour le 26 juin 2024, trois utilisateurs et aucun avis. Ces compteurs sont une photographie datée, pas un indicateur suffisant de qualité.

Le paquet officiel téléchargé depuis le service de mise à jour Google contient du JavaScript lisible, sans dépendance tierce JavaScript apparente. Il utilise Manifest V3, n’ajoute aucune permission d’API et se limite à `https://www.lemonde.fr/*`. Aucun appel réseau applicatif, traceur ou chargement de code distant n’a été trouvé lors de la lecture complète des fichiers exécutables.

Aucun dépôt public attribuable à ce projet ni licence libre n’a été retrouvé. La présence de code lisible dans le paquet permet son examen, mais n’établit pas un statut open source. Le présent projet repart d’une implémentation indépendante.

## Résultats vérifiés

Huit scénarios ont été exécutés avec les scripts officiels inchangés, un vrai DOM et une vraie base IndexedDB. Seule la messagerie Chrome était simulée : ce banc n’équivaut pas à une installation complète.

- Le score d’un auteur et son application aux commentaires présents au lancement fonctionnent dans le cas attendu.
- Les commentaires ajoutés ensuite ne sont pas traités, même pour un auteur déjà enregistré.
- Le masquage est une réduction d’opacité ; le texte, sa place et sa présence dans l’arbre d’accessibilité restent conservés.
- Une variation simple des espaces entre éléments provoque une erreur liée à `nextSibling.nextSibling`.
- Une importation valide ne réactualise pas l’affichage, et une suppression de règle ne remet pas correctement à zéro les styles.
- Un import dont le schéma est incorrect provoque une erreur sans explication exploitable. Dans le scénario testé, les données précédentes sont conservées par l’annulation de la transaction.
- Les noms et scores sont stockés dans IndexedDB depuis le content script, dans le stockage du site hôte ; le partage de ce stockage a été reproduit sur une page locale. La [documentation Chrome](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies) confirme cette portée. Aucun accès réel à ces données par Le Monde n’a été observé.

## Observation du site actuel

Sur un article ouvert dans une session abonnée, l’inspecteur DOM trouvait zéro élément correspondant au sélecteur d’auteur de l’extension avant l’ouverture des commentaires. Un clic sur « Voir les commentaires » affichait ensuite la discussion. La capture unique du DOM par le script audité ne couvre pas ce parcours.

L’extension n’a pas été installée dans cette session. L’incompatibilité de ce parcours est une conclusion issue du code, du banc de reproduction et de l’observation du chargement actuel, pas une validation de tous les articles ou environnements possibles.

## Conséquence pour ce projet

Le besoin reste mal couvert au regard de la robustesse, du contrôle des listes, de l’intégration et de la confidentialité demandés. Le suivi du DOM dynamique, le vrai masquage réversible et le stockage privé de l’extension sont des exigences de base.

Les pièces locales détaillées figurent dans `audit/`, exclu du dépôt public : rapport, résultats JSON, provenance et empreintes du paquet, banc de reproduction et preuves d’inspection. Le code de cette extension tierce n’est pas inclus dans ce dépôt.
