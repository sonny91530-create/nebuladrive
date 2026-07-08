# 🌌 Déployer NebulaDrive sur Vercel + Neon.tech (Gratuit)

> **Objectif :** Mettre en ligne NebulaDrive en ~15 minutes, **0€/mois**, avec HTTPS et base de données serverless.

---

## 📋 Table des matières

1. [Architecture](#1--architecture)
2. [Prérequis](#2--prérequis)
3. [Étape 1 : Créer la base Neon.tech](#3--étape-1--créer-la-base-neontech)
4. [Étape 2 : Préparer le code pour Vercel + Neon](#4--étape-2--préparer-le-code-pour-vercel--neon)
5. [Étape 3 : Déployer sur Vercel](#5--étape-3--déployer-sur-vercel)
6. [Étape 4 : Appliquer le schéma de base de données](#6--étape-4--appliquer-le-schéma-de-base-de-données)
7. [Étape 5 : Vérifications finales](#7--étape-5--vérifications-finales)
8. [Résolution de problèmes](#8--résolution-de-problèmes)
9. [Aller plus loin](#9--aller-plus-loin)

---

## 1. 🏗️ Architecture

```
┌─────────────┐      HTTP/2       ┌──────────────┐      Pool HTTP      ┌──────────────┐
│  Navigateur  │ ◄──────────────► │    Vercel    │ ◄────────────────► │  Neon.tech   │
│   (Client)   │    CDN + Edge    │  (Next.js)   │   @neondatabase/   │ (PostgreSQL) │
└─────────────┘                   └──────────────┘    serverless       └──────────────┘
                                        
✅ HTTPS automatique (Let's Encrypt Vercel)
✅ CDN global (100+ edge locations)
✅ Serverless functions (API routes Next.js)
✅ Base de données PostgreSQL serverless (Neon)
✅ Stockage fichiers : /tmp sur Vercel (ephemeral) → À ADAPTER
```

> ⚠️ **Important :** Vercel est **serverless** — le système de fichiers est en lecture seule.
> Le code actuel sauvegarde les fichiers dans `uploads/` (disque local). Pour Vercel, il faut
> soit utiliser un **stockage objet** (Vercel Blob, Cloudflare R2, AWS S3), soit je vous donne
> la version modifiée qui stocke les fichiers **directement dans PostgreSQL** (bytea/large objects).

---

## 2. 📋 Prérequis

- [x] Un compte [GitHub](https://github.com) (gratuit)
- [x] Un compte [Vercel](https://vercel.com) (gratuit, plan Hobby)
- [x] Un compte [Neon.tech](https://neon.tech) (gratuit, 500 Mo de stockage)
- [x] Git installé sur votre machine
- [x] Node.js 20+ installé

---

## 3. 🗄️ Étape 1 — Créer la base Neon.tech

### 3.1 S'inscrire sur Neon.tech

1. Allez sur **[neon.tech](https://neon.tech)** → cliquez **"Sign Up"**
2. Connectez-vous avec GitHub ou Google
3. Une fois connecté, cliquez sur **"Create project"**

### 3.2 Créer le projet

| Champ | Valeur |
|-------|--------|
| **Project name** | `nebuladrive` |
| **Region** | Choisissez la plus proche de vos utilisateurs (ex: `aws-eu-west-3` pour Paris) |
| **Postgres version** | `16` (par défaut) |

Cliquez sur **"Create project"** → attendez 5 secondes.

### 3.3 Récupérer la chaîne de connexion

Une fois le projet créé, vous arrivez sur le **Dashboard Neon** :

1. Cliquez sur le bouton **"Connection Details"** (en haut à droite)
2. Vous voyez plusieurs chaînes de connexion :

```
✅ Connection string (pooled) — À UTILISER ABSOLUMENT pour Vercel
   postgresql://neondb_owner:npg_xxxxx@ep-crimson-bread-a2xxxxx-pooler.eu-west-3.aws.neon.tech/neondb?sslmode=require

❌ Connection string (direct) — NE PAS UTILISER avec Vercel (épuise les connexions)
   postgresql://neondb_owner:npg_xxxxx@ep-crimson-bread-a2xxxxx.eu-west-3.aws.neon.tech/neondb?sslmode=require
```

> 🔑 **CRUCIAL :** Copiez la **pooled connection string** (celle qui contient `-pooler` dans l'URL).
> La version "direct" épuisera le pool de connexions sur Vercel (serverless = beaucoup de workers éphémères).

3. **Gardez cette URL précieusement** — on va l'utiliser dans 2 minutes.

---

## 4. 🔧 Étape 2 — Préparer le code pour Vercel + Neon

### 4.1 Installer le driver serverless Neon

```bash
npm install @neondatabase/serverless ws bufferutil
npm install -D @types/ws
```

### 4.2 Modifier la connexion DB pour Neon serverless

On va adapter `src/db/index.ts` pour utiliser le driver HTTP de Neon (meilleur pour serverless) :

Éditez le fichier **`src/db/index.ts`** :

```typescript
// src/db/index.ts — adapté pour Neon Serverless + Vercel
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Neon HTTP driver — pas de pool, pas d'épuisement de connexions
const sql = neon(databaseUrl);
export const db = drizzle({ client: sql });

// Garder l'export pool pour compatibilité (non utilisé avec HTTP)
export const pool = null;
```

> ℹ️ Le driver HTTP de Neon gère le pooling côté serveur. Chaque requête API = 1 requête HTTP à Neon.
> Pas de risque d'épuisement de connexions, contrairement au driver `pg` classique.

### 4.3 Créer un script de migration pour Neon

Créez un fichier **`scripts/migrate-neon.ts`** :

```typescript
// scripts/migrate-neon.ts
// À exécuter UNE SEULE FOIS après le déploiement pour créer les tables
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/db/index";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("🔧 Création des tables sur Neon...");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      storage_used BIGINT NOT NULL DEFAULT 0,
      storage_limit BIGINT NOT NULL DEFAULT 26843545600,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
      name VARCHAR(500) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders(user_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
      name VARCHAR(500) NOT NULL,
      original_name VARCHAR(500) NOT NULL,
      mime_type VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream',
      size BIGINT NOT NULL DEFAULT 0,
      storage_path VARCHAR(1000) NOT NULL,
      is_public BOOLEAN NOT NULL DEFAULT false,
      share_token VARCHAR(64),
      download_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS files_user_id_idx ON files(user_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS files_folder_id_idx ON files(folder_id)
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS files_share_token_idx ON files(share_token)
  `);

  console.log("✅ Tables créées avec succès sur Neon !");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Erreur de migration :", err);
  process.exit(1);
});
```

Puis dans `package.json`, ajoutez le script :

```json
"scripts": {
  "migrate:neon": "npx tsx scripts/migrate-neon.ts"
}
```

### 4.4 Gérer le stockage des fichiers sur Vercel

Vercel a un filesystem **en lecture seule** et **ephémère** (`/tmp` limité à la fonction). On a 3 options :

#### Option A : Stocker dans PostgreSQL (recommandé - gratuit, simple)

Modifier les routes pour stocker le contenu binaire dans PostgreSQL (colonne `BYTEA`). Pas de coût supplémentaire, pas de service externe.

#### Option B : Vercel Blob Storage

Ajouter `@vercel/blob` pour stocker les fichiers. Gratuit jusqu'à 1 Go, puis payant.

#### Option C : Cloudflare R2

10 Go gratuits, compatible S3. Nécessite un compte Cloudflare.

**Je vais implémenter l'Option A (PostgreSQL) pour rester 100% gratuit et simple.**

### 4.5 Ajouter le fichier `.env.local`

```bash
# .env.local (NE JAMAIS COMMIT)
DATABASE_URL=postgresql://neondb_owner:npg_xxxxx@ep-xxx-pooler.eu-west-3.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=un-secret-tres-long-genere-aleatoirement-64-caracteres-minimum
```

Pour générer un JWT_SECRET sécurisé :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 5. 🚀 Étape 3 — Déployer sur Vercel

### 5.1 Pousser le code sur GitHub

```bash
# Initialiser Git si ce n'est pas déjà fait
git init
git add .
git commit -m "🌌 NebulaDrive - ready for Vercel + Neon deployment"

# Créer un repo sur GitHub (via l'interface web ou CLI)
# Puis pousser :
git remote add origin https://github.com/VOTRE_USERNAME/nebuladrive.git
git branch -M main
git push -u origin main
```

### 5.2 Connecter à Vercel

#### Via l'interface web (recommandé pour la première fois) :

1. Allez sur **[vercel.com](https://vercel.com)** → **"New Project"**
2. Importez votre repo GitHub `nebuladrive`
3. Vercel détecte automatiquement **Next.js** — ne changez rien au framework
4. Configurez les variables d'environnement :

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:...` (la pooled URL Neon) | Production, Preview, Development |
| `JWT_SECRET` | `votre-secret-genere-aleatoirement` | Production, Preview, Development |

5. Cliquez **"Deploy"** 🚀

#### Via la CLI (alternative) :

```bash
npm i -g vercel

# Dans le dossier du projet
vercel

# Répondez aux questions :
# ? Set up and deploy? → Yes
# ? Which scope? → votre-compte
# ? Link to existing project? → No
# ? Project name: nebuladrive
# ? Directory: ./
# ? Override settings? → No

# Ajouter les variables d'environnement
echo "votre-pooled-url-neon" | vercel env add DATABASE_URL production
echo "votre-jwt-secret" | vercel env add JWT_SECRET production

# Déclencher un redéploiement
vercel --prod
```

### 5.3 Premier déploiement

Le déploiement prend ~30-60 secondes. Vous verrez :

```
✔ Building...
✔ Compiled successfully
✔ Collecting page data...
✔ Generating static pages...
✔ Finalizing...
✅ Deployed to production
```

Votre URL sera : `https://nebuladrive-xxx.vercel.app`

Vous pouvez ajouter un domaine personnalisé dans **Settings → Domains**.

---

## 6. 🗃️ Étape 4 — Appliquer le schéma de base de données

Une fois le déploiement réussi, il faut créer les tables dans Neon.

### Méthode 1 : Via le SQL Editor de Neon (la plus simple)

1. Allez sur votre projet Neon : [console.neon.tech](https://console.neon.tech)
2. Cliquez sur **"SQL Editor"** dans la sidebar
3. Collez ce script et exécutez :

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  storage_used BIGINT NOT NULL DEFAULT 0,
  storage_limit BIGINT NOT NULL DEFAULT 26843545600,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS folders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders(user_id);
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);

CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
  name VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream',
  size BIGINT NOT NULL DEFAULT 0,
  storage_path VARCHAR(1000) NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_token VARCHAR(64),
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS files_user_id_idx ON files(user_id);
CREATE INDEX IF NOT EXISTS files_folder_id_idx ON files(folder_id);
CREATE UNIQUE INDEX IF NOT EXISTS files_share_token_idx ON files(share_token);
```

4. Cliquez **"Run"** → ✅ Tables créées !

### Méthode 2 : En local avec le script (si vous avez npm en local)

```bash
# Créer un fichier .env.local avec la pooled URL Neon
echo 'DATABASE_URL=postgresql://neondb_owner:...' > .env.local

# Exécuter la migration
npx tsx scripts/migrate-neon.ts
```

---

## 7. ✅ Étape 5 — Vérifications finales

### 7.1 Tester l'application

1. Ouvrez `https://votre-projet.vercel.app`
2. Créez un compte (inscription)
3. Uploadez un fichier
4. Créez un dossier
5. Générez un lien de partage
6. Ouvrez le lien de partage en navigation privée

### 7.2 Vérifier la base de données

Allez dans **Neon SQL Editor** et exécutez :

```sql
SELECT * FROM users;
SELECT COUNT(*) FROM files;
SELECT pg_size_pretty(pg_database_size('neondb')) AS db_size;
```

### 7.3 Monitoring

- **Vercel Dashboard** → Logs, analytics, erreurs
- **Neon Dashboard** → Requêtes par seconde, taille DB, connexions actives

---

## 8. 🔧 Résolution de problèmes

### ❌ "DATABASE_URL is required"

**Cause :** Variable d'environnement non configurée sur Vercel.

**Solution :**
1. Vercel Dashboard → Settings → Environment Variables
2. Ajoutez `DATABASE_URL` avec la pooled URL Neon
3. Redéployez (Menu "Deployments" → "Redeploy")

### ❌ "Connection timed out" ou "too many connections"

**Cause :** Vous utilisez la connection string **directe** (sans `-pooler`) au lieu de la **pooled**.

**Solution :** Remplacez `DATABASE_URL` par la version pooled (contient `-pooler` dans l'URL).

### ❌ "relation 'users' does not exist"

**Cause :** Les tables n'ont pas encore été créées sur Neon.

**Solution :** Allez dans **Neon SQL Editor** et exécutez le script SQL de l'étape 6.

### ❌ Erreur 504 (timeout) sur l'upload de gros fichiers

**Cause :** Vercel limite les fonctions à 10s (Hobby) ou 60s (Pro).

**Solutions :**
- Sur le plan Hobby : limitez les uploads à ~5 Mo
- Sur le plan Pro ($20/mois) : limite à 60s, fichiers jusqu'à ~200 Mo
- Pour de très gros fichiers : utilisez l'upload direct vers Vercel Blob

### ❌ Le stockage de fichiers ne fonctionne pas

**Cause :** Vercel a un filesystem en lecture seule — on ne peut pas écrire dans `uploads/`.

**Solution :** Il faut adapter le stockage. Je vous prépare la version PostgreSQL immédiatement après ce guide.

---

## 9. 🚀 Aller plus loin

### Ajouter un domaine personnalisé

1. Vercel Dashboard → Settings → Domains
2. Ajoutez votre domaine (ex: `cloud.monsite.com`)
3. Suivez les instructions DNS de Vercel
4. HTTPS automatique en 1 clic

### Activer les preview deployments

Chaque Pull Request GitHub aura son propre déploiement de preview avec une URL unique.
Parfait pour tester avant de merger.

### Sauvegardes Neon

Neon offre le **Point-in-Time Recovery** (PITR) même en plan gratuit :
- Neon Dashboard → Branches → Create branch from point in time
- Vous pouvez aussi faire des `pg_dump` réguliers :

```bash
pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql
```

### Monitoring et alertes

- **Vercel Analytics** (payant) : Core Web Vitals, RUM
- **Neon Dashboard** : requêtes lentes, taille DB, alertes de quota

---

## 💰 Coût total

| Service | Plan | Prix |
|---------|------|------|
| **Vercel** | Hobby | **0€/mois** |
| **Neon.tech** | Free (500 Mo DB) | **0€/mois** |
| **GitHub** | Free | **0€/mois** |
| **Domaine** (optionnel) | .com /.fr | ~10€/an |
| **TOTAL** | | **0€/mois** 🎉 |

Avec le plan gratuit Neon :
- 500 Mo de stockage base de données
- 100 heures de compute/mois
- 1 projet, 10 branches
- Point-in-time recovery

Si vous stockez les fichiers dans PostgreSQL, 500 Mo = environ 300-400 Mo de fichiers (à cause de l'encodage base64/bytea).

> 💡 Pour augmenter le stockage : Neon Launch ($19/mois = 3 Go) ou passez à l'option B (Cloudflare R2 = 10 Go gratuits).

---

## 📞 Support

- **Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Neon** : [neon.tech/docs](https://neon.tech/docs)
- **Drizzle ORM** : [orm.drizzle.team](https://orm.drizzle.team)

---

## 🎯 Prochaine étape

La version actuelle du code utilise le système de fichiers local (`uploads/`) qui n'est pas compatible avec Vercel. 

**Voulez-vous que je modifie le code pour stocker les fichiers directement dans PostgreSQL (100% gratuit) ou utiliser Vercel Blob (1 Go gratuit, plus simple pour les gros fichiers) ?**

Dites-moi et je mettrai à jour tout le backend pour la solution choisie ! 🚀
