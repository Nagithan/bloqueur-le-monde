# Confidentialité — Bloqueur Le Monde

Version 1.0.0, mise à jour le 4 novembre 2026. Projet indépendant du journal Le Monde, sans compte ni service applicatif externe.

## Données utilisées

Le filtrage traite localement le pseudonyme public d’un auteur, son éventuel identifiant public d’auteur, l’identifiant du commentaire et la structure nécessaire à son affichage. Les identifiants de commentaires restent en mémoire pour compter les contributions distinctes de la discussion ouverte. L’adresse courante de la page est comparée en mémoire pour réinitialiser l’affichage temporaire lors d’une navigation.

Les textes des commentaires, les articles lus, les cookies, les identifiants de connexion et les informations d’abonnement ne sont ni collectés ni enregistrés par l’extension. Elle n’enregistre aucun historique de navigation ni URL d’article. Aucun traitement n’utilise une intelligence artificielle ou un serveur distant.

## Stockage local et durée

Les seuls éléments persistants sont les règles personnelles de filtrage (pseudonymes, éventuels identifiants d’auteur et libellés), les réglages et les versions de schéma/liste déjà présentées. Ils restent dans `chrome.storage.local`, rattaché à l’extension dans le profil du navigateur. Le stockage du site Le Monde n’est pas utilisé. Il n’y a pas de synchronisation Google, de transmission aux responsables du projet ou de partage automatique avec Le Monde.

Les données sont conservées jusqu’à leur retrait, à la réinitialisation depuis les réglages ou à la désinstallation de l’extension. Les fichiers exportés volontairement restent à l’endroit choisi par le lecteur ; leur suppression lui appartient. Le stockage local n’est pas un coffre chiffré contre une personne ayant accès au profil du navigateur.

La liste communautaire est publique et incluse dans le paquet. Les listes personnelles ne sont jamais transformées automatiquement en contributions GitHub.

## Permissions et communications

La seule permission d’API demandée est `storage`. L’injection est limitée aux pages `https://www.lemonde.fr/*`, sans accès aux autres sites ou aux pages de connexion sur d’autres sous-domaines. Le navigateur autorise l’accès à la page entière ; le code limite son traitement à la discussion et à l’ajout d’un raccourci dans le menu du compte.

L’extension n’effectue aucune requête réseau applicative : pas de télémétrie, publicité, analyse d’usage, vente de données ou téléchargement d’une liste distante. Chrome et le Store gèrent leurs propres mises à jour ; Le Monde continue d’effectuer son trafic habituel. Ouvrir volontairement un lien vers GitHub entraîne le trafic normal d’une visite de ce site.

Le stockage n’est pas exposé aux scripts du site. Le masquage modifie cependant le DOM partagé : le site peut observer les éléments masqués. Si le lecteur ouvre le gestionnaire intégré à la page, ses préférences y sont affichées et peuvent être observées par la page. La page d’options de l’extension offre une interface séparée. L’activité de l’extension n’est pas présentée comme invisible au site.

## Contrôle du lecteur

- Activer ou désactiver le filtrage et la liste communautaire.
- Ajouter, retirer ou exempter un auteur ; les choix personnels restent prioritaires.
- Exporter les préférences dans un fichier local et en importer après prévisualisation.
- Effacer toutes les préférences avec confirmation dans les réglages.
- Désinstaller l’extension pour supprimer son stockage local.

Le fichier exporté n’est envoyé à quelqu’un que si le lecteur le partage lui-même. Une issue GitHub est une démarche publique distincte et volontaire : ne pas y joindre de liste personnelle, de cookie ou de capture de compte. Pour une question de confidentialité, utiliser le [dépôt du projet](https://github.com/Nagithan/bloqueur-le-monde).

Les préférences concernent le profil du navigateur, pas le compte Le Monde. Un même profil partage donc ses choix entre les comptes du journal qu’il utilise.

## Engagement d’utilisation limitée

Le projet limite l’usage des données au masquage demandé et à sa gestion locale. Il s’engage à respecter les exigences d’utilisation limitée de la politique de données utilisateur du Chrome Web Store ; aucun transfert ou autre usage des données n’est prévu.
