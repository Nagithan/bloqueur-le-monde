# Design System: Bloqueur Le Monde

L’extension prolonge l’interface du Monde. Mode : Operate. L’autorité visuelle est le site chargé : ses composants, ses polices Marr Sans, ses couleurs et son thème effectif. Aucune police distante ni identité concurrente n’est ajoutée.

## Discussion

Le compteur remplace les enfants du composant `[data-element="welcome-message"]` (repli `.ds-comments-welcome-message`). La détection ne dépend jamais du texte de bienvenue. Le paragraphe reprend la classe du texte natif, donc sa police, sa graisse et ses couleurs. Il contient seulement le nombre de commentaires masqués et de commentateurs concernés, sans bouton. Si le composant manque, aucun panneau de remplacement n’est ajouté. Désactiver le filtrage ou fermer la discussion restaure les nœuds natifs.

Le bouton de blocage reste placé avant « Signaler » et reprend ses styles calculés. Aucun bouton ne permet de révéler un commentaire masqué dans la discussion. Les réponses d’autres commentateurs et les brouillons sont préservés.

## Accès aux réglages

Le menu « Votre compte » contient « Commentateurs masqués (Extension) », juste après son en-tête. Le bouton utilise `Connexion__link`, avec la structure interne native : le site contrôle police, graisse, couleur, hauteur, marges et survol sur toute la largeur. Seul le focus clavier reçoit un style propre à l’extension.

Le bouton du navigateur ouvre ce même gestionnaire dans l’onglet du Monde actif, ou ouvre Le Monde si aucun content script ne répond. Les options Chrome redirigent vers `https://www.lemonde.fr/#blm-settings`. Cette route ouvre le gestionnaire, reste rechargeable et est retirée de l’URL à sa fermeture. Il n’existe plus d’interface autonome de préférences.

## Gestionnaire

Une fenêtre de largeur maximale 720 px présente deux interrupteurs, la recherche, l’ajout de pseudonyme et une liste simple séparée par des filets. Chaque ligne contient uniquement le pseudonyme et une corbeille SVG de 20 px dans une cible de 40 px, avec un nom accessible explicite. La corbeille retire la règle personnelle ou mémorise une exception pour une entrée communautaire. Les anciennes exceptions restent respectées et un pseudonyme retiré peut être ajouté de nouveau.

La sauvegarde (import/export) et la réinitialisation suivent la liste. Les explications répétées, les versions affichées, l’historique communautaire, la provenance par ligne et la section Apparence sont supprimés. L’ajout, l’import et la réinitialisation conservent leurs confirmations et leurs erreurs explicites.

Les propriétés `--ds-color-*` et `--font-marr-sans*` du Monde alimentent les composants du Shadow DOM. Des valeurs de repli couvrent les structures de démonstration et les styles hôtes pas encore chargés. Le thème du site est observé pendant l’ouverture ; l’ancien choix de thème reste lisible dans le stockage pour compatibilité mais ne pilote plus l’interface.

## Accessibilité et validation

Les commandes sont nommées, le focus est visible, les fenêtres conservent le focus clavier et Échap revient à la page. Les noms longs se replient. Le formulaire passe sur une colonne sous 390 px. Les annonces de statut restent discrètes et les animations respectent `prefers-reduced-motion`.

Les tests d’intégration chargent le paquet réel sur une discussion synthétique. Ils comparent les styles du raccourci et du lien natif de la fixture, vérifient le composant remplacé, les corbeilles, les mises à jour, les erreurs et axe. Les captures de `store/assets/` sont des démonstrations synthétiques avec provenance, jamais une preuve de rendu sur tous les états du site réel. Le sélecteur du message de bienvenue et les classes du compte ont été vérifiés sur le site le 16 novembre 2026.
