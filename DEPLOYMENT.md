# Guide de Déploiement Vercel

## Configuration des Variables d'Environnement

Avant de déployer sur Vercel, vous devez configurer les variables d'environnement suivantes :

### 1. Via l'Interface Vercel

Allez dans votre projet Vercel → Settings → Environment Variables et ajoutez :

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `DATABASE_URL` | Secret | URL de connexion PostgreSQL | `postgresql://user:password@host:5432/dbname` |
| `JWT_SECRET` | Secret | Clé secrète pour les tokens JWT | `votre-cle-secrete-aleatoire-longue` |
| `EMAIL_API_KEY` | Secret | Clé API pour l'envoi d'emails | `votre-cle-api-email` |
| `EMAIL_FROM` | Plain Text | Email expéditeur | `noreply@votredomaine.com` |
| `FRONTEND_URL` | Plain Text | URL du frontend | `https://votreapp.vercel.app` |

### 2. Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Ajouter les secrets (une seule fois)
vercel secrets add database-url "postgresql://user:password@host:5432/dbname"
vercel secrets add jwt-secret "votre-cle-secrete-jwt"
vercel secrets add email-api-key "votre-cle-api-email"

# Ajouter les variables d'environnement
vercel env add DATABASE_URL production
# Puis sélectionner le secret @database-url

vercel env add JWT_SECRET production
# Puis sélectionner le secret @jwt-secret

vercel env add EMAIL_API_KEY production
# Puis sélectionner le secret @email-api-key
```

### 3. Base de Données PostgreSQL

Vous pouvez utiliser plusieurs services gratuits :

#### Option A : Vercel Postgres (Recommandé)
```bash
# Dans votre projet Vercel
vercel postgres create
```

#### Option B : Supabase (Gratuit)
1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Copiez l'URL de connexion PostgreSQL
4. Ajoutez-la comme variable `DATABASE_URL`

#### Option C : Neon (Gratuit)
1. Créez un compte sur [neon.tech](https://neon.tech)
2. Créez une base de données
3. Copiez l'URL de connexion
4. Ajoutez-la comme variable `DATABASE_URL`

### 4. Service d'Email

Pour l'envoi d'emails (confirmation d'inscription), vous pouvez utiliser :

#### Option A : Resend (Recommandé, 3000 emails/mois gratuits)
```bash
# 1. Créez un compte sur resend.com
# 2. Créez une clé API
# 3. Ajoutez-la comme EMAIL_API_KEY
```

#### Option B : SendGrid (100 emails/jour gratuits)
```bash
# 1. Créez un compte sur sendgrid.com
# 2. Créez une clé API
# 3. Ajoutez-la comme EMAIL_API_KEY
```

## Déploiement

### Première fois

```bash
# Installer les dépendances
npm install

# Se connecter à Vercel
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

### Déploiements suivants

```bash
# Automatique via Git (recommandé)
git add .
git commit -m "Mon message"
git push origin main
# Vercel déploie automatiquement

# Ou manuellement
vercel --prod
```

## Initialisation de la Base de Données

Après le premier déploiement, exécutez le script SQL suivant sur votre base de données :

```sql
-- Tables principales
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE snake_customizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    body_texture INTEGER DEFAULT 0,
    primary_color VARCHAR(7) DEFAULT '#4CAF50',
    secondary_color VARCHAR(7) DEFAULT '#45a049',
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    max_length INTEGER NOT NULL,
    kills INTEGER DEFAULT 0,
    survival_time INTEGER NOT NULL,
    rank INTEGER,
    played_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_customizations_user ON snake_customizations(user_id);
CREATE INDEX idx_stats_user ON game_stats(user_id);
CREATE INDEX idx_stats_score ON game_stats(score DESC);
```

## Vérification

Après le déploiement, testez :

1. ✅ Page de connexion : `https://votreapp.vercel.app/login.html`
2. ✅ Inscription d'un compte
3. ✅ Connexion
4. ✅ Page de customisation : `https://votreapp.vercel.app/customization.html`
5. ✅ Jeu : `https://votreapp.vercel.app/`

## Troubleshooting

### Erreur : "DATABASE_URL references Secret which does not exist"
→ Configurez d'abord les variables d'environnement dans Vercel (voir section 1)

### Erreur : "Module not found"
→ Vérifiez que `package.json` contient toutes les dépendances
→ Relancez `npm install`

### Les WebSockets ne fonctionnent pas
→ Vercel Serverless ne supporte pas WebSocket en mode serverless
→ Utilisez une plateforme alternative pour le backend (Railway, Render, Fly.io)

## Alternatives à Vercel pour le Backend

Si vous avez besoin de WebSockets pour le multijoueur en temps réel :

### Railway (Recommandé pour WebSocket)
```bash
# Installer Railway CLI
npm i -g @railway/cli

# Déployer
railway login
railway init
railway up
```

### Render
1. Créez un compte sur [render.com](https://render.com)
2. Créez un Web Service
3. Connectez votre repo GitHub
4. Configurez les variables d'environnement

### Fly.io
```bash
# Installer Fly CLI
curl -L https://fly.io/install.sh | sh

# Déployer
fly launch
fly deploy
```

## Note Importante

⚠️ **Pour le multijoueur en temps réel avec WebSocket, utilisez Railway ou Render au lieu de Vercel.**

Vercel est excellent pour le frontend statique et les API REST, mais ne supporte pas les connexions WebSocket persistantes nécessaires pour le jeu multijoueur.
