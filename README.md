# Slither.io - Clone du Jeu Snake Multijoueur

## 📋 Description du Projet

Ce projet est un clone du jeu Slither.io développé en HTML5, CSS3 et JavaScript pur. Il s'agit d'un jeu de type "snake" multijoueur en temps réel où le joueur contrôle un serpent qui doit grandir en mangeant de la nourriture tout en évitant les autres serpents.

## 🎯 Objectif du Jeu

Le but est de faire grandir son serpent en collectant de la nourriture dispersée sur la carte tout en évitant de toucher d'autres serpents. Plus le serpent mange, plus il grandit et plus son score augmente. Le jeu se termine lorsque le serpent du joueur entre en collision avec un autre serpent.

## 🏗️ Architecture du Projet

### Structure des Fichiers

```
slither.6005/
├── index.html          # Page HTML principale
├── css/
│   └── style.css       # Styles CSS du jeu
├── js/
│   ├── game.js         # Moteur principal du jeu
│   ├── snake.js        # Logique des serpents
│   └── food.js         # Logique de la nourriture
└── images/
    ├── Map2.png        # Image de fond de la carte
    ├── head.png        # Texture de la tête du serpent
    └── body/           # Textures des corps de serpents
        ├── 0.png
        ├── 1.png
        └── ... (13 textures différentes)
```

## 📄 Analyse Détaillée des Fichiers

### 1. index.html

- **Rôle** : Structure HTML minimaliste
- **Contenu** :
  - Titre de la page : "Slither.io | HaiZuka"
  - Liaison avec le fichier CSS
  - Configuration de la viewport pour la compatibilité mobile
  - Chargement des scripts JavaScript dans l'ordre correct

### 2. css/style.css

- **Rôle** : Styles visuels du jeu
- **Fonctionnalités** :
  - Suppression des marges et padding par défaut
  - Fond blanc centré
  - Désactivation des barres de défilement
  - Configuration pour un affichage plein écran

### 3. js/game.js - Moteur Principal

#### Variables Globales

```javascript
game_W = 0, game_H = 0;          // Dimensions de l'écran
bg_im = new Image();             // Image de fond
SPEED = 1;                       // Vitesse de base
MaxSpeed = 0;                    // Vitesse maximale
chX = chY = 1;                   // Direction du serpent joueur
mySnake = [];                    // Tableau des serpents
FOOD = [];                       // Tableau de la nourriture
NFood = 2000;                    // Nombre d'éléments de nourriture
Nsnake = 20;                     // Nombre de serpents IA
sizeMap = 2000;                  // Taille de la carte
```

#### Classe `game`

- **Constructeur** : Initialise le canvas et le contexte 2D
- **Méthodes principales** :
  - `init()` : Configuration initiale du jeu, création des serpents et de la nourriture
  - `loop()` : Boucle principale du jeu (30 FPS)
  - `update()` : Mise à jour de la logique du jeu
  - `draw()` : Rendu graphique
  - `listenMouse()` / `listenTouch()` : Gestion des contrôles
  - `checkDie()` : Détection des collisions

#### Système de Contrôle

- **Souris** : Le serpent suit le curseur de la souris
- **Tactile** : Support complet pour les appareils mobiles
- **Accélération** : Clic/appui maintenu pour augmenter la vitesse

#### Génération de Contenu

- **Serpents IA** : 20 serpents contrôlés par l'IA avec des noms aléatoires
- **Nourriture** : 2000 éléments de nourriture colorée générés aléatoirement
- **Régénération** : Contenu régénéré dynamiquement selon la position du joueur

### 4. js/snake.js - Logique des Serpents

#### Classe `snake`

- **Propriétés** :
  - `name` : Nom du serpent (joueur = "HaiZuka", IA = noms aléatoires)
  - `score` : Score actuel du serpent
  - `size` : Taille du serpent basée sur le score
  - `v[]` : Tableau des positions des segments du corps

#### Comportements

- **IA Serpents** :
  - Déplacement aléatoire avec changement de direction périodique
  - Recherche automatique de nourriture à proximité
  - Accélération occasionnelle pour échapper aux dangers
  - Gain de score passif au fil du temps

- **Croissance** :
  - Taille proportionnelle au score : `size = getSize() / 2 * (score/1000)^(1/5)`
  - Longueur du corps augmente avec le score
  - Perte de score lors de l'accélération

#### Système de Collision

- Détection précise entre la tête et les segments du corps des autres serpents
- Mort instantanée en cas de collision
- Transformation du serpent mort en nourriture

