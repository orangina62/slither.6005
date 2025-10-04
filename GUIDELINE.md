# 🐍 Slither.io - Guide d'Intégration des Nouvelles Fonctionnalités

## 📋 Vue d'Ensemble des Modifications

Ce guide détaille l'implémentation des fonctionnalités suivantes pour transformer le projet Slither.io actuel en un véritable jeu multijoueur :

1. **Suppression des bots** - Passage en mode multijoueur pur
2. **Limites de carte dynamiques** - Bordures mortelles adaptées au nombre de joueurs
3. **Système d'authentification** - Connexion utilisateur avec base de données SQL
4. **Menu de customisation** - Personnalisation de l'apparence du serpent
5. **Multijoueur en temps réel** - Architecture WebSocket hébergée sur Vercel

---

## 🏗️ Architecture Technique Globale

### Stack Technologique Recommandée

```
Frontend (Client):
├── HTML5 Canvas (existant)
├── JavaScript ES6+ (existant)
├── WebSocket Client API
└── CSS3 (existant)

Backend (Serveur):
├── Node.js + Express.js
├── Socket.io (WebSocket)
├── Base de données: PostgreSQL (Vercel Postgres)
├── Authentification: JWT + bcrypt
├── Email: Nodemailer + SendGrid
└── Déploiement: Vercel Serverless Functions

Structure des Données:
├── Utilisateurs (SQL)
├── Parties en cours (Redis/Mémoire)
├── Customisations (SQL)
└── Statistiques (SQL)
```

---

## 📂 Nouvelle Structure du Projet

```
slither-multiplayer/
├── client/                     # Frontend (existant modifié)
│   ├── index.html
│   ├── login.html             # NOUVEAU
│   ├── customization.html     # NOUVEAU
│   ├── css/
│   │   ├── style.css          # Modifié
│   │   ├── login.css          # NOUVEAU
│   │   └── customization.css  # NOUVEAU
│   ├── js/
│   │   ├── game.js            # Fortement modifié
│   │   ├── snake.js           # Modifié
│   │   ├── food.js            # Légèrement modifié
│   │   ├── auth.js            # NOUVEAU
│   │   ├── customization.js   # NOUVEAU
│   │   └── socket-client.js   # NOUVEAU
│   └── images/                # Existant + nouvelles options
├── server/                     # NOUVEAU - Backend complet
│   ├── api/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── customization.js
│   ├── socket/
│   │   └── game-server.js
│   ├── database/
│   │   ├── schema.sql
│   │   └── connection.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── utils/
│   │   └── email.js
│   └── server.js
├── package.json               # NOUVEAU
├── vercel.json               # NOUVEAU
└── README.md                 # Mis à jour
```

---

## 🗄️ Base de Données - Schema SQL

### Tables Principales

```sql
-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des customisations de serpents
CREATE TABLE snake_customizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    head_texture INTEGER DEFAULT 0,
    body_texture INTEGER DEFAULT 0,
    primary_color VARCHAR(7) DEFAULT '#FF0000',
    secondary_color VARCHAR(7) DEFAULT '#AA0000',
    pattern_type INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des statistiques de jeu
CREATE TABLE game_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    best_score INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    total_kills INTEGER DEFAULT 0,
    total_playtime INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_customizations_user_id ON snake_customizations(user_id);
CREATE INDEX idx_stats_user_id ON game_stats(user_id);
```

---

## 🔐 Système d'Authentification

### 1. Page de Connexion (`login.html`)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <title>Slither.io - Connexion</title>
    <link rel="stylesheet" href="css/login.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div class="auth-container">
        <div class="auth-form">
            <h1>Slither.io</h1>
            
            <!-- Formulaire de connexion -->
            <div id="login-form">
                <h2>Connexion</h2>
                <form id="loginForm">
                    <input type="text" id="username" placeholder="Nom d'utilisateur" required>
                    <input type="password" id="password" placeholder="Mot de passe" required>
                    <button type="submit">Se connecter</button>
                </form>
                <p>Pas encore de compte ? <a href="#" id="showRegister">S'inscrire</a></p>
            </div>

            <!-- Formulaire d'inscription -->
            <div id="register-form" style="display: none;">
                <h2>Inscription</h2>
                <form id="registerForm">
                    <input type="text" id="regUsername" placeholder="Nom d'utilisateur" required>
                    <input type="email" id="regEmail" placeholder="Adresse email" required>
                    <input type="password" id="regPassword" placeholder="Mot de passe" required>
                    <input type="password" id="regConfirmPassword" placeholder="Confirmer le mot de passe" required>
                    <button type="submit">S'inscrire</button>
                </form>
                <p>Déjà un compte ? <a href="#" id="showLogin">Se connecter</a></p>
            </div>
        </div>
    </div>
    <script src="js/auth.js"></script>
</body>
</html>
```

### 2. Script d'Authentification (`js/auth.js`)

```javascript
class AuthManager {
    constructor() {
        this.baseURL = '/api';
        this.init();
    }

