# Installation et développement

## Utiliser le paquet local

1. Télécharger le ZIP d’une version depuis les releases du dépôt, ou utiliser le ZIP fourni dans `release/`.
2. Décompresser l’archive dans un dossier que vous conserverez tant que l’extension sera installée.
3. Ouvrir `chrome://extensions` dans Chrome (ou `brave://extensions` dans Brave).
4. Activer le mode développeur, puis « Charger l’extension non empaquetée » et sélectionner le dossier décompressé contenant `manifest.json`.
5. Actualiser les onglets du Monde déjà ouverts. Ouvrir une discussion : le bouton de blocage se place avant « Signaler ».

L’extension demande l’accès à `https://www.lemonde.fr/*` et au stockage de ses préférences. Elle ne demande pas l’accès à tous les sites ni aux pages de compte sur d’autres sous-domaines.

La liste communautaire est active par défaut et contient initialement `Peps72`. Elle est annoncée sur la page et désactivable depuis les réglages. Une exception « Toujours afficher » reste prioritaire. Cliquer sur l’icône de l’extension ouvre les réglages ; aucun abonnement additionnel à un service de l’extension n’est nécessaire.

Le mode développeur ne fournit pas les mises à jour automatiques du Store. Pour mettre à jour une installation locale, remplacer le dossier par la nouvelle version et utiliser « Actualiser » dans la page des extensions, puis recharger les onglets du Monde. Exporter ses préférences avant une désinstallation, car celle-ci supprime le stockage de l’extension.

## Retirer l’extension

Utiliser « Supprimer » dans la page des extensions. Les données locales de l’extension sont supprimées. Les effets de l’ancienne exécution sur un onglet ouvert peuvent subsister jusqu’à l’actualisation de cet onglet ; aucune donnée du site ou du compte n’est modifiée par l’extension.

## Construire depuis les sources

Prérequis : Node.js 24 ou plus récent, npm et Python 3 pour l’archive. Le développement de référence a été effectué avec Node 24.22.1.

```sh
npm ci --ignore-scripts
npm run build
```

Le dossier `dist/` est directement chargeable comme extension non empaquetée. Le build inclut la liste communautaire, produit les icônes depuis le SVG original et ne nécessite aucune clé d’API.

## Vérifier et créer le ZIP

```sh
npx playwright install chromium
npm run check
npm run package
```

Les tests d’intégration lancent Chromium avec un profil temporaire et le paquet réellement chargé. Les requêtes de pages sont remplacées par des fixtures locales ; aucun compte Le Monde n’est copié et aucun commentaire d’abonné n’est utilisé. Les rapports et captures sont écrits dans `output/`, exclu de Git.

Si un Chromium de Playwright est déjà présent sur macOS, le banc peut l’utiliser ; sa version exacte figure dans le rapport. La variable `BLM_CHROMIUM` permet de choisir explicitement un binaire de test. La CI installe celui correspondant à la version verrouillée de Playwright.

Le ZIP est écrit sous `release/bloqueur-le-monde-1.0.0.zip`, accompagné de `SHA256SUMS.txt`. Un second ZIP, `release/dossier-chrome-web-store-1.0.0.zip`, réunit le paquet, les textes de soumission, l’icône et les captures de démonstration. Décompresser ce dossier avant utilisation : il ne se charge pas lui-même comme extension. Les dates ZIP, l’ordre et les permissions de fichiers sont déterministes. Les dépendances npm sont uniquement des dépendances de développement ; les scripts et interfaces livrés fonctionnent sans serveur.

## Captures de démonstration

```sh
npm run capture
```

Cette commande charge aussi le vrai paquet, sur des commentaires fictifs. Les captures de taille Store sont placées dans `store/assets/`. Les commandes du banc sont masquées dans les captures, mais le caractère synthétique de la discussion est conservé. Ne pas substituer de captures contenant des textes d’abonnés sans les autorisations nécessaires.
