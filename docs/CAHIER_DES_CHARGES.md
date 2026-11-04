# Cahier des charges — Bloqueur Le Monde

Référence fonctionnelle du 4 novembre 2026. La version 1.0.0 est implémentée ; les résultats et limites de validation sont consignés dans [RECETTE.md](RECETTE.md).

## 1. Finalité et périmètre

Permettre à un lecteur de masquer les commentaires des auteurs qu’il choisit sur le site du Monde, sans transmettre ses préférences à un service externe. Le choix vaut pour les articles suivants dans le même profil de navigateur et reste réversible.

La première version vise Chrome sur ordinateur, sur `https://www.lemonde.fr/`, avec la fenêtre de commentaires actuelle, ses réponses et son chargement différé. Les tests devront aussi couvrir les largeurs étroites de la fenêtre de navigateur. Brave et Edge constituent des cibles de vérification secondaires ; leur compatibilité ne sera annoncée qu’après essai.

Le projet est indépendant du Monde. Il masque un affichage local : il ne bloque pas le compte de l’auteur, ne l’empêche pas de répondre et ne modifie pas la modération du journal. Les compteurs natifs du Monde restent ceux du site.

Chrome mobile, les applications natives du journal, Firefox, Safari, les publications des journalistes dans les directs et le filtrage de citations d’un auteur à l’intérieur des messages d’autres personnes sont hors du périmètre initial. Une extension n’accorde aucun accès supplémentaire aux espaces réservés aux abonnés.

## 2. Décisions proposées pour la première version

| Sujet | Choix de référence |
| --- | --- |
| Code et diffusion | Implémentation originale, licence MIT, dépôt destiné à être public ; installation locale de développement puis Chrome Web Store après recette. |
| Permissions | `storage` et injection statique sur `https://www.lemonde.fr/*` ; aucune permission sur tous les sites ni sur tous les sous-domaines. |
| Stockage | `chrome.storage.local`, sans synchronisation Google ni stockage dans le site. |
| Liste fournie | Liste communautaire incluse dans le paquet, active par défaut, signalée à la première utilisation, désactivable globalement ou auteur par auteur. |
| Liste initiale | Pseudonyme exact `Peps72`, à titre de préférence fournie pour ce projet ; aucun jugement factuel sur la personne n’est attaché à cette entrée. |
| Priorité | Les choix personnels priment sur la liste communautaire ; les exceptions sont préservées lors des mises à jour. |
| Réglages | Page d’options de l’extension, gestion accessible depuis la zone de commentaires et raccourci local dans « Votre compte » sur `www.lemonde.fr`. |
| Compte Le Monde | Les choix restent propres au profil Chrome, même lorsqu’ils sont accessibles depuis l’interface du compte. |
| Actualisation communautaire | Nouvelles versions de l’extension après revue GitHub ; aucun téléchargement silencieux d’une liste distante. |

L’activation par défaut reprend la demande initiale. Pour une diffusion large, une activation volontaire à l’installation reste une variante possible, sans modifier l’architecture. Elle ne doit pas être substituée implicitement au choix ci-dessus.

## 3. Confidentialité et transparence

### 3.1. Accès et traitement

L’extension ne lit dans son fonctionnement que les éléments nécessaires de la zone de commentaires : pseudonyme, éventuel identifiant public stable de l’auteur, identifiant du commentaire pour le suivi en mémoire, conteneurs et commandes de la discussion. Elle ne collecte pas les textes des commentaires, les articles lus, l’historique, les cookies, les identifiants de connexion ou les informations d’abonnement.

La permission Chrome porte sur les pages du domaine autorisé, et non sur une sous-partie de leur DOM. La restriction à la zone de commentaires doit donc être garantie par le code et les revues ; elle ne doit pas être présentée comme une permission technique limitée aux seuls commentaires.

Le fonctionnement applicatif n’effectue aucune requête réseau : pas de télémétrie, compte utilisateur, serveur, publicité, intelligence artificielle distante ou configuration distante. Les mises à jour du navigateur et du Chrome Web Store restent des communications gérées par Chrome. Les liens ouverts volontairement vers GitHub sont présentés comme tels.

