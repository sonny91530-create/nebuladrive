"use client";

import { useState } from "react";
import {
  ChevronRight, ChevronDown, Copy, Check, ExternalLink, ArrowRight,
  Terminal, Database, Cloud, GitBranch, Globe, Lock, Settings, Zap,
  AlertTriangle, CheckCircle, Info, FolderGit, Eye, Package
} from "lucide-react";
import CodeBlock from "@/components/CodeBlock";

// ============ DATA ============
const PHASES = [
  {
    id: "prepare",
    title: "Préparer le projet",
    subtitle: "Configuration locale et GitHub",
    icon: FolderGit,
    color: "blue",
    steps: [
      {
        title: "Initialiser le dépôt Git",
        code: `# Dans le dossier de ton projet
cd /chemin/vers/nimbus

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "🚀 Initial commit: Nimbus Cloud Guide"`,
      },
      {
        title: "Créer le repository GitHub",
        text: "Va sur github.com → New Repository → Nomme-le \"nimbus\" → Public ou Private → Create",
        code: `# Créer le repo via CLI (optionnel)
gh repo create nimbus --public --description "Nimbus - Guide Cloud Oracle Gratuit"

# Lier le repo distant
git remote add origin https://github.com/TON_USERNAME/nimbus.git

# Pousser le code
git branch -M main
git push -u origin main`,
      },
      {
        title: "Vérifier que le projet est prêt pour Vercel",
        text: "Vercel détecte automatiquement Next.js. Vérifie que ces fichiers existent :",
        code: `# Structure du projet attendue :
nimbus/
├── package.json          ← Avec "next" en dépendance ✅
├── next.config.ts        ← Config Next.js ✅
├── tsconfig.json         ← TypeScript ✅
├── src/
│   ├── app/
│   │   ├── layout.tsx    ← Root layout ✅
│   │   ├── page.tsx      ← Page principale ✅
│   │   ├── globals.css   ← Styles ✅
│   │   └── api/          ← API routes ✅
│   └── db/
│       ├── index.ts      ← Client Drizzle ✅
│       └── schema.ts     ← Schéma DB ✅
└── .env                  ← Variables d'env (⚠️ pas commité)`,
      },
    ],
  },
  {
    id: "neon",
    title: "Créer la base de données Neon",
    subtitle: "PostgreSQL serverless gratuit",
    icon: Database,
    color: "emerald",
    steps: [
      {
        title: "Créer un compte Neon.tech",
        text: "Rends-toi sur neon.tech et inscris-toi avec GitHub (recommandé). Le plan Free offre 0.5 Go de stockage, ce qui est largement suffisant pour ce projet.",
        code: `# URL d'inscription
https://neon.tech/

# Plan Free inclus :
# ✅ 0.5 Go de stockage
# ✅ 1 projet
# ✅ 3 branches
# ✅ Pas de carte bancaire requise
# ✅ Pas d'expiration`,
      },
      {
        title: "Créer un nouveau projet",
        text: "Une fois connecté : Click sur \"New Project\" → Nomme-le \"nimbus-db\" → Choisis la région la plus proche (Washington DC ou Amsterdam pour l'Europe) → Click \"Create Project\"",
        code: `# Après création, tu verras ta connection string :
# postgresql://user:password@ep-xxxxx.region.neon.tech/neondb?sslmode=require

# ⚠️ Copie cette URL, tu en auras besoin !
# Ne la partage JAMAIS publiquement`,
      },
      {
        title: "Appliquer le schéma de la base de données",
        text: "Depuis ton terminal local, connecte-toi à Neon avec Drizzle :",
        code: `# 1. Mettre à jour le .env avec l'URL Neon
echo 'DATABASE_URL="postgresql://user:password@ep-xxxxx.region.neon.tech/neondb?sslmode=require"' > .env

# 2. Installer drizzle-kit si pas déjà fait
npm install -D drizzle-kit

# 3. Pousser le schéma vers Neon
npx drizzle-kit push

# Résultat attendu :
# ✓ Pulling schema from database...
# ✓ Changes applied`,
      },
      {
        title: "Vérifier la base de données",
        text: "Vérifie que les tables ont bien été créées :",
        code: `# Via le SQL Editor de Neon (dans le dashboard) :
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# Tu devrais voir :
# ┌──────────────────────┐
# │ table_name           │
# ├──────────────────────┤
# │ deployment_bookmarks │
# └──────────────────────┘`,
      },
      {
        title: "Configurer les Branches Neon (optionnel mais recommandé)",
        text: "Neon permet de créer des branches de ta DB comme Git. Idéal pour tester en dev sans toucher à la prod :",
        code: `# Dans le dashboard Neon :
# 1. Click sur "Branches"
# 2. Crée une branche "development"
# 3. Utilise cette URL pour le dev local
# 4. L'URL principale = production

# Structure recommandée :
# ┌─────────────────────────────────────┐
# │ neondb (main)     → Production      │
# │ neondb-dev (dev)  → Développement   │
# └─────────────────────────────────────┘`,
      },
    ],
  },
  {
    id: "vercel",
    title: "Déployer sur Vercel",
    subtitle: "Hébergement gratuit Next.js",
    icon: Cloud,
    color: "purple",
    steps: [
      {
        title: "Créer un compte Vercel",
        text: "Va sur vercel.com et inscris-toi avec GitHub. Le plan Hobby est gratuit et parfait pour ce projet.",
        code: `# URL d'inscription
https://vercel.com/signup

# Plan Hobby (gratuit) inclus :
# ✅ 100 Go de bande passante/mois
# ✅ Serverless functions (10 Go RAM max)
# ✅ Deployments illimités
# ✅ HTTPS automatique
# ✅ Domaines personnalisés
# ✅ Pas de carte bancaire requise`,
      },
      {
        title: "Importer le projet GitHub",
        text: "Sur ton dashboard Vercel : Click \"Add New...\" → \"Project\" → Selectionne ton repo \"nimbus\" → Click \"Import\"",
        code: `# Vercel détecte automatiquement :
# Framework: Next.js ✅
# Build Command: next build ✅
# Output Directory: .next ✅
# Install Command: npm install ✅

# ⚠️ Ne modifie RIEN dans ces paramètres`,
      },
      {
        title: "Ajouter les variables d'environnement",
        text: "C'est l'étape cruciale. Dans les settings du projet Vercel, va dans \"Environment Variables\" et ajoute :",
        code: `# Variable à ajouter dans Vercel :
# Key   : DATABASE_URL
# Value : postgresql://user:password@ep-xxxxx.region.neon.tech/neondb?sslmode=require
# Env   : Production, Preview, Development (coche les 3)

# ⚠️ Prends l'URL de connexion depuis le dashboard Neon
# (Connect → Connection string → Copier)

# CLI alternative :
vercel env add DATABASE_URL
# → Colle ton URL Neon
# → Choisis "production" (répète pour preview/development)`,
      },
      {
        title: "Déployer !",
        text: "Click sur \"Deploy\" et attends 1-2 minutes. Vercel va builder et déployer automatiquement.",
        code: `# Build en cours...
# ✓ Compiled successfully
# ✓ Generating static pages (4/4)
# ✓ Finalizing page optimization
# 
# 🎉 Deployment complete !
# 
# Ton app est disponible sur :
# https://nimbus-xxxx.vercel.app
# 
# Chaque push sur main déclenchera un nouveau déploiement auto`,
      },
      {
        title: "Déploiement via CLI (alternative)",
        text: "Si tu préfères la ligne de commande :",
        code: `# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer (première fois - mode interactif)
vercel
# → Set up and deploy? Y
# → Which scope? Ton compte
# → Link to existing project? N
# → Project name? nimbus
# → Directory? ./

# Déploiements suivants (uniquement la production)
vercel --prod`,
      },
    ],
  },
  {
    id: "domain",
    title: "Configurer un domaine personnalisé",
    subtitle: "Optionnel mais recommandé",
    icon: Globe,
    color: "amber",
    steps: [
      {
        title: "Acheter un nom de domaine",
        text: "Plusieurs options abordables (5-10€/an) :",
        code: `# Registraires recommandés :
# ┌─────────────────┬──────────┬─────────────────────┐
# │ Fournisseur     │ Prix/an  │ Notes               │
# ├─────────────────┼──────────┼─────────────────────┤
# │ Cloudflare      │ ~8€      │ Prix coûtant, top   │
# │ Namecheap       │ ~10€     │ Bon support         │
# │ OVH             │ ~8€      │ Français            │
# │ Porkbun         │ ~9€      │ Interface sympa     │
# └─────────────────┴──────────┴─────────────────────┘

# Extensions recommandées :
# .com  → Le classique (~10€/an)
# .dev  → Parfait pour un projet tech (~12€/an)
# .app  → Pour une application (~12€/an)
# .cloud → Le plus thématique (~20€/an)`,
      },
      {
        title: "Ajouter le domaine dans Vercel",
        text: "Dans les settings de ton projet Vercel → Domains → Ajoute ton domaine :",
        code: `# Dans Vercel Dashboard :
# 1. Settings → Domains
# 2. Ajoute "nimbus.cloud" (ton domaine)
# 3. Vercel te donne 2 options de configuration :
#
# Option A (recommandée) - Nameservers :
# Change les nameservers chez ton registrar :
#   ns1.vercel-dns.com
#   ns2.vercel-dns.com
#
# Option B - Records DNS :
# Ajoute ces records chez ton registrar :
#   Type: A     Name: @     Value: 76.76.21.21
#   Type: CNAME Name: www   Value: cname.vercel-dns.com`,
      },
      {
        title: "Vérifier la propagation DNS",
        text: "La propagation DNS peut prendre de 5 minutes à 48h :",
        code: `# Vérifier la propagation :
# https://dnschecker.org/

# Ou en ligne de commande :
dig nimbus.cloud +short
# Devrait retourner : 76.76.21.21

dig www.nimbus.cloud +short
# Devrait retourner : cname.vercel-dns.com

# Une fois propagé, Vercel active automatiquement
# le certificat HTTPS (Let's Encrypt) en ~1-5 min`,
      },
    ],
  },
  {
    id: "verify",
    title: "Vérifier le déploiement",
    subtitle: "S'assurer que tout fonctionne",
    icon: CheckCircle,
    color: "green",
    steps: [
      {
        title: "Tester l'application",
        text: "Ouvre l'URL de ton déploiement et vérifie chaque section :",
        code: `# Checklist de vérification :
# ✅ La page charge correctement
# ✅ Les animations fonctionnent
# ✅ Le guide de déploiement s'affiche
# ✅ Les blocs de code sont lisibles
# ✅ Le planificateur de stockage fonctionne
# ✅ Les FAQ s'ouvrent/ferment

# Tester l'API :
curl https://TON_URL.vercel.app/api/health
# Devrait retourner : {"status": "ok"}

curl https://TON_URL.vercel.app/api/solutions
# Devrait retourner les bookmarks (vide au début)`,
      },
      {
        title: "Vérifier la connexion à la base de données",
        text: "Teste que Vercel peut bien se connecter à Neon :",
        code: `# Dans les logs Vercel :
# 1. Va sur Vercel Dashboard
# 2. Click sur ton déploiement
# 3. Onglet "Logs"
# 4. Vérifie qu'il n'y a PAS d'erreur de connexion DB

# Erreur courante :
# ❌ "password authentication failed"
#    → Vérifie que DATABASE_URL est correct
# ❌ "connection timed out"
#    → Vérifie que l'URL Neon inclut ?sslmode=require

# Connexion réussie :
# ✅ Aucune erreur dans les logs
# ✅ L'API /api/health retourne "ok"`,
      },
      {
        title: "Tester les push suivants (CI/CD)",
        text: "Vérifie que les déploiements automatiques fonctionnent :",
        code: `# Faire une petite modification :
# 1. Modifie un texte dans page.tsx
# 2. Commit et push :
git add .
git commit -m "✨ Minor text update"
git push

# 3. Va sur Vercel Dashboard
# 4. Tu devrais voir un nouveau déploiement en cours
# 5. Après ~1 min, la modification est live !

# 🎉 Le CI/CD est fonctionnel !`,
      },
    ],
  },
];

