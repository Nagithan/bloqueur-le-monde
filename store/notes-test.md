# Notes de test pour la revue Chrome Web Store

Extension indépendante, sans serveur, clé ou compte propre au produit. Les commentaires du journal réservés aux abonnés nécessitent une session Le Monde autorisée ; le produit ne fournit pas cet accès. Aucun identifiant ou cookie n’est joint au dossier.

## Vérifications autonomes

1. Installer le paquet, puis ouvrir les options depuis l’icône de l’extension.
2. Constater l’information de stockage local et la liste initiale désactivable contenant `Peps72`.
3. Ajouter un pseudonyme fictif : vérifier l’aperçu exact avant confirmation, puis passer entre les trois états de la règle.
4. Exporter les préférences et les réimporter : l’aperçu précède toute écriture. Annuler un remplacement doit laisser les choix inchangés.
5. Désactiver le filtrage ou la liste communautaire, puis les réactiver. Les préférences restent présentes.

## Vérifications sur le site

Sur `https://www.lemonde.fr/`, ouvrir les commentaires d’un article dont la discussion est accessible à la session. Le bouton de blocage se place immédiatement avant « Signaler ». Il ouvre une confirmation, permet d’annuler puis de masquer les contributions portant exactement l’identité annoncée. Un compteur concerne uniquement les commentaires chargés. Les autres réponses restent accessibles. L’action « Annuler » ou le gestionnaire restaure les contributions.

Ne pas cliquer sur « Signaler », publier une réponse ou utiliser le compte d’un tiers pour ces essais. Les changements de filtrage sont propres au profil local du navigateur.

## Banc reproductible et limites

Le dépôt public fournit le code, les fixtures fictives et la recette automatisée du vrai paquet : suivre [INSTALLATION.md](https://github.com/Nagithan/bloqueur-le-monde/blob/main/docs/INSTALLATION.md). Les captures de fiche sont issues de ces discussions de démonstration et sont identifiées comme telles. La portée exacte des vérifications sur le site réel et les limites restantes sont consignées dans [RECETTE.md](https://github.com/Nagithan/bloqueur-le-monde/blob/main/docs/RECETTE.md).