### 3.2. Données conservées

Seuls les choix de filtrage, leurs libellés, les réglages et les versions de schéma/liste sont persistés. Aucun texte de commentaire, URL d’article ou historique de consultation n’est enregistré. Les identifiants de commentaires ne servent qu’en mémoire à la discussion courante.

Le stockage local appartient à l’extension. La page ne reçoit pas d’accès à la liste complète par attribut HTML, événement personnalisé, variable globale ou message externe. Le filtrage modifie toutefois le DOM partagé : un script du site peut observer qu’un commentaire est masqué. L’extension ne promet pas de rendre son activité indétectable.

La liste est commune aux comptes Le Monde utilisés dans un même profil Chrome. Elle n’est pas synchronisée avec le compte du journal, un autre ordinateur ou un autre profil. Le stockage local n’est pas présenté comme un coffre chiffré. Désinstaller l’extension supprime son stockage local ; l’export volontaire permet de conserver ses choix.

## 4. Parcours de blocage

### 4.1. Commande

Sur chaque commentaire dont l’auteur et la barre d’actions sont identifiés sans ambiguïté, insérer un vrai bouton intitulé **« Bloquer cet utilisateur »**, immédiatement à gauche de **« Signaler »** dans l’ordre visuel et l’ordre de tabulation.

Le bouton s’aligne sur la typographie, les dimensions et les états de l’action native. Il ne reprend pas son adresse de signalement, ses identifiants HTML ou ses gestionnaires d’événements. Les fonctions « Répondre », « J’aime » et « Signaler » conservent leur comportement.

Sur une fenêtre étroite, les actions peuvent revenir à la ligne sans se chevaucher ; « Bloquer cet utilisateur » reste avant « Signaler ». Une action déjà injectée ne doit jamais être dupliquée.

### 4.2. Confirmation

Le clic ouvre une modale contenant exactement la question :

> Masquer ce commentaire et tous les futurs commentaires de cet auteur ?

Le pseudonyme est affiché séparément pour vérifier le choix. Les actions sont **« Annuler »** et **« Bloquer cet utilisateur »**. La modale précise : « Ce masquage s’applique sur ce profil Chrome. »

Si seul le pseudonyme est disponible comme identité, ajouter : « Les commentaires portant exactement ce pseudonyme seront masqués. » Cette précision couvre les homonymes et la limite face aux changements de pseudonyme.

Annuler, fermer la modale ou appuyer sur Échap ne modifie aucune préférence. Le focus initial est placé sur « Annuler ». Le clavier reste dans la confirmation tant qu’elle est ouverte. Fermer la confirmation rend le focus à l’action d’origine ; après un blocage qui fait disparaître cette action, le focus rejoint le message de résultat.

La confirmation doit cohabiter avec la fenêtre de commentaires du Monde : pas de pièges de focus concurrents ni fermeture des deux fenêtres par un seul Échap.

### 4.3. Application et retour

Enregistrer d’abord le choix. Après confirmation de l’écriture, masquer tous les commentaires correspondants déjà chargés, puis ceux qui arrivent ensuite. En cas d’échec de stockage, laisser les commentaires visibles et afficher une erreur permettant de réessayer.

Afficher un retour discret : « Les commentaires de [pseudonyme] sont masqués. Annuler ». L’action d’annulation reste disponible au moins dix secondes et par le gestionnaire après ce délai. Elle restaure le choix personnel précédent, sans affecter les autres auteurs.

Pour un auteur déjà masqué par la communauté, l’action « Toujours afficher cet auteur » crée une exception personnelle. Il ne suffit pas de supprimer une entrée de la liste personnelle : l’exception doit empêcher le retour du masquage communautaire.

## 5. Masquage, réponses et compteur

### 5.1. Ce qui disparaît

Masquer réellement le contenu propre au commentaire, son auteur et ses actions, en retirant ces éléments de l’affichage et de l’arbre d’accessibilité. Une baisse d’opacité ne répond pas au besoin.

