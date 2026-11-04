# Dossier de publication 1.0.0

La publication Chrome Web Store attend la validation explicite de l’utilisateur. Ne pas envoyer la version en revue ni la mettre en ligne automatiquement.

## Pièces préparées

- `release/bloqueur-le-monde-1.0.0.zip` : paquet complet, manifeste à la racine.
- `release/SHA256SUMS.txt` : empreinte du ZIP.
- `dist/icons/128.png` : icône du Store, issue du SVG original.
- `store/assets/01-commentaires-1280x800.png` : filtrage et réponses conservées, données fictives.
- `store/assets/02-reglages-1280x800.png` : gestion des préférences.
- `store/assets/03-confirmation-1280x800.png` : confirmation de blocage.
- `store/fiche-fr.md` : nom, descriptions et liens.
- `store/confidentialite-console.md` : finalité et déclarations de traitement/permissions.
- `PRIVACY.md`, `LICENSE`, `CONTRIBUTING.md` et `docs/RECETTE.md` dans le dépôt public.

Le ZIP n’est pas suivi dans Git ; il est construit depuis les sources du tag. Les captures ne contiennent aucun texte de commentaire d’abonné. Les PNG utilisés par le paquet proviennent du SVG original ; les captures proviennent de la recette du paquet dans Chromium. La provenance est décrite dans `store/assets/provenance.json`.

## Étapes après validation

1. Utiliser le compte éditeur choisi par l’utilisateur. S’il n’existe pas, son inscription, les accords et les frais éventuels se traitent avec lui ; aucune identité ou adresse de contact n’est inventée.
2. Vérifier le tag, l’empreinte du ZIP et la recette finale sur le site réel.
3. Créer la fiche dans le tableau de bord, charger le ZIP, l’icône et les captures.
4. Reporter les textes et déclarations, choisir la distribution et vérifier la politique de confidentialité publique. Le produit traite des pseudonymes localement : ne pas cocher une déclaration incompatible avec cette réalité.
5. Relire la fiche et les permissions présentées, puis demander la validation de soumission.
6. Suivre la revue Google et traiter ses éventuelles demandes. L’acceptation n’est pas garantie par la préparation de ce dossier.

Les notes de test donnent accès aux vérifications sur fixtures sans abonnement. La partie du site réellement réservée aux abonnés nécessite une session autorisée ; ne pas fournir de mot de passe ou de cookies dans les sources ou les instructions publiques.

Documentation officielle consultée le 4 novembre 2026 : [publication](https://developer.chrome.com/docs/webstore/publish), [inscription éditeur](https://developer.chrome.com/docs/webstore/register), [images](https://developer.chrome.com/docs/webstore/images).
