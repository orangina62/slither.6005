/**
 * Gestionnaire de l'écran Game Over
 * Affiche les statistiques de la partie avec conversion en mètres
 * 1 point de score = 0.01 mètre
 */
class GameOverManager {
    constructor() {
        this.gameStats = null;
        this.countdownTimer = null;
        this.countdownSeconds = 5;
        
        this.init();
    }

    async init() {
        // Récupérer les statistiques de la partie depuis localStorage
        this.loadGameStats();
        
        // Afficher les statistiques
        this.displayStats();
        
        // Afficher le message personnel
        this.displayPersonalMessage();
        
        // Charger le top 5
        await this.loadTopPlayers();
        
        // Sauvegarder les stats sur le serveur
        await this.saveStatsToServer();
        
        // Initialiser les événements
        this.initEventListeners();
        
        // Démarrer le compte à rebours
        this.startCountdown();
    }

    loadGameStats() {
        // Récupérer depuis localStorage (sera passé depuis game.js)
        const statsJson = localStorage.getItem('lastGameStats');
        
        if (statsJson) {
            this.gameStats = JSON.parse(statsJson);
        } else {
            // Stats par défaut pour le test
            this.gameStats = {
                score: 0,
                maxLength: 3,
                kills: 0,
                survivalTime: 0,
                ranking: 0,
                totalPlayers: 0
            };
        }
    }

    displayStats() {
        // Score final
        this.animateNumber('finalScore', 0, this.gameStats.score, 1500);
        
        // Taille en mètres (1 score = 0.01m)
        const sizeInMeters = this.gameStats.score * 0.01;
        this.animateNumber('sizeMeters', 0, sizeInMeters, 2000, true);
        
        // Temps de survie (en secondes -> format MM:SS)
        const survivalTime = this.formatTime(this.gameStats.survivalTime);
        document.getElementById('survivalTime').textContent = survivalTime;
        
        // Kills
        this.animateNumber('kills', 0, this.gameStats.kills, 1000);
        
        // Classement
        if (this.gameStats.ranking > 0) {
            const rankingText = `${this.gameStats.ranking}/${this.gameStats.totalPlayers}`;
            document.getElementById('ranking').textContent = rankingText;
        } else {
            document.getElementById('ranking').textContent = '-';
        }
        
        // Longueur maximale
        this.animateNumber('maxLength', 0, this.gameStats.maxLength, 1200);
    }

    animateNumber(elementId, start, end, duration, isDecimal = false) {
        const element = document.getElementById(elementId);
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const current = start + (end - start) * easeProgress;
            
            if (isDecimal) {
                element.textContent = current.toFixed(2);
            } else {
                element.textContent = Math.floor(current);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    displayPersonalMessage() {
        const messageElement = document.getElementById('personalMessage');
        const score = this.gameStats.score;
        const sizeInMeters = score * 0.01;
        const kills = this.gameStats.kills;
        
        let message = '';
        
        // Messages basés sur la taille
        if (sizeInMeters >= 100) {
            message = `🏆 Incroyable ! Vous avez atteint ${sizeInMeters.toFixed(2)}m ! Vous êtes un champion !`;
        } else if (sizeInMeters >= 50) {
            message = `🌟 Excellent ! ${sizeInMeters.toFixed(2)}m, c'est impressionnant !`;
        } else if (sizeInMeters >= 20) {
            message = `👍 Bien joué ! ${sizeInMeters.toFixed(2)}m, vous progressez !`;
        } else if (sizeInMeters >= 10) {
            message = `💪 Pas mal ! ${sizeInMeters.toFixed(2)}m, continuez comme ça !`;
        } else if (sizeInMeters >= 5) {
            message = `🎯 Bon début ! ${sizeInMeters.toFixed(2)}m, vous apprenez vite !`;
        } else {
            message = `🌱 Chaque début est difficile ! ${sizeInMeters.toFixed(2)}m, la prochaine fois sera meilleure !`;
        }
        
        // Ajouter un commentaire sur les kills
        if (kills >= 10) {
            message += ` Et ${kills} éliminations, vous êtes redoutable ! 💀`;
        } else if (kills >= 5) {
            message += ` Avec ${kills} éliminations, c'est solide ! ⚔️`;
        } else if (kills > 0) {
            message += ` ${kills} élimination${kills > 1 ? 's' : ''} au compteur ! 🎯`;
        }
        
        messageElement.textContent = message;
    }

    async loadTopPlayers() {
        const topPlayersContainer = document.getElementById('topPlayers');
        
        try {
            const token = localStorage.getItem('authToken');
            
            // Récupérer le top 5 de la dernière session
            const response = await fetch('/api/game/leaderboard?limit=5', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.renderTopPlayers(data.leaderboard || []);
            } else {
                this.renderTopPlayers([]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du leaderboard:', error);
            this.renderTopPlayers([]);
        }
    }

    renderTopPlayers(players) {
        const topPlayersContainer = document.getElementById('topPlayers');
        
        if (players.length === 0) {
            topPlayersContainer.innerHTML = '<p style="text-align: center; color: #999;">Aucune donnée disponible</p>';
            return;
        }
        
        topPlayersContainer.innerHTML = '';
        
        players.forEach((player, index) => {
            const sizeInMeters = (player.score * 0.01).toFixed(2);
            let rankClass = '';
            
            if (index === 0) rankClass = 'gold';
            else if (index === 1) rankClass = 'silver';
            else if (index === 2) rankClass = 'bronze';
            
            const playerEntry = document.createElement('div');
            playerEntry.className = 'player-entry';
            playerEntry.innerHTML = `
                <div class="player-rank ${rankClass}">#${index + 1}</div>
                <div class="player-name">${this.escapeHtml(player.username)}</div>
                <div class="player-score">${player.score}</div>
                <div class="player-size">(${sizeInMeters}m)</div>
            `;
            
            topPlayersContainer.appendChild(playerEntry);
        });
    }

    async saveStatsToServer() {
        try {
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.log('Pas de token, stats non sauvegardées');
                return;
            }
            
            const response = await fetch('/api/game/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    score: this.gameStats.score,
                    maxLength: this.gameStats.maxLength,
                    kills: this.gameStats.kills,
                    survivalTime: this.gameStats.survivalTime,
                    rank: this.gameStats.ranking
                })
            });
            
            if (response.ok) {
                console.log('Statistiques sauvegardées avec succès');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des stats:', error);
        }
    }

    initEventListeners() {
        // Bouton Rejouer
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.playAgain();
        });
        
        // Bouton Personnaliser
        document.getElementById('customizeBtn').addEventListener('click', () => {
            window.location.href = 'customization.html';
        });
        
        // Bouton Statistiques
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.showStats();
        });
        
        // Raccourci clavier : Espace pour rejouer
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.playAgain();
            }
        });
    }

    startCountdown() {
        const countdownElement = document.getElementById('countdown');
        
        this.countdownTimer = setInterval(() => {
            this.countdownSeconds--;
            
            if (this.countdownSeconds > 0) {
                countdownElement.textContent = `(${this.countdownSeconds})`;
            } else {
                clearInterval(this.countdownTimer);
                countdownElement.textContent = '';
                // Auto-rejouer après 5 secondes (optionnel)
                // this.playAgain();
            }
        }, 1000);
    }

    playAgain() {
        // Nettoyer les stats de la dernière partie
        localStorage.removeItem('lastGameStats');
        
        // Rediriger vers le jeu
        window.location.href = 'index.html';
    }

    showStats() {
        // TODO: Créer une page de statistiques complètes
        alert('Page de statistiques complètes en cours de développement');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new GameOverManager();
});