Les réponses d’autres auteurs restent accessibles. Il est donc interdit de masquer aveuglément le conteneur racine d’un fil si celui-ci contient aussi leurs réponses. Si un repère est nécessaire pour préserver le fil, utiliser un élément compact « Commentaire masqué », sans pseudonyme ni extrait, avec possibilité de l’afficher ponctuellement.

Le masquage ne supprime pas un brouillon de réponse en cours. La restauration rétablit les éléments et interactions natifs. L’état de la page doit pouvoir être restauré même si le site a remplacé certains nœuds entre-temps.

### 5.2. Encart au début de la discussion

Dès qu’au moins un commentaire est masqué, afficher avant la liste des contributions :

> 7 commentaires masqués de 2 auteurs parmi les commentaires chargés.

Proposer **« Gérer les auteurs »** et **« Afficher temporairement »**. Gérer ouvre l’éditeur local sur la page ou la page d’options en repli. Le compteur porte sur des commentaires, réponses comprises, et non uniquement sur des auteurs.

Compter les commentaires distincts actuellement chargés dans la discussion active. Un commentaire présent deux fois dans le DOM n’est compté qu’une fois si son identifiant est disponible. Les réponses non chargées et les commentaires d’autres articles ne sont pas comptés. Si le site virtualise la liste, le nombre peut varier avec les éléments présents ; le libellé ne doit jamais suggérer le total de l’article.

Le compteur est recalculé après chargement, tri, ouverture de réponses, changement de préférences, restauration et navigation. Il disparaît lorsqu’il vaut zéro. Il n’altère pas le total natif du Monde.

« Afficher temporairement » révèle les commentaires de cette discussion sans modifier les préférences. L’action devient « Masquer à nouveau ». Cette dérogation s’arrête à la fermeture de la zone ou au changement d’article. « Toujours afficher cet auteur » reste une action distincte et persistante.

## 6. Réglages et gestion des auteurs

### 6.1. Page d’options

La page d’options est la référence et reste utilisable même si la structure du site change. Elle est accessible depuis Chrome et depuis le bouton de l’extension.

Elle fournit :

- L’activation générale du filtrage, sans effacer les listes.
- Une liste recherchable avec pseudonyme, mode d’identification et provenance « Personnel » ou « Communautaire ».
- L’ajout manuel d’un pseudonyme exact, avec validation, aperçu et détection des doublons.
- Trois états par auteur : « Suivre la liste communautaire », « Toujours masquer », « Toujours afficher ».
- L’interrupteur de la liste communautaire, sa version et les modifications apportées depuis la version précédente.
- La suppression d’un choix personnel et le rétablissement explicite du comportement communautaire.
- L’export et l’import d’un fichier JSON, ainsi que l’effacement des données avec confirmation.
- Une explication du stockage local, de la portée par profil et de l’indépendance vis-à-vis du Monde.

L’état vide explique comment ajouter un auteur. Les messages de résultat ne reposent pas uniquement sur la couleur. Un pseudonyme très long reste consultable sans casser la mise en page.

### 6.2. Gestion dans Le Monde

L’encart de la discussion ouvre une interface locale permettant les mêmes changements essentiels : chercher un auteur, ajouter un pseudonyme, changer son état et activer/désactiver la communauté. Elle utilise le même modèle de données que les options, sans duplication de stockage.

Ajouter si possible dans « Votre compte », sur `www.lemonde.fr`, un raccourci **« Auteurs masqués — extension »**. Il ouvre le gestionnaire de l’extension, et ne se présente pas comme une fonction native ou un réglage serveur du compte.

L’intégration directement dans la page `compte.lemonde.fr` est une amélioration ultérieure, après inspection, avec accès optionnel ciblé sur ce sous-domaine. La première version ne demande pas par avance l’accès à l’espace de compte, aux pages de connexion ou aux autres sous-domaines.

### 6.3. Import, export et mises à jour

Le fichier exporté contient uniquement la version du format, les choix personnels et les réglages. La liste communautaire publique n’a pas besoin d’être dupliquée dans chaque export.

Limiter l’import à 1 Mio et 5 000 règles personnelles pour la première version. Vérifier complètement le format et les limites avant toute écriture. Afficher un aperçu avec ajouts, remplacements et erreurs. Proposer « Fusionner » par défaut et « Remplacer » avec confirmation distincte. Une erreur doit laisser l’état précédent intact ; pas de succès annoncé avant écriture effective.

