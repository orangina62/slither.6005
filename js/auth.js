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
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        if (!username || !password) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');

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
                this.showSuccess('Connexion réussie !');
                
                setTimeout(() => {
                    window.location.href = 'customization.html';
                }, 1000);
            } else {
                this.showError(data.message || 'Erreur de connexion');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showError('Erreur de connexion au serveur');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    }

    async handleRegister() {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const submitBtn = document.querySelector('#registerForm button[type="submit"]');

        // Validation
        if (!username || !email || !password || !confirmPassword) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        if (username.length < 3 || username.length > 20) {
            this.showError('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères');
            return;
        }

        if (password.length < 6) {
            this.showError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');

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
                
                setTimeout(() => {
                    this.showLoginForm();
                }, 2000);
            } else {
                this.showError(data.message || 'Erreur lors de l\'inscription');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showError('Erreur de connexion au serveur');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    }

    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        this.hideMessage();
    }

    showRegisterForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        this.hideMessage();
    }

    showError(message) {
        const messageContainer = document.getElementById('message-container');
        messageContainer.textContent = message;
        messageContainer.className = 'message error';
        messageContainer.style.display = 'block';
    }

    showSuccess(message) {
        const messageContainer = document.getElementById('message-container');
        messageContainer.textContent = message;
        messageContainer.className = 'message success';
        messageContainer.style.display = 'block';
    }

    hideMessage() {
        const messageContainer = document.getElementById('message-container');
        messageContainer.style.display = 'none';
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
            localStorage.removeItem('slither_token');
            localStorage.removeItem('slither_user');
        }
    }
}

// Initialiser le gestionnaire d'authentification
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