const TROUBLESHOOTING = [
  {
    problem: "Erreur : DATABASE_URL n'est pas définie",
    cause: "La variable d'environnement n'a pas été ajoutée dans Vercel",
    solution: `# Dans Vercel Dashboard :
# 1. Settings → Environment Variables
# 2. Ajoute DATABASE_URL avec l'URL Neon
# 3. Redéploie le projet

vercel env add DATABASE_URL production`,
  },
  {
    problem: "Erreur : SSL required / connection refused",
    cause: "Neon nécessite une connexion SSL",
    solution: `# Vérifie que ton DATABASE_URL inclut sslmode=require :
DATABASE_URL="postgresql://user:pass@ep-xxxx.region.neon.tech/neondb?sslmode=require"
#                                                                     ^^^^^^^^^^^^^^^^
# Si absent, ajoute-le à la fin de l'URL`,
  },
  {
    problem: "Erreur : Drizzle ne trouve pas le schéma",
    cause: "Le schéma n'a pas été poussé vers Neon",
    solution: `# Pousse le schéma en local :
npx drizzle-kit push

# Ou utilise le SQL Editor de Neon :
# Dashboard Neon → SQL Editor → Colle le CREATE TABLE

# Ou exécute via psql :
psql "postgresql://user:pass@ep-xxxx.region.neon.tech/neondb?sslmode=require" \\
  -f src/db/schema.sql`,
  },
  {
    problem: "Build failed sur Vercel",
    cause: "Erreur TypeScript ou dépendance manquante",
    solution: `# Debug en local d'abord :
npm run build

# Si ça marche en local mais pas sur Vercel :
# 1. Vérifie les logs du build dans Vercel
# 2. Les erreurs courantes :
#    - Fichiers avec des majuscules/minuscules
#    - Imports cassés
#    - Dépendances non listées dans package.json

# Force un rebuild :
vercel --prod --force`,
  },
  {
    problem: "Le site charge mais les données DB ne s'affichent pas",
    cause: "Les tables sont vides ou l'API ne retourne rien",
    solution: `# Vérifie les tables dans Neon :
# Dashboard Neon → Tables → Vérifie que deployment_bookmarks existe

# Insère des données de test :
INSERT INTO deployment_bookmarks (step_index, step_title, is_completed)
VALUES (0, 'Test step', true);

# Teste l'API directement :
curl https://TON_URL.vercel.app/api/solutions`,
  },
];