    init() {
        // Vérifier si déjà connecté
        const token = localStorage.getItem('slither_token');
        if (token) {
            this.validateToken(token);
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('slither_token', data.token);
                localStorage.setItem('slither_user', JSON.stringify(data.user));
                window.location.href = 'customization.html';
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
        }
    }

    async handleRegister() {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (password !== confirmPassword) {
            this.showError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
                this.showLoginForm();
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
        }
    }

    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    }

    showRegisterForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    }

    showError(message) {
        // Implémenter l'affichage des erreurs
        alert(message); // Temporaire, à remplacer par une notification stylée
    }

    showSuccess(message) {
        // Implémenter l'affichage des succès
        alert(message); // Temporaire, à remplacer par une notification stylée
    }

    async validateToken(token) {
        try {
            const response = await fetch(`${this.baseURL}/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                window.location.href = 'customization.html';
            } else {
                localStorage.removeItem('slither_token');
                localStorage.removeItem('slither_user');
            }
        } catch (error) {
            console.error('Erreur de validation du token:', error);
        }
    }
}

// Initialiser le gestionnaire d'authentification
new AuthManager();
```

---

## 🎨 Système de Customisation

### 1. Page de Customisation (`customization.html`)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <title>Slither.io - Customisation</title>
    <link rel="stylesheet" href="css/customization.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div class="customization-container">
        <header>
            <h1>Personnalise ton Serpent</h1>
            <div class="user-info">
                <span id="username"></span>
                <button id="logout">Déconnexion</button>
            </div>
        </header>

        <div class="customization-content">
            <div class="preview-section">
                <canvas id="snake-preview" width="400" height="300"></canvas>
                <h3>Aperçu</h3>
            </div>

            <div class="options-section">
                <!-- Sélection de la tête -->
                <div class="option-group">
                    <h3>Tête du serpent</h3>
                    <div class="texture-grid" id="head-textures">
                        <!-- Généré dynamiquement -->
                    </div>
                </div>

                <!-- Sélection du corps -->
                <div class="option-group">
                    <h3>Corps du serpent</h3>
                    <div class="texture-grid" id="body-textures">
                        <!-- Généré dynamiquement -->
                    </div>
                </div>

                <!-- Sélection des couleurs -->
                <div class="option-group">
                    <h3>Couleurs</h3>
                    <div class="color-picker">
                        <label>Couleur primaire:</label>
                        <input type="color" id="primary-color" value="#FF0000">
                    </div>
                    <div class="color-picker">
                        <label>Couleur secondaire:</label>
                        <input type="color" id="secondary-color" value="#AA0000">
                    </div>
                </div>

                <!-- Motifs -->
                <div class="option-group">
                    <h3>Motifs</h3>
                    <div class="pattern-grid" id="patterns">
                        <!-- Généré dynamiquement -->
                    </div>
                </div>
            </div>
        </div>

        <div class="action-buttons">
            <button id="save-customization">Sauvegarder</button>
            <button id="play-button" class="primary">Jouer</button>
        </div>
    </div>

    <script src="js/customization.js"></script>
</body>
</html>
```

### 2. Script de Customisation (`js/customization.js`)

```javascript
class CustomizationManager {
    constructor() {
        this.baseURL = '/api';
        this.currentCustomization = {
            headTexture: 0,
            bodyTexture: 0,
            primaryColor: '#FF0000',
            secondaryColor: '#AA0000',
            patternType: 0
        };
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupCanvas();
        this.loadCustomizationOptions();
        this.setupEventListeners();
        this.loadUserCustomization();
    }

    checkAuthentication() {
        const token = localStorage.getItem('slither_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const user = JSON.parse(localStorage.getItem('slither_user'));
        document.getElementById('username').textContent = user.username;
    }

    setupCanvas() {
        this.canvas = document.getElementById('snake-preview');
        this.ctx = this.canvas.getContext('2d');
        this.updatePreview();
    }

    loadCustomizationOptions() {
        // Charger les options de têtes (supposons 5 options)
        const headContainer = document.getElementById('head-textures');
        for (let i = 0; i < 5; i++) {
            const option = document.createElement('div');
            option.className = 'texture-option';
            option.dataset.texture = i;
            option.innerHTML = `<img src="images/heads/head_${i}.png" alt="Tête ${i}">`;
            option.addEventListener('click', () => this.selectHeadTexture(i));
            headContainer.appendChild(option);
        }

        // Charger les options de corps
        const bodyContainer = document.getElementById('body-textures');
        for (let i = 0; i < 13; i++) {
            const option = document.createElement('div');
            option.className = 'texture-option';
            option.dataset.texture = i;
            option.innerHTML = `<img src="images/body/${i}.png" alt="Corps ${i}">`;
            option.addEventListener('click', () => this.selectBodyTexture(i));
            bodyContainer.appendChild(option);
        }

        // Charger les motifs
        const patternContainer = document.getElementById('patterns');
        const patterns = ['Uni', 'Rayé', 'Points', 'Zigzag', 'Gradient'];
        patterns.forEach((pattern, index) => {
            const option = document.createElement('div');
            option.className = 'pattern-option';
            option.dataset.pattern = index;
            option.innerHTML = `<div class="pattern-preview pattern-${index}"></div><span>${pattern}</span>`;
            option.addEventListener('click', () => this.selectPattern(index));
            patternContainer.appendChild(option);
        });
    }

    setupEventListeners() {
        document.getElementById('primary-color').addEventListener('change', (e) => {
            this.currentCustomization.primaryColor = e.target.value;
            this.updatePreview();
        });

        document.getElementById('secondary-color').addEventListener('change', (e) => {
            this.currentCustomization.secondaryColor = e.target.value;
            this.updatePreview();
        });

        document.getElementById('save-customization').addEventListener('click', () => {
            this.saveCustomization();
        });

        document.getElementById('play-button').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('logout').addEventListener('click', () => {
            this.logout();
        });
    }

    selectHeadTexture(textureId) {
        this.currentCustomization.headTexture = textureId;
        this.updateSelection('head-textures', textureId);
        this.updatePreview();
    }

    selectBodyTexture(textureId) {
        this.currentCustomization.bodyTexture = textureId;
        this.updateSelection('body-textures', textureId);
        this.updatePreview();
    }

    selectPattern(patternId) {
        this.currentCustomization.patternType = patternId;
        this.updateSelection('patterns', patternId);
        this.updatePreview();
    }

    updateSelection(containerId, selectedId) {
        const container = document.getElementById(containerId);
        container.querySelectorAll('.texture-option, .pattern-option').forEach(option => {
            option.classList.remove('selected');
        });
        container.children[selectedId].classList.add('selected');
    }

    updatePreview() {
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner un serpent d'exemple avec les customisations actuelles
        this.drawSnakePreview();
    }

    drawSnakePreview() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const segmentSize = 30;

        // Dessiner le corps (5 segments)
        for (let i = 4; i >= 1; i--) {
            const x = centerX - i * segmentSize;
            const y = centerY;
            this.drawBodySegment(x, y, segmentSize);
        }

        // Dessiner la tête
        this.drawHead(centerX, centerY, segmentSize);
    }

    drawBodySegment(x, y, size) {
        // Appliquer les couleurs et motifs
        this.ctx.fillStyle = this.currentCustomization.primaryColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Ajouter le motif si nécessaire
        if (this.currentCustomization.patternType > 0) {
            this.applyPattern(x, y, size);
        }
    }

    drawHead(x, y, size) {
        // Dessiner la tête avec la texture sélectionnée
        const headImg = new Image();
        headImg.onload = () => {
            this.ctx.drawImage(headImg, x - size/2, y - size/2, size, size);
        };
        headImg.src = `images/heads/head_${this.currentCustomization.headTexture}.png`;
    }

    applyPattern(x, y, size) {
        this.ctx.fillStyle = this.currentCustomization.secondaryColor;
        
        switch (this.currentCustomization.patternType) {
            case 1: // Rayé
                this.ctx.fillRect(x - size/2, y - 2, size, 4);
                break;
            case 2: // Points
                this.ctx.beginPath();
                this.ctx.arc(x, y, size / 6, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            // Ajouter d'autres motifs...
        }
    }

    async loadUserCustomization() {
        const token = localStorage.getItem('slither_token');
        try {
            const response = await fetch(`${this.baseURL}/customization`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const customization = await response.json();
                this.currentCustomization = { ...customization };
                this.updateUI();
                this.updatePreview();
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la customisation:', error);
        }
    }

    async saveCustomization() {
        const token = localStorage.getItem('slither_token');
        try {
            const response = await fetch(`${this.baseURL}/customization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(this.currentCustomization)
            });

            if (response.ok) {
                this.showSuccess('Customisation sauvegardée !');
            } else {
                this.showError('Erreur lors de la sauvegarde');
            }
        } catch (error) {
            this.showError('Erreur de connexion au serveur');
        }
    }

    updateUI() {
        // Mettre à jour les sélections visuelles
        this.updateSelection('head-textures', this.currentCustomization.headTexture);
        this.updateSelection('body-textures', this.currentCustomization.bodyTexture);
        this.updateSelection('patterns', this.currentCustomization.patternType);
        
        // Mettre à jour les couleurs
        document.getElementById('primary-color').value = this.currentCustomization.primaryColor;
        document.getElementById('secondary-color').value = this.currentCustomization.secondaryColor;
    }

    logout() {
        localStorage.removeItem('slither_token');
        localStorage.removeItem('slither_user');
        window.location.href = 'login.html';
    }

    showSuccess(message) {
        // À implémenter : notification stylée
        alert(message);
    }

    showError(message) {
        // À implémenter : notification stylée
        alert(message);
    }
}

// Initialiser le gestionnaire de customisation
new CustomizationManager();
```

---

## 🎮 Système Multijoueur - Architecture WebSocket

### 1. Client WebSocket (`js/socket-client.js`)

```javascript
class GameClient {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.players = new Map();
        this.gameState = {
            mapBounds: { width: 0, height: 0 },
            playerCount: 0
        };
        this.init();
    }

    init() {
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        // Connexion WebSocket avec le token d'authentification
        const token = localStorage.getItem('slither_token');
        const customization = JSON.parse(localStorage.getItem('slither_customization') || '{}');
        
        this.socket = io('/', {
            auth: {
                token: token,
                customization: customization
            }
        });

        this.socket.on('connect', () => {
            console.log('Connecté au serveur de jeu');
        });

        this.socket.on('gameInit', (data) => {
            this.playerId = data.playerId;
            this.gameState = data.gameState;
            this.initGame();
        });

        this.socket.on('playerJoined', (playerData) => {
            this.players.set(playerData.id, playerData);
            this.updateMapSize();
        });

        this.socket.on('playerLeft', (playerId) => {
            this.players.delete(playerId);
            this.updateMapSize();
        });

        this.socket.on('gameUpdate', (gameData) => {
            this.handleGameUpdate(gameData);
        });

        this.socket.on('playerDied', (data) => {
            this.handlePlayerDeath(data);
        });

        this.socket.on('mapBoundsUpdate', (bounds) => {
            this.gameState.mapBounds = bounds;
            this.updateMapBoundaries();
        });

        this.socket.on('disconnect', () => {
            console.log('Déconnecté du serveur de jeu');
        });
    }

    setupEventListeners() {
        // Écouter les mouvements de la souris
        document.addEventListener('mousemove', (e) => {
            const direction = this.calculateDirection(e.clientX, e.clientY);
            this.sendPlayerMove(direction);
        });

        // Écouter l'accélération
        document.addEventListener('mousedown', () => {
            this.sendPlayerBoost(true);
        });

        document.addEventListener('mouseup', () => {
            this.sendPlayerBoost(false);
        });
    }

    sendPlayerMove(direction) {
        if (this.socket) {
            this.socket.emit('playerMove', {
                direction: direction,
                timestamp: Date.now()
            });
        }
    }

    sendPlayerBoost(boosting) {
        if (this.socket) {
            this.socket.emit('playerBoost', {
                boosting: boosting,
                timestamp: Date.now()
            });
        }
    }

    calculateDirection(mouseX, mouseY) {
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const dx = mouseX - rect.left - centerX;
        const dy = mouseY - rect.top - centerY;
        
        return {
            x: dx / 15, // Normaliser comme dans le code original
            y: dy / 15
        };
    }

    handleGameUpdate(gameData) {
        // Mettre à jour les positions des joueurs
        gameData.players.forEach(playerData => {
            this.players.set(playerData.id, playerData);
        });

        // Mettre à jour la nourriture
        if (gameData.food) {
            window.FOOD = gameData.food;
        }

        // Redessiner le jeu
        this.updateGameDisplay();
    }

    handlePlayerDeath(data) {
        if (data.playerId === this.playerId) {
            // Le joueur est mort
            this.showGameOver(data.finalScore);
        } else {
            // Un autre joueur est mort, créer de la nourriture
            this.createFoodFromPlayer(data);
        }
    }

    updateMapSize() {
        const playerCount = this.players.size;
        // Calculer la taille de la carte basée sur le nombre de joueurs
        const baseSize = 1000;
        const newSize = baseSize + (playerCount * 200);
        
        this.gameState.mapBounds.width = newSize;
        this.gameState.mapBounds.height = newSize;
        
        // Envoyer au serveur pour synchroniser
        this.socket.emit('updateMapBounds', this.gameState.mapBounds);
    }

    updateMapBoundaries() {
        // Cette méthode sera appelée par le game.js modifié
        // pour dessiner les bordures rouges
        if (window.game && window.game.drawMapBounds) {
            window.game.drawMapBounds(this.gameState.mapBounds);
        }
    }

    showGameOver(score) {
        alert(`Game Over! Votre score: ${score}`);
        // Rediriger vers le menu ou proposer de rejouer
        window.location.href = 'customization.html';
    }

    createFoodFromPlayer(deathData) {
        // Logique pour créer de la nourriture à partir d'un joueur mort
        // Sera intégrée avec le système de nourriture existant
    }

    updateGameDisplay() {
        // Cette méthode sera intégrée avec le système de rendu existant
        // pour afficher tous les joueurs connectés
    }
}

// Initialiser le client de jeu
let gameClient;
document.addEventListener('DOMContentLoaded', () => {
    gameClient = new GameClient();
});
```

### 2. Serveur de Jeu (`server/socket/game-server.js`)

```javascript
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

class GameServer {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.players = new Map();
        this.food = [];
        this.gameState = {
            mapBounds: { width: 1000, height: 1000 },
            maxPlayers: 50
        };
        
        this.init();
    }

    init() {
        this.setupSocketHandlers();
        this.generateInitialFood();
        this.startGameLoop();
    }

    setupSocketHandlers() {
        this.io.use((socket, next) => {
            // Middleware d'authentification
            const token = socket.handshake.auth.token;
            
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.username = decoded.username;
                socket.customization = socket.handshake.auth.customization;
                next();
            } catch (error) {
                next(new Error('Authentication failed'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`Joueur connecté: ${socket.username}`);
            
            // Ajouter le joueur à la partie
            this.addPlayer(socket);
            
            // Gérer les mouvements du joueur
            socket.on('playerMove', (data) => {
                this.handlePlayerMove(socket.id, data);
            });

            socket.on('playerBoost', (data) => {
                this.handlePlayerBoost(socket.id, data);
            });

            socket.on('updateMapBounds', (bounds) => {
                this.updateMapBounds();
            });

            socket.on('disconnect', () => {
                this.removePlayer(socket.id);
                console.log(`Joueur déconnecté: ${socket.username}`);
            });
        });
    }

    addPlayer(socket) {
        // Créer un nouveau joueur
        const player = {
            id: socket.id,
            userId: socket.userId,
            username: socket.username,
            customization: socket.customization,
            position: this.getRandomSpawnPosition(),
            segments: [],
            direction: { x: 0, y: 0 },
            score: 200,
            size: 20,
            boosting: false,
            alive: true
        };

        // Initialiser les segments du serpent
        for (let i = 0; i < 5; i++) {
            player.segments.push({
                x: player.position.x - i * 10,
                y: player.position.y
            });
        }

        this.players.set(socket.id, player);
        this.updateMapBounds();

        // Envoyer les données initiales au joueur
        socket.emit('gameInit', {
            playerId: socket.id,
            gameState: this.gameState,
            players: Array.from(this.players.values()),
            food: this.food
        });

        // Notifier les autres joueurs
        socket.broadcast.emit('playerJoined', player);
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            // Convertir le joueur en nourriture
            this.createFoodFromPlayer(player);
            
            // Supprimer le joueur
            this.players.delete(socketId);
            this.updateMapBounds();
            
            // Notifier les autres joueurs
            this.io.emit('playerLeft', socketId);
        }
    }

    handlePlayerMove(socketId, data) {
        const player = this.players.get(socketId);
        if (player && player.alive) {
            player.direction = data.direction;
            
            // Normaliser la direction
            const magnitude = Math.sqrt(player.direction.x ** 2 + player.direction.y ** 2);
            if (magnitude > 0) {
                const maxSpeed = 5;
                if (magnitude > maxSpeed) {
                    player.direction.x = (player.direction.x / magnitude) * maxSpeed;
                    player.direction.y = (player.direction.y / magnitude) * maxSpeed;
                }
            }
        }
    }

    handlePlayerBoost(socketId, data) {
        const player = this.players.get(socketId);
        if (player && player.alive) {
            player.boosting = data.boosting;
        }
    }

    updateMapBounds() {
        const playerCount = this.players.size;
        const baseSize = 1000;
        const newSize = Math.max(baseSize, baseSize + (playerCount * 100));
        
        this.gameState.mapBounds.width = newSize;
        this.gameState.mapBounds.height = newSize;
        
        // Notifier tous les joueurs
        this.io.emit('mapBoundsUpdate', this.gameState.mapBounds);
    }

    startGameLoop() {
        setInterval(() => {
            this.updateGame();
            this.sendGameUpdate();
        }, 1000 / 30); // 30 FPS
    }

    updateGame() {
        // Mettre à jour chaque joueur
        for (let [socketId, player] of this.players) {
            if (!player.alive) continue;

            // Mettre à jour la position
            const speed = player.boosting ? 2 : 1;
            player.position.x += player.direction.x * speed;
            player.position.y += player.direction.y * speed;

            // Vérifier les limites de la carte
            if (this.isOutOfBounds(player.position)) {
                this.killPlayer(socketId);
                continue;
            }

            // Mettre à jour les segments
            this.updatePlayerSegments(player);

            // Vérifier les collisions avec la nourriture
            this.checkFoodCollision(player);

            // Vérifier les collisions avec d'autres joueurs
            this.checkPlayerCollisions(socketId, player);

            // Pénalité de boost
            if (player.boosting && player.score > 200) {
                player.score -= player.score / 2000;
            }

            // Mettre à jour la taille
            this.updatePlayerSize(player);
        }

        // Régénérer la nourriture si nécessaire
        this.maintainFoodLevel();
    }

    updatePlayerSegments(player) {
        // Déplacer les segments pour suivre la tête
        if (player.segments.length > 0) {
            player.segments[0] = { ...player.position };

            for (let i = 1; i < player.segments.length; i++) {
                const distance = this.getDistance(player.segments[i], player.segments[i - 1]);
                if (distance > player.size / 5) {
                    player.segments[i] = {
                        x: (player.segments[i].x + player.segments[i - 1].x) / 2,
                        y: (player.segments[i].y + player.segments[i - 1].y) / 2
                    };
                }
            }
        }

        // Ajuster la longueur basée sur le score
        const targetLength = Math.floor(player.score / 100);
        while (player.segments.length < targetLength) {
            const lastSegment = player.segments[player.segments.length - 1];
            player.segments.push({ ...lastSegment });
        }
        while (player.segments.length > targetLength && player.segments.length > 5) {
            player.segments.pop();
        }
    }

    updatePlayerSize(player) {
        const baseSize = 20;
        const sizeMultiplier = Math.pow(player.score / 1000, 1/5);
        player.size = baseSize * sizeMultiplier;
    }

    isOutOfBounds(position) {
        const bounds = this.gameState.mapBounds;
        return position.x < -bounds.width/2 || 
               position.x > bounds.width/2 || 
               position.y < -bounds.height/2 || 
               position.y > bounds.height/2;
    }

    checkFoodCollision(player) {
        for (let i = this.food.length - 1; i >= 0; i--) {
            const foodItem = this.food[i];
            const distance = this.getDistance(player.position, foodItem);
            
            if (distance < player.size / 2 + foodItem.size / 2) {
                player.score += foodItem.value;
                
                // Supprimer la nourriture et en créer une nouvelle
                this.food.splice(i, 1);
                this.createRandomFood();
            }
        }
    }

    checkPlayerCollisions(currentSocketId, currentPlayer) {
        for (let [socketId, otherPlayer] of this.players) {
            if (socketId === currentSocketId || !otherPlayer.alive) continue;

            // Vérifier collision avec la tête de l'autre joueur
            const headDistance = this.getDistance(currentPlayer.position, otherPlayer.position);
            if (headDistance < (currentPlayer.size + otherPlayer.size) / 2) {
                this.killPlayer(currentSocketId);
                return;
            }

            // Vérifier collision avec les segments de l'autre joueur
            for (let segment of otherPlayer.segments) {
                const segmentDistance = this.getDistance(currentPlayer.position, segment);
                if (segmentDistance < currentPlayer.size / 2 + otherPlayer.size / 2) {
                    this.killPlayer(currentSocketId);
                    return;
                }
            }
        }
    }

    killPlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            player.alive = false;
            
            // Créer de la nourriture à partir du joueur
            this.createFoodFromPlayer(player);
            
            // Notifier le joueur de sa mort
            this.io.to(socketId).emit('playerDied', {
                playerId: socketId,
                finalScore: Math.floor(player.score)
            });
            
            // Supprimer le joueur après un délai
            setTimeout(() => {
                this.players.delete(socketId);
                this.updateMapBounds();
                this.io.emit('playerLeft', socketId);
            }, 1000);
        }
    }

    createFoodFromPlayer(player) {
        // Créer de la nourriture à partir des segments du joueur
        for (let i = 0; i < player.segments.length; i += 5) {
            const segment = player.segments[i];
            this.food.push({
                x: segment.x + (Math.random() - 0.5) * 50,
                y: segment.y + (Math.random() - 0.5) * 50,
                size: Math.random() * 10 + 5,
                value: player.score / (player.segments.length / 5) * 0.4,
                color: this.getRandomColor()
            });
        }
    }

    generateInitialFood() {
        const foodCount = 2000;
        for (let i = 0; i < foodCount; i++) {
            this.createRandomFood();
        }
    }

    createRandomFood() {
        const bounds = this.gameState.mapBounds;
        this.food.push({
            x: (Math.random() - 0.5) * bounds.width,
            y: (Math.random() - 0.5) * bounds.height,
            size: Math.random() * 8 + 3,
            value: Math.random() * 10 + 5,
            color: this.getRandomColor()
        });
    }

    maintainFoodLevel() {
        const targetFoodCount = Math.max(1000, this.players.size * 100);
        while (this.food.length < targetFoodCount) {
            this.createRandomFood();
        }
    }

    getRandomSpawnPosition() {
        const bounds = this.gameState.mapBounds;
        return {
            x: (Math.random() - 0.5) * bounds.width * 0.8, // Spawn un peu loin des bords
            y: (Math.random() - 0.5) * bounds.height * 0.8
        };
    }

    getRandomColor() {
        const colors = ["#FF0000", "#FFFF00", "#00FF00", "#FF00FF", "#FFFFFF", "#00FFFF", "#7FFF00", "#FFCC00"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getDistance(pos1, pos2) {
        return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
    }

    sendGameUpdate() {
        const gameData = {
            players: Array.from(this.players.values()).filter(p => p.alive),
            food: this.food,
            timestamp: Date.now()
        };

        this.io.emit('gameUpdate', gameData);
    }
}

module.exports = GameServer;
```

---

## 🔧 Modifications du Code Existant

### 1. Modifications de `game.js`

```javascript
// Ajouts/modifications dans la classe game

class game {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.isMultiplayer = true; // NOUVEAU
        this.mapBounds = { width: 1000, height: 1000 }; // NOUVEAU
        this.init();
    }

    init() {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.render();

        // MODIFIÉ: Ne pas créer de serpents IA ni de nourriture
        // Le serveur s'en charge maintenant
        if (!this.isMultiplayer) {
            // Code original pour le mode hors ligne (optionnel)
        }

        this.loop();
        this.listenMouse();
        this.listenTouch();
    }

    // NOUVELLE méthode pour dessiner les limites de la carte
    drawMapBounds(bounds) {
        this.mapBounds = bounds;
        
        const ctx = this.context;
        ctx.strokeStyle = '#FF0000'; // Rouge épais
        ctx.lineWidth = 10;
        
        // Calculer les positions des bordures à l'écran
        const leftBound = -bounds.width/2 - XX + game_W/2;
        const rightBound = bounds.width/2 - XX + game_W/2;
        const topBound = -bounds.height/2 - YY + game_H/2;
        const bottomBound = bounds.height/2 - YY + game_H/2;
        
        // Dessiner les bordures uniquement si elles sont visibles
        ctx.beginPath();
        
        // Bordure gauche
        if (leftBound > 0 && leftBound < game_W) {
            ctx.moveTo(leftBound, 0);
            ctx.lineTo(leftBound, game_H);
        }
        
        // Bordure droite
        if (rightBound > 0 && rightBound < game_W) {
            ctx.moveTo(rightBound, 0);
            ctx.lineTo(rightBound, game_H);
        }
        
        // Bordure haute
        if (topBound > 0 && topBound < game_H) {
            ctx.moveTo(0, topBound);
            ctx.lineTo(game_W, topBound);
        }
        
        // Bordure basse
        if (bottomBound > 0 && bottomBound < game_H) {
            ctx.moveTo(0, bottomBound);
            ctx.lineTo(game_W, bottomBound);
        }
        
        ctx.stroke();
    }

    // MODIFIÉE: Supprimer la gestion des bots
    changeSnake() {
        // Cette méthode sera gérée par le serveur WebSocket
        // ou supprimée complètement en mode multijoueur
    }

    // MODIFIÉE: Intégrer avec le système multijoueur
    draw() {
        this.clearScreen();
        
        // Dessiner les limites de la carte
        if (this.mapBounds) {
            this.drawMapBounds(this.mapBounds);
        }
        
        // Dessiner la nourriture (reçue du serveur)
        for (let i = 0; i < FOOD.length; i++)
            FOOD[i].draw();
            
        // Dessiner tous les serpents (reçus du serveur)
        if (gameClient && gameClient.players) {
            for (let [playerId, player] of gameClient.players) {
                this.drawPlayer(player);
            }
        }
        
        this.drawScore();
    }

    // NOUVELLE méthode pour dessiner un joueur
    drawPlayer(player) {
        // Dessiner les segments du corps
        for (let i = player.segments.length - 1; i >= 1; i--) {
            const segment = player.segments[i];
            if (this.isPoint(segment.x, segment.y)) {
                // Utiliser la customisation du joueur
                const bodyImg = new Image();
                bodyImg.src = `images/body/${player.customization.bodyTexture || 0}.png`;
                this.context.drawImage(bodyImg, 
                    segment.x - XX - player.size / 2, 
                    segment.y - YY - player.size / 2, 
                    player.size, 
                    player.size
                );
            }
        }

        // Dessiner la tête avec rotation
        if (player.segments.length > 0) {
            const head = player.segments[0];
            const angle = this.getAngle(player.direction.x, player.direction.y);
            
            this.context.save();
            this.context.translate(head.x - XX, head.y - YY);
            this.context.rotate(angle - Math.PI / 2);
            
            const headImg = new Image();
            headImg.src = `images/heads/head_${player.customization.headTexture || 0}.png`;
            this.context.drawImage(headImg, -player.size / 2, -player.size / 2, player.size, player.size);
            
            this.context.restore();
        }
    }

    getAngle(x, y) {
        return Math.atan2(y, x);
    }
}
```

---

## 🚀 Déploiement sur Vercel

### 1. Configuration Vercel (`vercel.json`)

```json
{
    "version": 2,
    "builds": [
        {
            "src": "server/server.js",
            "use": "@vercel/node"
        },
        {
            "src": "client/**/*",
            "use": "@vercel/static"
        }
    ],
    "routes": [
        {
            "src": "/api/(.*)",
            "dest": "server/server.js"
        },
        {
            "src": "/socket.io/(.*)",
            "dest": "server/server.js"
        },
        {
            "src": "/(.*)",
            "dest": "client/$1"
        }
    ],
    "env": {
        "DATABASE_URL": "@database-url",
        "JWT_SECRET": "@jwt-secret",
        "EMAIL_API_KEY": "@email-api-key"
    }
}
```

### 2. Package.json

```json
{
    "name": "slither-multiplayer",
    "version": "1.0.0",
    "description": "Slither.io multijoueur avec authentification",
    "main": "server/server.js",
    "scripts": {
        "start": "node server/server.js",
        "dev": "nodemon server/server.js",
        "build": "echo 'Building client assets...'",
        "deploy": "vercel --prod"
    },
    "dependencies": {
        "express": "^4.18.0",
        "socket.io": "^4.7.0",
        "jsonwebtoken": "^9.0.0",
        "bcryptjs": "^2.4.3",
        "pg": "^8.11.0",
        "nodemailer": "^6.9.0",
        "cors": "^2.8.5",
        "helmet": "^7.0.0",
        "express-rate-limit": "^6.8.0",
        "joi": "^17.9.0"
    },
    "devDependencies": {
        "nodemon": "^3.0.0"
    },
    "engines": {
        "node": ">=18.0.0"
    }
}
```

### 3. Variables d'Environnement Vercel

```bash
# À configurer dans le dashboard Vercel
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
EMAIL_API_KEY=your-sendgrid-or-smtp-key
NODE_ENV=production
```

---

## 📋 Plan d'Implémentation Étapes par Étapes

### Phase 1: Infrastructure Backend (Semaines 1-2)

1. **Initialiser le projet Node.js**
2. **Configurer la base de données PostgreSQL**
3. **Implémenter l'authentification (JWT + bcrypt)**
4. **Créer les API REST pour utilisateurs et customisation**
5. **Tester les endpoints avec Postman/Thunder Client**

### Phase 2: Interface d'Authentification (Semaine 3)

1. **Créer la page de connexion/inscription**
2. **Implémenter le système d'email de confirmation**
3. **Ajouter la validation côté client**
4. **Tester le flux complet d'inscription**

### Phase 3: Système de Customisation (Semaine 4)

1. **Créer la page de customisation**
2. **Implémenter l'aperçu en temps réel**
3. **Connecter avec l'API de sauvegarde**
4. **Créer les nouvelles textures/options**

### Phase 4: Multijoueur WebSocket (Semaines 5-6)

1. **Configurer Socket.io serveur et client**
2. **Implémenter la synchronisation des joueurs**
3. **Modifier le moteur de jeu existant**
4. **Ajouter les limites de carte dynamiques**

### Phase 5: Intégration et Tests (Semaine 7)

1. **Supprimer complètement les bots**
2. **Optimiser les performances**
3. **Tests de charge avec plusieurs joueurs**
4. **Corrections de bugs**

### Phase 6: Déploiement Production (Semaine 8)

1. **Configuration Vercel complète**
2. **Tests en production**
3. **Documentation finale**
4. **Formation utilisateur**

---

## 🔍 Points d'Attention Critiques

### Sécurité

- **Validation côté serveur** : Toujours valider les données reçues
- **Rate limiting** : Limiter les requêtes par IP/utilisateur
- **Sanitisation** : Nettoyer les inputs utilisateur
- **HTTPS obligatoire** : Certificat SSL/TLS

### Performance

- **Optimisation WebSocket** : Limiter la fréquence des mises à jour
- **Base de données** : Index appropriés, requêtes optimisées
- **Cache** : Mise en cache des données statiques
- **CDN** : Utiliser Vercel Edge Network

### Évolutivité

- **Architecture modulaire** : Code réutilisable et maintenable
- **Tests unitaires** : Couverture de code minimale 80%
- **Documentation** : Commentaires et documentation API
- **Monitoring** : Logs et métriques de performance

---

## 📚 Ressources et Dépendances

### Documentation Technique

- [Socket.io Documentation](https://socket.io/docs/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

### Outils de Développement

- **VS Code Extensions** : REST Client, PostgreSQL, Socket.io
- **Base de données** : pgAdmin ou TablePlus
- **Testing** : Postman pour API, Artillery pour load testing
- **Monitoring** : Vercel Analytics, Sentry pour error tracking

---

## ✅ Checklist de Validation

### Fonctionnalités Core

- [ ] Authentification utilisateur fonctionnelle
- [ ] Customisation sauvegardée et chargée
- [ ] Multijoueur en temps réel stable
- [ ] Limites de carte adaptatives
- [ ] Suppression complète des bots

### Tests de Qualité

- [ ] 10+ joueurs simultanés sans lag
- [ ] Connexion/déconnexion gracieuse
- [ ] Récupération après perte de connexion
- [ ] Validation de tous les formulaires
- [ ] Sécurité des API testée

### Production Ready

- [ ] Variables d'environnement configurées
- [ ] Base de données de production
- [ ] Monitoring et logging
- [ ] Documentation utilisateur
- [ ] Plan de sauvegarde/récupération

---

Ce guide complet fournit une roadmap détaillée pour transformer votre jeu Slither.io en une expérience multijoueur moderne et sécurisée. Chaque étape est documentée avec le code nécessaire et les meilleures pratiques de l'industrie.
