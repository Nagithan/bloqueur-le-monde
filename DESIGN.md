---
name: "Bloqueur Le Monde"
description: "Préférences de lecture locales dans l’interface du Monde."
colors:
  bg: "#fff"
  panel: "#f5f6f8"
  fg: "#263244"
  muted: "#556173"
  line: "#d7dce2"
  accent: "#075ba7"
  button: "#263b56"
  on-button: "#fff"
  error: "#a32622"
  ring: "#086bb7"
  dark-bg: "#202631"
  dark-panel: "#2c3441"
  dark-fg: "#f0f2f5"
  dark-muted: "#bac5d3"
  dark-line: "#596474"
  dark-accent: "#9aceff"
  dark-button: "#c3ddf9"
  dark-on-button: "#172333"
  dark-error: "#ffb8ad"
  dark-ring: "#99cfff"
typography:
  title:
    fontFamily: "var(--font-marr-sans,system-ui),sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
  section:
    fontFamily: "var(--font-marr-sans,system-ui),sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  dialog-title:
    fontFamily: "var(--font-marr-sans,system-ui),sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "var(--font-marr-sans,system-ui),sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-marr-sans,system-ui),sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  hint:
    fontFamily: "var(--font-marr-sans,system-ui),sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
  button:
    fontFamily: "var(--font-marr-sans,system-ui),sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.35
  injected-body:
    fontFamily: "var(--font-marr-sans,Arial,sans-serif)"
    fontSize: "14px"
    lineHeight: 1.5
rounded:
  inline: "3px"
  control: "4px"
  toast: "6px"
  dialog: "8px"
spacing:
  space-6: "6px"
  space-8: "8px"
  space-10: "10px"
  space-12: "12px"
  space-16: "16px"
  space-20: "20px"
  space-24: "24px"
  space-28: "28px"
  space-32: "32px"
  space-40: "40px"
components:
  button-primary:
    backgroundColor: "{colors.button}"
    textColor: "{colors.on-button}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-secondary:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 15px"
  button-small:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  button-secondary-hover:
    backgroundColor: "{colors.panel}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    padding: "4px 2px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
    width: "100%"
  dialog:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.dialog}"
    width: "min(580px,calc(100vw - 32px))"
  summary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    typography: "{typography.injected-body}"
    rounded: "{rounded.inline}"
    padding: "16px"
  placeholder:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    typography: "{typography.injected-body}"
    rounded: "{rounded.inline}"
    padding: "10px 12px"
  toast:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.toast}"
    padding: "16px 20px"
---

# Design System: Bloqueur Le Monde

## Overview

**Creative North Star: "L’interface de lecture existante"**

Le repère est l’interface du Monde déjà chargée : l’action injectée rejoint « Signaler » avec sa typographie et sa couleur effectives. L’extension garde une présence discrète, lisible et directement manipulable, sans construire une nouvelle identité pour le journal.

Les surfaces propres à l’extension emploient des fonds neutres, une encre bleu nuit et des séparations fines. Dans la page d’options, la pile système est autonome ; dans le site, les polices déjà disponibles peuvent être héritées. Les thèmes clair et sombre sont deux jeux de rôles équivalents : le site décide du thème des commandes injectées, tandis que les options proposent un choix local.

**Key Characteristics:**
- Une hiérarchie compacte, avec texte courant et commandes explicites.
- Des listes séparées par des filets ; les panneaux colorés signalent une information ou une vérification.
- Des actions réversibles, une annulation visible et des états de focus marqués.
- Aucune police distante ; la mention « Extension indépendante » accompagne les options.

Ce document décrit le code livré, sans nouveau choix de concept. Sources : `src/shared/ui.css`, `src/content/content.css`, `src/content/adapter.ts`, `src/content/index.ts`, `src/content/ui.ts`, les composants partagés et les options. Autorité confirmée dans `PRODUCT.md` et contrat de surface dans `.impeccable/surfaces/src-options-index-html.md`. Les captures Store des réglages et de la confirmation ont été consultées comme preuves de rendu sur une discussion synthétique ; elles ne contiennent pas de textes d’abonnés. Le sombre et les petits écrans sont décrits ici d’après le code, sans nouvelle recette visuelle dans ce passage documentaire.

## Colors

Une palette neutre de papier et d’encre, avec le bleu réservé aux liens et aux interactions ; les primitives du frontmatter correspondent aux propriétés `--blm-*` des feuilles de style. Le préfixe `dark-` indique le jeu sombre. Les valeurs machine ci-dessus font autorité. Les huit nuances de chaque rampe du sidecar sont des échantillons OKLCH synthétiques pour l’aperçu : elles ne sont pas de nouveaux jetons du produit.

### Primary