const COLORS: Record<string, { bg: string; text: string; border: string; icon: string; light: string; badge: string; badgeText: string; ring: string }> = {
  blue: {
    bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20",
    icon: "text-blue-400", light: "bg-blue-500/5", badge: "bg-blue-500/10",
    badgeText: "text-blue-400", ring: "ring-blue-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20",
    icon: "text-emerald-400", light: "bg-emerald-500/5", badge: "bg-emerald-500/10",
    badgeText: "text-emerald-400", ring: "ring-emerald-500/20",
  },
  purple: {
    bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20",
    icon: "text-purple-400", light: "bg-purple-500/5", badge: "bg-purple-500/10",
    badgeText: "text-purple-400", ring: "ring-purple-500/20",
  },
  amber: {
    bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20",
    icon: "text-amber-400", light: "bg-amber-500/5", badge: "bg-amber-500/10",
    badgeText: "text-amber-400", ring: "ring-amber-500/20",
  },
  green: {
    bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20",
    icon: "text-green-400", light: "bg-green-500/5", badge: "bg-green-500/10",
    badgeText: "text-green-400", ring: "ring-green-500/20",
  },
};

// ============ COMPONENTS ============
function PhaseSection({ phase, phaseIndex }: { phase: typeof PHASES[0]; phaseIndex: number }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const colors = COLORS[phase.color] || COLORS.blue;

  const toggleStep = (i: number) => setExpandedStep(expandedStep === i ? null : i);
  const toggleComplete = (i: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const progress = Math.round((completedSteps.size / phase.steps.length) * 100);

  return (
    <section className="scroll-mt-24" id={`phase-${phase.id}`}>
      {/* Phase header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <phase.icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${colors.badgeText}`}>
              Phase {phaseIndex + 1}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">{phase.title}</h2>
          </div>
        </div>
        <p className="text-gray-500 ml-[52px]">{phase.subtitle}</p>
      </div>

      {/* Progress */}
      <div className="mb-6 ml-[52px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{completedSteps.size}/{phase.steps.length} étapes</span>
          <span className={`text-xs font-semibold ${colors.badgeText}`}>{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${phase.color === 'blue' ? 'bg-blue-500' : phase.color === 'emerald' ? 'bg-emerald-500' : phase.color === 'purple' ? 'bg-purple-500' : phase.color === 'amber' ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 ml-[52px]">
        {phase.steps.map((step, i) => {
          const isActive = expandedStep === i;
          const isCompleted = completedSteps.has(i);

          return (
            <div
              key={i}
              className={`rounded-xl border transition-all duration-300 ${
                isActive
                  ? `${colors.border} bg-white/[0.04]`
                  : isCompleted
                  ? "border-green-500/10 bg-green-500/[0.02]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
              }`}
            >
              <button
                onClick={() => toggleStep(i)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-green-500/20 text-green-400"
                      : isActive
                      ? `${colors.bg} ${colors.icon}`
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="flex-1 font-medium text-sm text-gray-200">{step.title}</span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isActive ? "rotate-90 text-gray-400" : "text-gray-600"
                  }`}
                />
              </button>

              {isActive && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in-up">
                  {step.text && (
                    <div className="flex items-start gap-2 text-sm text-gray-400">
                      <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="leading-relaxed">{step.text}</p>
                    </div>
                  )}
                  {step.code && <CodeBlock code={step.code} />}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleComplete(i); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isCompleted
                          ? "bg-green-500/20 text-green-400"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {isCompleted ? "✅ Terminé" : "Marquer terminé"}
                    </button>
                    {i < phase.steps.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(i);
                          setExpandedStep(i + 1);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1"
                      >
                        Suivant <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TroubleshootingSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mt-24 scroll-mt-24" id="troubleshooting">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
          <AlertTriangle className="w-3.5 h-3.5" />
          Dépannage
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Problèmes courants</h2>
        <p className="text-gray-500 text-sm">Solutions aux erreurs les plus fréquentes</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {TROUBLESHOOTING.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left p-5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-200 text-sm mb-1">{item.problem}</h3>
                <p className="text-xs text-gray-500">Cause : {item.cause}</p>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-gray-500 flex-shrink-0 mt-1 transition-transform duration-300 ${
                  openIndex === i ? "rotate-90" : ""
                }`}
              />
            </button>
            {openIndex === i && (
              <div className="px-5 pb-5">
                <CodeBlock code={item.solution} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ArchitectureDiagram() {
  return (
    <section className="mt-24 scroll-mt-24" id="architecture">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Architecture du déploiement</h2>
        <p className="text-gray-500 text-sm">Comment les composants communiquent entre eux</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex flex-col items-center gap-4">
            {/* User */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">Utilisateur (navigateur)</span>
            </div>

            <div className="w-px h-8 bg-gradient-to-b from-blue-400/50 to-purple-400/50" />

            {/* Vercel */}
            <div className="relative w-full max-w-md">
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Cloud className="w-6 h-6 text-purple-400" />
                <div>
                  <div className="text-sm font-bold text-purple-300">Vercel</div>
                  <div className="text-xs text-gray-500">Next.js App + API Routes</div>
                </div>
              </div>
              {/* Annotations */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full hidden lg:block">
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                  ✅ Build auto<br />
                  ✅ HTTPS auto<br />
                  ✅ CDN global
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-gradient-to-b from-purple-400/50 to-emerald-400/50" />

            {/* Neon */}
            <div className="relative w-full max-w-md">
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Database className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-sm font-bold text-emerald-300">Neon.tech</div>
                  <div className="text-xs text-gray-500">PostgreSQL Serverless</div>
                </div>
              </div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full hidden lg:block">
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                  ✅ SSL requis<br />
                  ✅ 0.5 Go gratuit<br />
                  ✅ Auto-suspend
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-gradient-to-b from-emerald-400/50 to-transparent" />

            {/* GitHub */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
              <GitBranch className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium">GitHub (CI/CD → Vercel)</span>
            </div>
          </div>

          {/* Flow arrows */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="text-xs text-gray-500 mb-1">Frontend</div>
              <div className="text-sm font-medium text-blue-400">Next.js Pages</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="text-xs text-gray-500 mb-1">API</div>
              <div className="text-sm font-medium text-purple-400">Route Handlers</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02]">
              <div className="text-xs text-gray-500 mb-1">Database</div>
              <div className="text-sm font-medium text-emerald-400">Drizzle ORM</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ MAIN PAGE ============
export default function DeployGuidePage() {
  const [activePhase, setActivePhase] = useState(0);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)" }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-300">Guide complet — 30 minutes</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Déployer Nimbus
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Guide étape par étape pour mettre en production avec{" "}
            <span className="text-purple-400 font-semibold">Vercel</span> +{" "}
            <span className="text-emerald-400 font-semibold">Neon.tech</span>
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { label: "Coût", value: "0€", icon: Zap },
              { label: "Temps", value: "~30 min", icon: Settings },
              { label: "Difficulté", value: "Facile", icon: Eye },
              { label: "Services", value: "2", icon: Package },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
                <stat.icon className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                  <div className="text-sm font-bold">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phase navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {PHASES.map((phase, i) => {
              const colors = COLORS[phase.color] || COLORS.blue;
              return (
                <button
                  key={phase.id}
                  onClick={() => {
                    setActivePhase(i);
                    document.getElementById(`phase-${phase.id}`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activePhase === i
                      ? `${colors.bg} ${colors.icon}`
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <phase.icon className="w-3.5 h-3.5" />
                  {phase.title}
                </button>
              );
            })}
            <button
              onClick={() => document.getElementById("troubleshooting")?.scrollIntoView({ behavior: "smooth" })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Dépannage
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {PHASES.map((phase, i) => (
          <div key={phase.id} className="mb-20">
            <PhaseSection phase={phase} phaseIndex={i} />
          </div>
        ))}

        <ArchitectureDiagram />
        <TroubleshootingSection />

        {/* Summary */}
        <section className="mt-24">
          <div className="glass-card rounded-2xl p-8 text-center border border-emerald-500/20">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">🎉 Tu es prêt !</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Suis les phases dans l&apos;ordre et ton application sera en production en moins de 30 minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="#phase-prepare"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                Commencer le déploiement
              </a>
              <a
                href="/neon"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-sm font-medium rounded-lg border border-emerald-500/20 transition-all"
              >
                <Terminal className="w-4 h-4" />
                Guide config Neon
              </a>
              <a
                href="https://neon.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg border border-white/10 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir Neon.tech
              </a>
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg border border-white/10 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir Vercel
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5 text-center">
        <p className="text-xs text-gray-600">
          Guide de déploiement Nimbus — Vercel + Neon.tech — 2026
        </p>
      </footer>
    </main>
  );
}
