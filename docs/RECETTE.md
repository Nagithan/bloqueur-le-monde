# Recette de la version 1.0.0

État au 4 novembre 2026 : version 1.0.0 prête à la diffusion, avec recette automatisée du paquet et recette manuelle sur deux articles du site réel. La publication Chrome Web Store attend la validation de l’éditeur.

L’installation temporaire dans Brave, le chargement hors Store et son retrait ont été autorisés. La recette a permis de corriger le raccourci du compte pour le menu actuel. L’extension a ensuite été désinstallée, le mode développeur désactivé et le zoom de départ rétabli à 100 %. Les onglets ajoutés pour la recette ont été fermés et l’article initial rechargé sans commandes de filtrage. Aucun commentaire, signalement ou réaction n’a été envoyé.

## Environnements et preuves

- Node.js 24.22.1, macOS arm64 ; Chromium de test 153.0.8010.12, lancé avec un profil temporaire et le paquet réel `dist/`.
- `npm run check` : typage strict, 10 tests du modèle, contrôle du paquet, 29 scénarios d’intégration et banc de charge. Résultats détaillés sous `output/test-results/`, exclus de Git. La [CI Ubuntu](https://github.com/Nagithan/bloqueur-le-monde/actions/workflows/ci.yml) refait ces vérifications avec le Chromium de la version verrouillée de Playwright ; consulter le résultat du commit du tag livré.
- Recette réelle : Brave 1.98.63 / Chromium 156.0.8078.80, macOS 27.0.1 arm64, session abonnée existante, sans copie de profil ni de cookies.
- Fixtures minimales au format des composants publics actuels du site, auteurs et textes fictifs. Aucun profil, cookie ou contenu d’abonné copié. Les réponses réseau de pages de test sont remplacées par ces fixtures ; les requêtes inattendues sont bloquées.
- Revue visuelle des options, confirmations et gestion intégrée en clair/sombre et sur petit écran. Les quatre corrections de finition sont validées : ajout avec aperçu et doublons, annulation d’import, intégration sombre et cadrage des captures Store.

Les tests du paquet sur fixtures prouvent son fonctionnement dans le navigateur, mais ne constituent pas à eux seuls une validation sur le site réel. Les règles axe automatisées ne remplacent pas une recette complète au lecteur d’écran.

## Matrice

| Réf. | Vérification | État et portée |
| --- | --- | --- |
| R01 | Placement avant Signaler, unicité | Intégration réussie ; placement et unicité vérifiés sur les deux articles réels. |
| R02 | Annulation, Échap et focus | Intégration et recette réelle réussies : focus sur Annuler, Échap ferme la confirmation et conserve la discussion ; retour au déclencheur. |
| R03 | Blocage et annulation | Intégration et recette réelle réussies, compteur corrigé après blocage et annulation. |
| R04 | Chargement tardif | Intégration réussie après ajout au DOM ; ouverture différée et chargement d’une réponse vérifiés sur le site réel. |
| R05 | Remplacement/réouverture | Intégration réussie, commandes sans doublons ; action parent tardive et changement d’auteur pendant les pauses de traitement couverts. |
| R06 | Réponses d’autres auteurs | Parent masqué et réponse d’un autre auteur conservée en intégration et sur le site réel. |
| R07 | Identité exacte | Modèle et intégration réussis pour normalisation, pseudonymes proches et priorités. Aucun identifiant stable d’auteur établi sur le site. |
| R08 | Exception communautaire | Modèle, intégration et choix natif « Toujours afficher » sur le site réel réussis ; restauration et persistance vérifiées dans les options. |
| R09 | Désactivation communautaire | Intégration réussie, règles personnelles préservées. |
| R10 | Nouvelle version de liste | Schéma, unicité et priorité testés ; historique visible. Une migration entre deux versions publiées n’a pas été testée en conditions de mise à jour Store. |
| R11 | Compteur distinct | Intégration réussie, doublon d’identifiant non recompté. |
| R12 | Affichage temporaire | Intégration et recette réelle réussies, retour au filtrage après fermeture/réouverture. |
| R13 | Options et concurrence | Propagation entre pages et écritures sérialisées vérifiées. Raccourci du compte testé après reconstruction en intégration ; ouverture réelle des options et choix personnel appliqué après rechargement d’un autre article vérifiés. |
| R14 | Import invalide/limites | Validation du modèle et absence d’écriture partielle vérifiées ; protection de révision présente dans le protocole. |
| R15 | Import, retrait et restauration | Intégration réussie ; export JSON vérifié. |
| R16 | Erreur de stockage | Échec de `storage.local.set` injecté dans le vrai worker : pas de succès ni masquage. Reconnexion implémentée ; suspension prolongée du worker non reproduite. |
| R17 | Domaine d’injection | Manifeste contrôlé, aucune injection sur un domaine témoin. |
| R18 | Communications | Aucune requête applicative supplémentaire observée pendant la recette ; contrôle statique complémentaire des primitives réseau/code dynamique. |
| R19 | Stockage privé | Préférences dans le stockage de l’extension, aucune base créée dans le site de test. |
| R20 | Thèmes et largeur | Clair/sombre de fixture, options système/clair/sombre, largeur 320 px testés ; thème clair réel et confirmation à 200 % vérifiés. Aucun mode sombre natif activable établi pendant cette recette. |
| R21 | Accessibilité | Navigation clavier et focus des confirmations vérifiés sur fixtures et site réel ; règles axe sur options/modale réussies. Recette vocale complète non effectuée : aucune certification WCAG annoncée. |
| R22 | Structure inconnue | Fixture inconnue laissée intacte sans blocage du site. |
| R23 | Brouillon | Brouillon de réponse préservé pendant masquage/déblocage en intégration. |
| R24 | Désactivation générale | Restauration immédiate et conservation des préférences vérifiées. |

La sélection native du gestionnaire intégré a été vérifiée dans Brave au clavier : ouvrir le sélecteur, choisir « Toujours afficher », valider et vérifier le choix dans les options. Ce parcours complète le banc headless macOS, où le menu natif ne valide pas cette interaction via le clavier automatisé. Les changements synthétiques émis par un script de page sont délibérément rejetés.

## Charge

Cinq essais avec 1 000 commentaires et 5 000 règles ont donné 62, 76, 68, 61 et 73 ms, planification et interrogation du banc comprises. Le percentile empirique à 95 % de ces cinq essais vaut donc 76 ms sur la machine de référence. Ce petit échantillon ne prédit pas tous les appareils. Le gestionnaire ne crée que 100 lignes à la fois.

Le budget visé de 100 ms est atteint dans cette mesure. Le garde-fou du test portable est de 2 000 ms pour détecter les régressions majeures sur des machines CI variables. La durée maximale des tâches JavaScript n’a pas été profilée séparément ; le rendu est découpé en lots de 150 commentaires.

## Recette réelle effectuée

Articles : [Mouvement lycéen](https://www.lemonde.fr/societe/article/2026/11/03/mouvement-lyceen-entre-reprise-des-cours-et-maintien-des-blocus-la-mobilisation-a-un-moment-charniere-apres-les-vacances_6805651_3224.html) et [Conférence à Villeurbanne](https://www.lemonde.fr/politique/article/2026/11/03/la-conference-du-depute-lfi-raphael-arnault-annulee-a-lyon-pour-des-raisons-de-securite-aura-finalement-lieu-a-villeurbanne_6805669_823448.html). Le contrôle passe par l’interface du navigateur, sans exécuter de script dans sa console.

1. Ouverture différée : bouton avant Signaler, information communautaire et un commentaire de la liste initiale masqué sur chaque article.
2. Annulation par Échap : discussion native conservée, focus rendu au bouton. Confirmation au clavier : disparition du commentaire et compteur mis à jour ; Annuler restaure l’affichage.
3. Parent masqué : chargement d’une réponse d’un autre auteur, qui reste visible et dispose de ses propres actions.
4. Gestionnaire intégré : choix natif « Toujours afficher », restauration immédiate et préférence retrouvée dans les options. Retour au comportement communautaire vérifié.
5. Menu du compte : raccourci après l’en-tête, ouverture des options, sans navigation vers une autre origine. Le sélecteur a été corrigé d’après le DOM public observé, sans conserver les informations du compte.
6. Persistance : choix personnel effectué sur le second article, puis appliqué après rechargement du premier ; compteur observé de trois commentaires masqués de deux auteurs.
7. Affichage temporaire : auteurs réaffichés sans changer les règles ; fermeture/réouverture rétablit le filtrage.
8. Zoom 200 % : résumé et confirmation lisibles, actions accessibles par défilement interne ; retour au zoom initial de 100 %.
9. Nettoyage : désinstallation, mode développeur désactivé, onglets ajoutés fermés et page initiale restaurée. Les préférences créées pour la recette disparaissent avec l’installation temporaire.

Les captures publiques restent entièrement fictives. Aucun texte d’abonné, adresse de compte, export personnel ou cookie n’est publié. Le [relevé synthétique](recette-1.0.0.json) contient uniquement les environnements et résultats nécessaires à la reproductibilité.

## Limites de diffusion

La version s’appuie sur la structure actuelle de commentaires ; une évolution du journal peut nécessiter un nouvel adaptateur. La comparaison par pseudonyme exact ne distingue pas deux comptes homonymes et ne suit pas un changement de nom. Aucun accès supplémentaire aux articles ou commentaires réservés aux abonnés n’est fourni. Firefox, Safari, Chrome mobile et les applications du journal ne font pas partie de la recette.