Une migration de version conserve les règles personnelles, les exceptions et le réglage d’activation. Les changements s’appliquent immédiatement aux onglets concernés ouverts, sans rechargement manuel. Une modification concurrente effectuée après l’aperçu d’un import impose une nouvelle prévisualisation avant remplacement.

## 7. Liste communautaire et contributions GitHub

### 7.1. Composition et activation

La liste initiale contient `Peps72`, fourni comme choix de filtrage. Aucune étiquette telle que « toxique », aucun classement de personnes et aucune accusation ne font partie du produit ou des données.

La liste est incluse dans le paquet distribué, versionnée et active par défaut conformément à la demande. Lors de la première utilisation, une information distincte du compteur indique : « Liste communautaire active : 1 pseudonyme. Consulter · Désactiver ». Cette information est présentée même si aucun commentaire correspondant n’est chargé. Aucun onglet externe n’est ouvert automatiquement.

Le lecteur peut désactiver la liste entière ou choisir « Toujours afficher » pour une entrée. Une mise à jour n’annule jamais ces choix. Le filtrage personnel continue lorsque la communauté est désactivée.

### 7.2. Contributions

Tout contributeur peut proposer un ajout, une correction ou un retrait par issue ou pull request. Une proposition n’est jamais appliquée automatiquement aux utilisateurs. Elle suit une revue par les responsables du projet, puis une publication de version.

Une proposition contient le pseudonyme public exact, l’éventuel identifiant public vérifiable et un contexte factuel minimal suffisant à la revue. Elle n’inclut pas de données privées, d’insultes, d’allégations sur l’identité réelle ou d’appel à contacter la personne. Les discussions portent sur une préférence de lecture et la pertinence de la règle, pas sur un procès public de l’auteur.

Vérifier les homonymes, les doublons, la cohérence de l’identité et les changements de pseudonyme avant inclusion. Une proposition insuffisante peut être refusée. Un retrait ou une correction peut être demandé avec le même mécanisme, sans justification d’identité privée.

La recette de publication vérifie le schéma, l’unicité et le diff de la liste. Chaque version indique les entrées ajoutées ou retirées. Une entrée retirée de la communauté cesse de masquer les commentaires concernés, sauf choix personnel « Toujours masquer ». Les règles personnelles restent locales : rien ne les transforme automatiquement en proposition GitHub.

### 7.3. Mises à jour

La publication d’une version applique la nouvelle liste aux installations mises à jour dont le filtrage communautaire est activé. Une information locale résume les changements à la prochaine utilisation ; les exceptions restent prioritaires. Les ajouts ne sont pas téléchargés depuis GitHub pendant la lecture.

Un abonnement à des listes externes ou une mise à jour indépendante du paquet pourra être étudié plus tard. Ce serait une évolution de confidentialité et de maintenance, pas un détail d’implémentation à introduire silencieusement.

## 8. Identité des auteurs et règles de correspondance

Rechercher d’abord un identifiant d’auteur stable, public et déjà présent dans le DOM. Ne pas confondre identifiant de commentaire et identifiant de compte. L’audit initial n’a pas établi la disponibilité ou la stabilité d’un tel identifiant : c’est un point à vérifier au début du prototype.

À défaut, comparer le pseudonyme exact après normalisation Unicode NFC et retrait des espaces de bord. Préserver la casse, les accents et les espaces internes. Aucune recherche partielle, approximation, expression régulière ou comparaison visuelle n’est utilisée en première version. `Peps72` ne doit pas masquer `Peps720`.

Une règle par identifiant garde un libellé de pseudonyme pour l’interface. Les règles ajoutées manuellement et la liste initiale peuvent porter sur un pseudonyme faute d’identifiant disponible.

Pour chaque commentaire, appliquer dans cet ordre :