- **Bleu de lien** (`accent`, `dark-accent`) : liens, actions textuelles et caret des champs ; le résumé injecté utilise le même rôle via `--blm-link`.
- **Encre de commande** (`button`, `dark-button`) et **texte sur commande** (`on-button`, `dark-on-button`) : boutons pleins de confirmation, ajout, cases natives et sélection de texte.
- **Bleu de focus** (`ring`, `dark-ring`) : contour de focus des surfaces partagées.
- **Rouge d’erreur** (`error`, `dark-error`) : échec ou action dangereuse lorsqu’un tel état est présent, sans fond d’alerte décoratif.

### Neutral

- **Fond principal** (`bg`, `dark-bg`) : options, champs, fenêtres et notifications.
- **Fond de soutien** (`panel`, `dark-panel`) : prévisualisations, notices, survol des boutons secondaires et résumés injectés.
- **Encre de lecture** (`fg`, `dark-fg`) : texte courant et titres.
- **Encre secondaire** (`muted`, `dark-muted`) : explications, provenance, compteurs et états ordinaires.
- **Filet** (`line`, `dark-line`) : délimitations de sections, lignes d’auteurs et contours de champs.

**The Host Authority Rule.** La commande placée à gauche de « Signaler » reprend sa police et sa couleur calculées ; les modales et résumés suivent le thème effectif du site, pas la préférence système des options.

## Typography

**Body Font:** `var(--font-marr-sans,system-ui),sans-serif` dans les surfaces partagées. Les options ne chargent pas la police du site et utilisent donc la pile système. Les résumés injectés utilisent `var(--font-marr-sans,Arial,sans-serif)` ; le bouton adjacent à « Signaler » reçoit directement le `font` et la couleur calculés de cette commande native.

**Character:** une typographie d’outil sobre, sans police d’affichage distincte. La graisse structure les noms et les actions, les aides restent en texte secondaire. Aucune échelle proportionnelle unique n’est définie : les rôles observés sont explicites dans le frontmatter.

### Hierarchy

- **Title** : titre de la page d’options ; taille ramenée à (24px) au seuil principal.
- **Section** : titres de la liste ; les titres de réglages emploient une variante compacte (17px).
- **Dialog title** : question ou intitulé de la fenêtre ; taille ramenée à (20px) au seuil principal.
- **Body** : lecture courante ; paragraphes limités à (72ch).
- **Label** : champs et messages d’état ; boutons en graisse (600), noms d’auteur en graisse (650), auteur confirmé en (18px).
- **Hint** : aides, provenance et versions ; également utilisé pour les petits boutons et listes de choix.
- **Injected body** : résumés et commentaires remplacés ; la commande de blocage elle-même reste héritée.

**The Reading Hierarchy Rule.** Réserver la graisse et la taille aux titres, noms et commandes ; conserver les explications en texte courant ou secondaire, avec des libellés en casse naturelle.

## Layout

Les surfaces partagées ont une largeur minimale de (280px). La page d’options est centrée dans une largeur maximale de (1060px), avec un retrait de (48px 32px 64px). Le gestionnaire comporte une colonne fluide et un panneau latéral de (280px), séparés par (40px) ; la fenêtre large emploie un panneau de (260px). Les lignes d’auteurs associent un texte fluide à un sélecteur de (180px). Les espacements récurrents sont consignés dans le frontmatter ; les valeurs plus particulières restent attachées aux composants.

À (720px) et moins, le contenu devient une colonne, le retrait de page passe à (24px 20px 40px), l’en-tête s’empile et les boutons de dialogue partagent l’espace disponible. Les sélecteurs de ligne passent à (160px). À (390px) et moins, les lignes d’auteurs et le formulaire d’ajout s’empilent ; le retrait horizontal de page devient (16px). Dans le site, le résumé réduit son retrait et le bouton de blocage sa marge à (400px) et moins.

La fenêtre standard est limitée à (580px), la grande à (1000px), toutes deux avec une réserve horizontale de (32px), une hauteur maximale de `calc(100dvh - 48px)` et un défilement interne. Les actions se replient ; les noms et messages longs peuvent se couper. Le résumé s’insère avant la liste de commentaires ; le blocage se place immédiatement avant « Signaler ». La notification se place en bas à droite sur grand écran et occupe la largeur disponible avec une marge latérale de (16px) au seuil principal. La composition détaillée de cette surface reste dans son contrat dédié.

## Elevation & Depth

L’interface courante est plane : filets fins et fonds de soutien suffisent à séparer les zones. Seules les fenêtres et notifications portent une ombre diffuse. Le voile de dialogue assombrit le contexte avec `rgb(15 23 35 / .55)` ; il n’est pas un fond de panneau réutilisable.

### Shadow Vocabulary

- **Fenêtre superposée** (`0 18px 60px #0003`) : confirmation et gestionnaire ouverts au-dessus du site ou des options.
- **Notification locale** (`0 10px 36px #0002`) : retour d’action avec annulation ou fermeture.

**The Overlay Depth Rule.** Les ombres identifient les fenêtres et notifications superposées ; les listes et sections ordinaires se distinguent par le fond ou un filet.

