# Confidentialité — comportement exigé avant diffusion

Ce document décrit l’engagement de conception du projet. L’extension n’est pas encore implémentée ni distribuée ; ces points devront être vérifiés sur le paquet final et reflétés dans la fiche Chrome Web Store.

## Traitement local

Le filtrage utilise uniquement les informations nécessaires aux commentaires affichés : pseudonyme, éventuel identifiant public d’auteur, structure du commentaire et actions. Les textes des commentaires, les articles lus et les informations du compte ne sont pas collectés ni conservés.

Les préférences, pseudonymes de filtrage, identifiants d’auteur éventuels et réglages sont enregistrés localement dans le stockage de l’extension. Ils ne sont ni envoyés au Monde ou aux responsables du projet, ni synchronisés par Google, ni placés dans le stockage du site.

Le site peut toutefois observer les modifications du DOM produites par le filtrage. La séparation du stockage n’est pas une promesse d’invisibilité de l’extension.

## Permissions et communications

L’accès de base est limité aux pages de `https://www.lemonde.fr/*`, avec la permission `storage`. Le navigateur accorde un accès aux pages, pas une permission restreinte à une zone de leur HTML ; le code limite son traitement à la discussion.

Aucun serveur applicatif, publicité, télémétrie, profilage ou téléchargement de liste distante n’est prévu. La liste communautaire est publique et incluse dans le paquet. Chrome gère ses propres communications et les mises à jour du Store ; le site du Monde continue d’effectuer son trafic habituel.

## Contrôle par le lecteur

- Activer ou désactiver le filtrage et la liste communautaire.
- Ajouter, retirer ou exempter un auteur.
- Exporter volontairement ses préférences dans un fichier local et en importer après prévisualisation.
- Effacer les données depuis les options ; la désinstallation supprime également le stockage local de l’extension.

Le fichier exporté contient des préférences de lecture : il est transmis à quelqu’un d’autre uniquement si le lecteur le partage lui-même. Un signalement technique sur GitHub est une démarche distincte et volontaire ; aucune liste personnelle ou capture de commentaire n’y est envoyée automatiquement.

Les préférences concernent le profil Chrome, pas un compte Le Monde. Le stockage local n’est pas un stockage chiffré destiné à protéger des secrets contre une personne ayant accès au profil de navigateur.
