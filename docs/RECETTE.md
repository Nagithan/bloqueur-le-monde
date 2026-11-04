# Recette de la version 1.0.0

État au 4 novembre 2026 : paquet Manifest V3 testé dans Chromium, revue visuelle terminée ; recette finale sur la session réelle du journal encore à effectuer. La publication Chrome Web Store attend la validation de l’éditeur.

## Environnements et preuves

- Node.js 24.22.1, macOS arm64 ; Chromium de test 153.0.8010.12, lancé avec un profil temporaire et le paquet réel `dist/`.
- `npm run check` : typage strict, 10 tests du modèle, contrôle du paquet, 28 scénarios d’intégration et banc de charge. Résultats détaillés sous `output/test-results/`, exclus de Git. Une première exécution CI Ubuntu a réussi : [run 41762494072](https://github.com/Nagithan/bloqueur-le-monde/actions/runs/41762494072). La CI refait ces vérifications avec le Chromium de la version verrouillée de Playwright ; consulter le résultat du commit livré.
- Fixtures minimales au format des composants publics actuels du site, auteurs et textes fictifs. Aucun profil, cookie ou contenu d’abonné copié. Les réponses réseau de pages de test sont remplacées par ces fixtures ; les requêtes inattendues sont bloquées.
- Revue visuelle des options, confirmations et gestion intégrée en clair/sombre et sur petit écran. Les quatre corrections de finition sont validées : ajout avec aperçu et doublons, annulation d’import, intégration sombre et cadrage des captures Store.

Les tests du paquet sur fixtures prouvent son fonctionnement dans le navigateur, mais ne constituent pas à eux seuls une validation sur le site réel. Les règles axe automatisées ne remplacent pas une recette complète au lecteur d’écran.

## Matrice

| Réf. | Vérification | État et portée |
| --- | --- | --- |
| R01 | Placement avant Signaler, unicité | Intégration sur fixture actuelle réussie ; placement réel à vérifier. |
| R02 | Annulation, Échap et focus | Intégration réussie, fenêtre native simulée conservée ; cohabitation réelle à vérifier. |
| R03 | Blocage et annulation | Intégration réussie sur le vrai paquet. |
| R04 | Chargement tardif | Intégration réussie après ajout de commentaires au DOM. |
| R05 | Remplacement/réouverture | Intégration réussie, commandes sans doublons ; action parent tardive et changement d’auteur pendant les pauses de traitement couverts. |
| R06 | Réponses d’autres auteurs | Parent masqué et réponse conservée en intégration. |
| R07 | Identité exacte | Modèle et intégration réussis pour normalisation, pseudonymes proches et priorités. Aucun identifiant stable d’auteur établi sur le site. |
| R08 | Exception communautaire | Modèle et intégration réussis ; les données personnelles sont séparées du paquet communautaire. |
| R09 | Désactivation communautaire | Intégration réussie, règles personnelles préservées. |
| R10 | Nouvelle version de liste | Schéma, unicité et priorité testés ; historique visible. Une migration entre deux versions publiées n’a pas été testée en conditions de mise à jour Store. |
| R11 | Compteur distinct | Intégration réussie, doublon d’identifiant non recompté. |
| R12 | Affichage temporaire | Intégration réussie, retour au filtrage après fermeture/réouverture. |
| R13 | Options et concurrence | Propagation entre pages et écritures du worker sérialisées vérifiées. |
| R14 | Import invalide/limites | Validation du modèle et absence d’écriture partielle vérifiées ; protection de révision présente dans le protocole. |
| R15 | Import, retrait et restauration | Intégration réussie ; export JSON vérifié. |
| R16 | Erreur de stockage | Échec de `storage.local.set` injecté dans le vrai worker : pas de succès ni masquage. Reconnexion implémentée ; suspension prolongée du worker non reproduite. |
| R17 | Domaine d’injection | Manifeste contrôlé, aucune injection sur un domaine témoin. |
| R18 | Communications | Aucune requête applicative supplémentaire observée pendant la recette ; contrôle statique complémentaire des primitives réseau/code dynamique. |
| R19 | Stockage privé | Préférences dans le stockage de l’extension, aucune base créée dans le site de test. |
| R20 | Thèmes et largeur | Clair/sombre de fixture, options système/clair/sombre, largeur 320 px testés ; thème natif réel et zoom manuel à vérifier. |
| R21 | Accessibilité | Navigation clavier et focus des confirmations, règles axe sur options/modale réussis. Lecture vocale manuelle restant à effectuer. |
| R22 | Structure inconnue | Fixture inconnue laissée intacte sans blocage du site. |
| R23 | Brouillon | Brouillon de réponse préservé pendant masquage/déblocage en intégration. |
| R24 | Désactivation générale | Restauration immédiate et conservation des préférences vérifiées. |

La sélection native d’un choix depuis le gestionnaire intégré doit être vérifiée manuellement : le menu natif du Chromium headless macOS ne valide pas cette interaction via clavier automatisé. L’ajout confirmé dans ce gestionnaire et la propagation depuis les options sont testés. Les changements synthétiques émis par un script de page sont délibérément rejetés.

## Charge

Cinq essais avec 1 000 commentaires et 5 000 règles ont donné 71, 74, 70, 72 et 89 ms, planification et interrogation du banc comprises. Le percentile empirique à 95 % de ces cinq essais vaut donc 89 ms sur la machine de référence. Ce petit échantillon ne prédit pas tous les appareils. Le gestionnaire ne crée que 100 lignes à la fois.

Le budget visé de 100 ms est atteint dans cette mesure. Le garde-fou du test portable est de 2 000 ms pour détecter les régressions majeures sur des machines CI variables. La durée maximale des tâches JavaScript n’a pas été profilée séparément ; le rendu est découpé en lots de 150 commentaires.

## Recette manuelle avant soumission

Charger le paquet exact avec accord du titulaire du profil, puis vérifier sans poster de commentaire ni effectuer de signalement :

1. Ouvrir une discussion réelle et vérifier le bouton avant Signaler ainsi que l’information communautaire.
2. Annuler une confirmation par Échap, puis confirmer un masquage et l’annuler. Vérifier le compteur.
3. Masquer un parent avec réponses, charger d’autres commentaires, réouvrir la discussion et visiter un autre article.
4. Ouvrir le gestionnaire depuis la discussion et le menu du compte, sélectionner un choix natif et vérifier sa persistance dans les options.
5. Vérifier les thèmes proposés par le site, le zoom à 200 % et le parcours au lecteur d’écran.
6. Retirer l’installation de recette si elle était temporaire et recharger les pages concernées.

## Limites de diffusion

La version s’appuie sur la structure actuelle de commentaires ; une évolution du journal peut nécessiter un nouvel adaptateur. La comparaison par pseudonyme exact ne distingue pas deux comptes homonymes et ne suit pas un changement de nom. Aucun accès supplémentaire aux articles ou commentaires réservés aux abonnés n’est fourni. Firefox, Safari, Chrome mobile et les applications du journal ne font pas partie de la recette.