## Shapes

Les coins restent courts et fonctionnels : rôle `inline` pour résumé et commentaire remplacé, `control` pour boutons et champs, `toast` pour la notification, `dialog` pour les fenêtres. Les bordures ordinaires ont une épaisseur de (1px). Les lignes d’auteurs et réglages sont ouvertes et rectilignes, sans enveloppe arrondie individuelle. Les cases et sélecteurs conservent les affordances du navigateur.

## Components

### Buttons

Commandes en casse naturelle, sans icône nécessaire à la compréhension. Le bouton principal utilise l’encre de commande et son texte associé ; le secondaire conserve le fond principal avec un filet. Les deux ont une hauteur minimale de (42px). Le petit bouton descend à (34px), avec un retrait de (6px 10px). Le lien-bouton est souligné et plus léger, avec un retrait de (4px 2px).

Le survol du principal applique `brightness(.93)` ; celui du secondaire emploie le fond de soutien. Le focus commun est un contour de (3px), décalé de (3px). Un bouton désactivé conserve sa forme, réduit son opacité à (.6) et affiche le curseur d’attente. Aucun mouvement de survol n’est défini.

### Inputs / Fields

Champs pleins sur le fond principal, bordure fine et coins de contrôle. Hauteur minimale de (42px), retrait de (8px 10px), largeur du conteneur. Les aides restent sous le libellé ; le placeholder emploie l’encre secondaire à opacité pleine. Les sélecteurs d’auteurs sont plus compacts : (13px), hauteur minimale de (38px). Le focus suit le traitement commun. Les erreurs sont des messages explicites dans le rôle d’erreur, sans inventer un contour de champ absent du code.

### Lists / Settings

Une ligne d’auteur associe un nom en graisse, sa provenance secondaire et un choix natif à trois états. Elle reçoit un filet inférieur et un retrait vertical de (17px). Les sections latérales commencent par un filet avec un retrait supérieur de (22px). Les cases font (18px) et sont accompagnées d’un libellé principal et d’une aide ; leur couleur d’accent reprend le bouton plein. La notice de vérification et l’aperçu d’import utilisent le fond de soutien avec un retrait de (16px).

### Dialogs

Une question lisible, une fermeture textuelle en tête, le corps puis les actions alignées à droite. Retraits de tête (24px 24px 0) et de corps (20px 24px 26px), réduits sur petit écran. Les confirmations placent initialement le focus sur « Annuler ». Le dialogue natif garde le focus dans la fenêtre, se ferme avec Échap et rend le focus au déclencheur encore visible. Le gestionnaire partage les mêmes composants que les options.

L’unique animation est l’apparition de la fenêtre par une translation verticale de (6px) pendant (.16s), avec `cubic-bezier(.16,1,.3,1)` ; elle ne s’exécute que lorsque la réduction des mouvements n’est pas demandée.

### Injected controls / Summary

L’action de blocage est un bouton textuel transparent sans bordure ni ombre, séparé de « Signaler » par une marge de (12px), ramenée à (8px) sur petit écran. Le survol le souligne. Son focus, comme celui des liens injectés, est un contour de (2px) en `currentColor`, décalé de (4px).

Le résumé utilise un fond de soutien, un filet et un retrait de (16px) ; les liens d’action se replient avec le texte. Un commentaire devant conserver ses réponses est remplacé par un bandeau compact avec « Afficher ce commentaire ». Ces composants utilisent des couleurs choisies d’après le fond effectif du site. Le nombre affiché porte sur les commentaires chargés et réellement masqués.

### Toast

Une notification sur le fond principal, avec filet, ombre et rôle d’annonce poli. Le texte est suivi de commandes soulignées : annuler si applicable, gérer les auteurs et fermer. Le délai est de (15s) avec annulation, (10s) sinon ; une commande déjà focalisée n’est pas supprimée au terme du délai.

## Do's and Don'ts

### Do:

- **Do** conserver les rôles clair et sombre ensemble lorsque vous ajoutez un état visuel.
- **Do** reprendre la police et la couleur du bouton « Signaler » pour l’action injectée.
- **Do** conserver un focus visible, une action d’annulation et le retour du focus à une commande encore présente.
- **Do** laisser les noms longs se replier et les groupes d’actions revenir à la ligne.
- **Do** garder les options autonomes avec la pile système et la mention « Extension indépendante ».

### Don't:

- **Don’t** remplacer l’autorité visuelle héritée du Monde par une identité concurrente.
- **Don’t** ajouter de logo du journal ni de dépendance typographique distante.
- **Don’t** appliquer le thème système aux commandes du site quand le thème effectif du site est différent.
- **Don’t** transformer les lignes d’auteurs en cartes ombrées : la séparation observée repose sur des filets.
- **Don’t** faire des captures synthétiques une preuve de compatibilité visuelle avec tous les états du site réel.