1. Filtrage désactivé ou affichage temporaire de la discussion : afficher.
2. Choix personnel pour l’identifiant stable, s’il existe : afficher ou masquer selon ce choix.
3. Choix personnel pour le pseudonyme exact : afficher ou masquer selon ce choix.
4. Liste communautaire activée et règle correspondante par identifiant ou pseudonyme : masquer.
5. Sinon : afficher.

Ainsi, un choix personnel « Toujours afficher » est prioritaire sur la communauté. Un choix personnel par identifiant est plus précis qu’une règle personnelle par pseudonyme. Le gestionnaire explique les règles qui se recoupent et celle qui s’applique.

Si seule une règle par pseudonyme est possible, deux comptes homonymes sont concernés ; un auteur qui change de pseudonyme peut ne plus être reconnu. L’extension ne promet pas de suivre une personne au-delà des informations réellement disponibles.

## 9. Robustesse, interface et accessibilité

Le chargement à l’ouverture de la zone, les réponses différées, le changement d’ordre, les réouvertures, les remplacements de nœuds et les navigations entre articles doivent être gérés. Les observers sont ciblés et les traitements regroupés ; aucune boucle de scan permanent de toute la page.

En cas de structure inconnue, afficher les commentaires normalement et signaler dans l’extension qu’elle n’a pas reconnu la zone. Ne pas déduire un auteur depuis le texte de son commentaire. Si la barre d’actions seule manque, continuer le filtrage des auteurs identifiés, et conserver l’ajout manuel dans les options.

Respecter le thème réellement affiché par le site, y compris si celui-ci diffère du thème système. Si le site ne fournit pas de thème sombre, ne pas en imposer un. Les options autonomes peuvent suivre le système et offrir un choix clair/sombre. Réutiliser les polices déjà chargées et les couleurs disponibles, avec replis locaux ; ne pas embarquer de logo ou de police du Monde.

Toutes les actions sont accessibles au clavier avec focus visible, libellés explicites et annonces de résultat sobres. Viser WCAG 2.2 AA pour les éléments ajoutés ; vérifier les contrastes, le zoom à 200 %, la largeur de 320 px, les noms longs et un lecteur d’écran. Les commentaires masqués ne sont pas lus par celui-ci.

Budget de performance proposé pour le banc de recette : 1 000 commentaires et 5 000 règles, une application du filtrage en moins de 100 ms au 95e percentile sur la machine de référence documentée, hors temps de chargement du site. Un lot ne doit pas provoquer de tâche JavaScript supérieure à 50 ms ; découper le travail si nécessaire. Ces cibles sont à mesurer, pas des performances déjà obtenues.

Limiter l’apparition fugace d’un commentaire destiné à être masqué. Un content script ne peut pas garantir qu’aucune image du commentaire n’a jamais été rendue avant lui ; ne pas cacher toute la discussion en attendant une initialisation incertaine.

## 10. Critères de recette avant diffusion

