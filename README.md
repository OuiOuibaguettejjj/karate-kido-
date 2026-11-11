# Karate Kido 2 — prototype 2D

Prototype de travail visant à reconstruire les mécaniques et l'ambiance de **Karate Kido 2 by GAMEE**, avec des ressources graphiques originales.

## Lancer le jeu

Aucune installation n'est nécessaire pour jouer.

Depuis le dossier du projet :

```bash
python3 -m http.server 8000
```

Ouvrir ensuite http://localhost:8000 dans un navigateur.

## Commandes

- Mobile : boutons GAUCHE / DROITE.
- Ordinateur : flèches gauche / droite ou A / D.
- Échap : pause / reprise.

## Fonctions présentes dans le prototype

- Boucle solo de coupe et d'évitement des branches.
- Score, multiplicateur, timer et record.
- Pièces et XP sauvegardés localement.
- Écrans accueil, dojo, profil, pause et fin de partie.
- Améliorations et choix de kimono.

La progression est enregistrée dans le stockage local du navigateur.

## Vérifications

La CI GitHub Actions vérifie la syntaxe, les hooks d'interface, les transitions et les interactions principales dans Chromium.

## Ce qui n'est pas encore reproduit

Les batailles en ligne, les vrais amis, les classements synchronisés, les comptes et les récompenses serveur nécessitent un backend. Ils ne sont pas présentés comme fonctionnels dans cette version.

Le prototype web est une base de référence. Pour une publication Roblox, il faudra reconstruire le jeu dans Roblox Studio en Luau.

## Références

Voir [docs/REFERENCE-ANALYSIS.md](docs/REFERENCE-ANALYSIS.md) pour les sources, les captures consultées et les éléments encore à vérifier.