### 5. js/food.js - Système de Nourriture

#### Classe `food`

- **Propriétés** :
  - `size` : Taille de l'élément (varie aléatoirement)
  - `value` : Valeur en points (égale à la taille)
  - `color` : Couleur aléatoire parmi 8 couleurs prédéfinies
  - Position (x, y) sur la carte

#### Rendu

- Cercles colorés dessinés avec Canvas 2D
- 8 couleurs disponibles : Rouge, Jaune, Vert, Magenta, Blanc, Cyan, Vert lime, Orange
- Optimisation d'affichage : seule la nourriture visible est rendue

## 🎮 Mécaniques de Jeu

### Système de Score

1. **Collecte de nourriture** : +valeur de la nourriture
2. **Croissance passive IA** : +score/666 par frame
3. **Pénalité d'accélération** : -score/2000 par frame en accélération

### Système de Respawn

- **Joueur** : Game Over avec affichage du score final
- **IA** : Respawn immédiat avec nouveau nom et position aléatoire
- **Score minimal** : 200 points minimum ou score/10 du joueur

### Affichage du Classement

- Top 10 des meilleurs scores en temps réel
- Position du joueur mise en surbrillance
- Affichage du rang même au-delà du top 10

## 🖥️ Optimisations Techniques

### Performance

- **Limitation FPS** : 30 images par seconde avec `setTimeout`
- **Culling** : Objets hors écran non rendus
- **Gestion mémoire** : Réutilisation des objets nourriture

### Responsive Design

- Adaptation automatique à la taille de l'écran
- Support mobile et desktop
- Redimensionnement dynamique du canvas

### Système de Caméra

- Suivi fluide du serpent joueur
- Fond défilant avec image de carte
- Gestion des bordures de carte avec wrap-around

## 🎨 Assets Graphiques

### Images

- **head.png** : Texture unique pour toutes les têtes de serpents
- **body/0.png à 12.png** : 13 textures différentes pour les corps (sélection aléatoire)
- **Map2.png** : Image de fond de la carte de jeu

### Rendu Graphique

- Canvas HTML5 avec contexte 2D
- Rotation de la tête selon la direction
- Transparence et superposition des éléments

## 🔧 Configuration et Variables

### Paramètres de Jeu Modifiables

```javascript
NFood = 2000;        // Nombre d'éléments de nourriture
Nsnake = 20;         // Nombre de serpents IA
sizeMap = 2000;      // Taille de la carte
minScore = 200;      // Score minimum au respawn
Nball = 13;          // Nombre de textures de corps disponibles
```

### Couleurs de Nourriture

```javascript
ArrColor = ["#FF0000", "#FFFF00", "#00FF00", "#FF00FF", 
            "#FFFFFF", "#00FFFF", "#7FFF00", "#FFCC00"];
```

## 🚀 Comment Lancer le Projet

1. **Prérequis** : Navigateur web moderne supportant HTML5 Canvas
2. **Lancement** : Ouvrir `index.html` dans un navigateur
3. **Contrôles** :
   - **Souris** : Déplacer pour diriger le serpent
   - **Clic maintenu** : Accélérer (consomme du score)
   - **Mobile** : Toucher et glisser pour diriger

## 🎯 Fonctionnalités Avancées

### IA Comportementale

- **Recherche de nourriture** : Les serpents IA recherchent activement la nourriture proche
- **Évitement adaptatif** : Changement de direction pour éviter les obstacles
- **Comportement réaliste** : Mélange de mouvements aléatoires et dirigés

### Système de Monde Persistant

- **Monde infini** : Génération procédurale de contenu autour du joueur
- **État global** : Tous les serpents partagent le même espace de jeu
- **Synchronisation** : Mise à jour cohérente de tous les éléments

## 🐛 Points d'Amélioration Identifiés

1. **Code** : Quelques variables globales pourraient être encapsulées
2. **Performance** : Optimisation possible des calculs de distance
3. **Fonctionnalités** : Ajout possible d'effets sonores et visuels
4. **Multijoueur** : Base solide pour une extension réseau

## 📊 Analyse Technique Finale

Ce projet démontre une excellente compréhension des technologies web modernes avec :

- **JavaScript orienté objet** bien structuré
- **Gestion d'événements** complète (souris + tactile)
- **Rendu Canvas 2D** optimisé
- **Logique de jeu** complexe et cohérente
- **Architecture modulaire** facilitant la maintenance

Le code est fonctionnel, bien organisé et offre une expérience de jeu fluide et engageante proche de l'original Slither.io.
