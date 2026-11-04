# Pratiques de confidentialité — dossier de soumission

Ces textes décrivent le paquet 1.0.0 et sont destinés à être reportés dans le tableau de bord après validation. Ils ne constituent pas une soumission ni une attestation déjà envoyée à Google.

## Finalité unique

Permettre au lecteur de masquer localement les commentaires de certains auteurs sur www.lemonde.fr, avec gestion de ses choix et d’une liste communautaire modifiable.

## Justification de `storage`

Conserver sur l’appareil les règles de masquage ou d’exception, les réglages et les versions de données. Le stockage n’est pas synchronisé et n’est pas accessible directement aux scripts du site. Aucun texte de commentaire ni historique de consultation n’y est enregistré.

## Justification de l’accès au site

Lire les pseudonymes et les éléments structurels des commentaires déjà accessibles au lecteur sur https://www.lemonde.fr/*, ajouter le bouton de blocage avant le signalement, masquer/restaurer l’affichage et le mettre à jour lors du chargement dynamique. Aucun accès à d’autres origines ou aux sous-domaines de connexion/compte n’est demandé.

## Code distant

Non. Tous les scripts, styles, règles communautaires et ressources utilisés par l’extension sont inclus dans le paquet. Aucun code distant, `eval`, service d’analyse ou appel d’IA.

## Données utilisées, même localement

Il faut déclarer le traitement local et ne pas présenter ce produit comme ne manipulant aucune donnée : la documentation officielle exige également la transparence pour les traitements sur l’appareil. [FAQ officielle](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

| Donnée | Traitement effectif |
| --- | --- |
| Pseudonymes / identifiants publics d’auteur éventuels | Lus dans le DOM pour la correspondance ; conservés localement si nécessaires à une règle personnelle. Aucune transmission. Les pseudonymes relèvent des identifiants d’utilisateur à déclarer dans les catégories correspondantes du tableau de bord. |
| Structure et identifiants de commentaires | Utilisés en mémoire pour le filtrage et le comptage. Les textes ne sont pas collectés ni persistés. |
| Choix et réglages | Conservés dans `chrome.storage.local`, effaçables et exportables volontairement. |
| Adresse de la discussion courante | Comparée en mémoire pour réinitialiser le contexte lors d’une navigation ; aucun historique ou journal d’URLs conservé ou transmis. |
| Authentification, paiement, santé, localisation, communications privées | Aucun accès ou traitement par l’extension. |

Adapter les cases aux catégories réellement affichées dans la console au jour de la soumission, en déclarant les pseudonymes et métadonnées utilisés localement. Aucun transfert à un serveur ou à un tiers, aucune vente, publicité personnalisée ou lecture des préférences par l’éditeur. L’export est un téléchargement local initié par le lecteur, pas un envoi automatique.

## Politique publique

https://github.com/Nagithan/bloqueur-le-monde/blob/main/PRIVACY.md

La liste communautaire est publique et incluse au paquet ; les préférences personnelles ne sont jamais publiées automatiquement. Le lecteur peut voir ou modifier ses données, exporter un fichier et les effacer. Les interfaces affichées dans la page et les modifications de DOM peuvent être observées par les scripts du site.

Références : [champs de confidentialité](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [règles du Store](https://developer.chrome.com/docs/webstore/program-policies/).
