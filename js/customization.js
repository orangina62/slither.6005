/**
 * Gestionnaire de la page de customisation
 * Permet de personnaliser l'apparence du serpent avec aperçu en temps réel
 */
class CustomizationManager {
    constructor() {
        this.canvas = document.getElementById('snake-preview');
        this.ctx = this.canvas.getContext('2d');
        this.currentCustomization = {
            bodyTexture: 0,
            primaryColor: '#4CAF50',
            secondaryColor: '#45a049'
        };
        this.textureImages = [];
        this.isLoadingTextures = true;
        
        this.init();
    }

    async init() {
        // Vérifier l'authentification
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Afficher le nom d'utilisateur
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('username').textContent = username;
        }

        // Charger les textures
        await this.loadTextures();
        
        // Charger la customisation actuelle de l'utilisateur
        await this.loadUserCustomization();

        // Initialiser les event listeners
        this.initEventListeners();

        // Dessiner l'aperçu initial
        this.drawPreview();
        
        // Animation de l'aperçu
        this.startPreviewAnimation();
    }

    async loadTextures() {
        const textureCount = 13; // 0.png à 12.png
        const loadPromises = [];

        for (let i = 0; i < textureCount; i++) {
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.textureImages[i] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Texture ${i} non trouvée, utilisation d'une couleur par défaut`);
                    this.textureImages[i] = null;
                    resolve();
                };
                img.src = `images/body/${i}.png`;
            });
            loadPromises.push(promise);
        }

        await Promise.all(loadPromises);
        this.isLoadingTextures = false;
    }

    async loadUserCustomization() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/user/customization', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.customization) {
                    this.currentCustomization = {
                        bodyTexture: data.customization.body_texture || 0,
                        primaryColor: data.customization.primary_color || '#4CAF50',
                        secondaryColor: data.customization.secondary_color || '#45a049'
                    };
                    this.updateUIFromCustomization();
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la customisation:', error);
        }
    }

    updateUIFromCustomization() {
        // Sélectionner la texture active
        const textureOptions = document.querySelectorAll('.texture-option');
        textureOptions.forEach((option, index) => {
            if (index === this.currentCustomization.bodyTexture) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        // Mettre à jour les color pickers
        document.getElementById('primaryColor').value = this.currentCustomization.primaryColor;
        document.getElementById('secondaryColor').value = this.currentCustomization.secondaryColor;
    }

    initEventListeners() {
        // Texture selection
        const textureOptions = document.querySelectorAll('.texture-option');
        textureOptions.forEach((option, index) => {
            option.addEventListener('click', () => {
                this.selectTexture(index);
            });
        });

        // Color pickers
        document.getElementById('primaryColor').addEventListener('input', (e) => {
            this.currentCustomization.primaryColor = e.target.value;
            this.drawPreview();
        });

        document.getElementById('secondaryColor').addEventListener('input', (e) => {
            this.currentCustomization.secondaryColor = e.target.value;
            this.drawPreview();
        });

        // Boutons d'action
        document.getElementById('saveCustomization').addEventListener('click', () => {
            this.saveCustomization();
        });

        document.getElementById('playGame').addEventListener('click', () => {
            this.saveAndPlay();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    selectTexture(index) {
        this.currentCustomization.bodyTexture = index;
        
        // Mettre à jour l'UI
        const textureOptions = document.querySelectorAll('.texture-option');
        textureOptions.forEach((option, i) => {
            if (i === index) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        this.drawPreview();
    }

    startPreviewAnimation() {
        let offset = 0;
        const animate = () => {
            offset += 0.5;
            this.drawPreview(offset);
            requestAnimationFrame(animate);
        };
        animate();
    }

    drawPreview(animationOffset = 0) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Nettoyer le canvas
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, width, height);

        // Dessiner un serpent serpentant
        const segmentSize = 15;
        const segments = 20;
        const centerY = height / 2;
        const spacing = 18;

        for (let i = 0; i < segments; i++) {
            const x = width / 2 - (segments * spacing) / 2 + i * spacing + animationOffset;
            const y = centerY + Math.sin((i + animationOffset) * 0.3) * 40;
            
            // Dessiner le segment
            this.drawSegment(ctx, x % (width + spacing * 2) - spacing, y, segmentSize, i === 0);
        }
    }

    drawSegment(ctx, x, y, size, isHead) {
        const texture = this.textureImages[this.currentCustomization.bodyTexture];

        if (isHead) {
            // Dessiner la tête avec l'image spéciale
            const headImg = new Image();
            headImg.src = 'images/head.png';
            ctx.save();
            ctx.translate(x, y);
            ctx.drawImage(headImg, -size, -size, size * 2, size * 2);
            ctx.restore();
        } else {
            // Dessiner le corps
            if (texture && !this.isLoadingTextures) {
                // Utiliser la texture
                ctx.save();
                ctx.translate(x, y);
                ctx.drawImage(texture, -size, -size, size * 2, size * 2);
                ctx.restore();
            } else {
                // Utiliser les couleurs
                ctx.save();
                ctx.translate(x, y);
                
                // Cercle extérieur (couleur primaire)
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fillStyle = this.currentCustomization.primaryColor;
                ctx.fill();
                
                // Cercle intérieur (couleur secondaire)
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = this.currentCustomization.secondaryColor;
                ctx.fill();
                
                ctx.restore();
            }
        }
    }

    async saveCustomization() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/user/customization', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bodyTexture: this.currentCustomization.bodyTexture,
                    primaryColor: this.currentCustomization.primaryColor,
                    secondaryColor: this.currentCustomization.secondaryColor
                })
            });

            if (response.ok) {
                this.showNotification('Customisation sauvegardée !', 'success');
            } else {
                const data = await response.json();
                this.showNotification(data.message || 'Erreur lors de la sauvegarde', 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur de connexion au serveur', 'error');
        }
    }

    async saveAndPlay() {
        await this.saveCustomization();
        
        // Sauvegarder la customisation dans localStorage pour le jeu
        localStorage.setItem('snakeCustomization', JSON.stringify(this.currentCustomization));
        
        // Rediriger vers le jeu
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('snakeCustomization');
        window.location.href = 'login.html';
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialiser la page quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new CustomizationManager();
});