| Réf. | Situation | Résultat attendu |
| --- | --- | --- |
| R01 | Commentaire visible avec « Signaler » | Une seule action de blocage est placée immédiatement avant. |
| R02 | Confirmation annulée ou fermée par Échap | Aucune préférence changée, focus restitué. |
| R03 | Blocage confirmé | Écriture réussie, tous les commentaires correspondants déjà chargés sont masqués, retour avec annulation. |
| R04 | Auteur masqué chargé après ouverture ou pagination | Son commentaire est masqué sans rechargement. |
| R05 | Tri, réouverture ou remplacement du DOM | Pas de doublon, choix et compteur cohérents. |
| R06 | Parent masqué et réponses d’autres auteurs | Réponses conservées ; aucun contenu du parent révélé par erreur. |
| R07 | Auteur homonyme ou pseudonyme proche | Correspondance conforme au mode annoncé ; aucun filtrage partiel. |
| R08 | « Toujours afficher » sur une entrée communautaire | Commentaires restaurés immédiatement et exception conservée après mise à jour. |
| R09 | Désactivation de la communauté | Seules les règles personnelles continuent à masquer. |
| R10 | Nouvelle liste communautaire | Ajouts/retraits appliqués selon réglages ; choix personnels inchangés ; diff consultable. |
| R11 | Compteur avec réponses et doublons de DOM | Nombre de commentaires distincts chargés, et non total fictif de l’article. |
| R12 | Affichage temporaire | Préférences inchangées ; filtrage rétabli à la fermeture ou au changement d’article. |
| R13 | Modification depuis options ou autre onglet | Affichage des onglets concernés mis à jour après confirmation d’écriture. |
| R14 | Import invalide, trop grand ou conflit de version | Explication exploitable, aucune modification partielle des données. |
| R15 | Import valide ou retrait d’une règle | Affichage et compteur recalculés ; anciens styles correctement restaurés. |
| R16 | Échec de stockage ou interruption du worker | Pas de faux succès ; état persistant cohérent ; nouvelle tentative possible. |
| R17 | Navigation hors `www.lemonde.fr` | Aucun content script de l’extension injecté. |
| R18 | Analyse des communications réseau | Aucun trafic applicatif de l’extension ; mises à jour Chrome et trafic propre au site distingués. |
| R19 | Examen du stockage du site | Aucune préférence de l’extension dans les bases ou le localStorage du Monde. |
| R20 | Mode clair, mode sombre réellement proposé par le site, zoom et largeur étroite | Lisibilité, contrastes, alignement et commandes utilisables. |
| R21 | Clavier et lecteur d’écran | Confirmation et gestion accessibles ; contenu masqué absent de l’arbre d’accessibilité. |
| R22 | Structure inconnue ou absence de zone | Aucune erreur bloquante ni suppression d’un élément sans identité reconnue. |
| R23 | Brouillon de réponse en cours | Brouillon conservé lors du masquage et du déblocage. |
| R24 | Désactivation générale | Commentaires restaurés, préférences conservées et commandes de blocage retirées. |

La validation associe des tests sur fixtures anonymisées, un chargement réel de l’extension dans un profil de test et une recette manuelle sur le site avec une session abonnée disponible. Les tests d’algorithme seuls ne prouvent pas la compatibilité avec Le Monde.

## 11. Marche à suivre

1. **Vérification ciblée du site.** Relever les conteneurs, actions, identifiants, thèmes et cycles de chargement ; valider le maintien des réponses et la cohabitation des modales. Produire des fixtures minimales anonymisées, sans cookies ni copie des textes d’abonnés.
2. **Prototype de filtrage personnel.** Blocage, confirmation, stockage privé, annulation, masquage réversible et chargement dynamique. Réussir R01 à R07, R16, R17, R19, R21 et R22 avant d’élargir.
3. **Version initiale complète.** Compteur, gestion sur la page et options, import/export, cohérence entre onglets, liste fournie et exceptions. Terminer la matrice de recette.
4. **Préparation de la diffusion.** Revue des permissions et du réseau, licence, politique de confidentialité, contributions, captures, paquet reproductible issu d’un tag et essai du paquet exact. Créer ensuite le dépôt GitHub public et préparer la soumission au Store ; ne pas assimiler un dépôt local à une publication.
5. **Maintenance.** Versions documentées, suivi des changements de DOM et traitement des propositions de liste. Le diagnostic partagé par un utilisateur est expurgé et envoyé volontairement, jamais automatiquement.

La livraison attendue du développement comprend le code, les tests utiles, les instructions de chargement local, le ZIP du tag testé, les permissions documentées, la politique de confidentialité fidèle au comportement final et le guide de contribution.

## 12. Points à vérifier avant de coder les adaptateurs

- Présence, unicité et stabilité d’un identifiant d’auteur public ; ne pas les supposer à partir des UUID de commentaires.
- Délimitation exacte du contenu d’un commentaire par rapport à ses réponses et à un formulaire de rédaction.
- Fonctionnement du focus et d’Échap dans la fenêtre actuelle du Monde.
- Existence et mécanisme d’un thème sombre web sur les pages concernées.
- Fiabilité d’un raccourci local dans « Votre compte » sans accès supplémentaire au sous-domaine de compte.

Ces vérifications ne remettent pas en cause l’objectif : elles déterminent les limites à afficher et les sélecteurs à utiliser. Le cahier des charges évite de promettre une unicité des pseudonymes, un thème ou une API du Monde qui n’ont pas été établis.
