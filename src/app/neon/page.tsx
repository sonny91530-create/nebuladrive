"use client";

import { useState } from "react";
import {
  ChevronRight, Check, Copy, Terminal, Database, Cloud,
  Info, AlertTriangle, CheckCircle, ArrowRight, Eye, EyeOff
} from "lucide-react";
import CodeBlock from "@/components/CodeBlock";

// ============ MAIN PAGE ============
export default function NeonSetupPage() {
  const [pooledUrl, setPooledUrl] = useState("");
  const [directUrl, setDirectUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleComplete = (i: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // Parse the pooled URL to extract components
  const parseUrl = (url: string) => {
    try {
      const u = new URL(url);
      return {
        user: u.username,
        password: u.password,
        host: u.hostname,
        port: u.port,
        database: u.pathname.slice(1),
        params: u.searchParams.toString(),
      };
    } catch {
      return null;
    }
  };

  const parsedPooled = pooledUrl ? parseUrl(pooledUrl) : null;

  const directConnectionString = parsedPooled
    ? `postgresql://${parsedPooled.user}:${parsedPooled.password}@${parsedPooled.host.replace("-pooler", "")}:${parsedPooled.port || "5432"}/${parsedPooled.database}?sslmode=require`
    : "";

  const steps = [
    {
      title: "Comprendre : Driver pg vs @neondatabase/serverless",
      content: `Bonne nouvelle : **tu n'as PAS besoin d'installer le driver serverless de Neon !**

Ton projet utilise déjà le driver **pg** (node-postgres) qui fonctionne parfaitement avec la **connection string pooled** de Neon.

| | pg (déjà installé) | @neondatabase/serverless |
|---|---|---|
| **Usage** | Vercel (Server/SSR) | Edge Runtime / Cloudflare |
| **Connexion** | TCP via pooler Neon | HTTP via proxy Neon |
| **Performance** | ✅ Plus rapide | ⚡ Plus léger |
| **Ton cas** | ✅ **PARFAIT** | ❌ Pas nécessaire |

**Vercel utilise un runtime Node.js standard** → le driver pg est exactement ce qu'il faut.`,
    },
    {
      title: "Configurer le .env avec la connection string pooled",
      content: `Colle ta connection string **pooled** de Neon dans le fichier .env :`,
      code: `# Fichier .env à la racine du projet
# ⚠️ Remplace par VRAIE connection string depuis Neon

DATABASE_URL="postgresql://neondb_owner:XXXXX@ep-XXXXX.region.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-XXXXX"`,
    },
    {
      title: "Vérifier la connexion (optionnel mais recommandé)",
      content: `Teste que ta connection string fonctionne avant de déployer :`,
      code: `# Test rapide de connexion
npx tsx -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
const res = await sql\`SELECT version()\`;
console.log(res[0].version);
"

# OU avec pg (le driver que tu utilises déjà)
npx tsx -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query('SELECT version()');
console.log(res.rows[0].version);
await pool.end();
"`,
    },
    {
      title: "Pousser le schéma vers Neon",
      content: `C'est l'étape la plus importante. Drizzle va créer les tables dans Neon :`,
      code: `# 1. Vérifier que drizzle.config.json pointe vers le bon schéma
cat drizzle.config.json
# Doit contenir :
# {
#   "out": "./drizzle",
#   "schema": "src/db/schema.ts",
#   "dialect": "postgresql",
#   "dbCredentials": {
#     "url": { "env": "DATABASE_URL" }
#   }
# }

# 2. Pousser le schéma (crée les tables)
npx drizzle-kit push

# Résultat attendu :
# ✓ Pulling schema from database...
# ✓ Changes applied

# 3. Vérifier que les tables existent
# Dans le dashboard Neon → SQL Editor :
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
# → deployment_bookmarks`,
    },
    {
      title: "Comprendre la différence Pooled vs Direct",
      content: `Neon te donne 2 types de connection strings. Voici laquelle utiliser :

**Pooled (recommandée pour ton cas) :**
\`postgresql://user:pass@ep-xxxx-pooler.region.neon.tech/neondb?sslmode=require\`
→ Le "-pooler" dans l'URL active le **connection pooling** de Neon
→ Parfait pour Vercel (multiples requêtes simultanées)
→ ✅ **Utilise celle-ci !**

**Direct (sans pooler) :**
\`postgresql://user:pass@ep-xxxx.region.neon.tech/neondb?sslmode=require\`
→ Connexion directe au compute endpoint
→ Le compute se "réveille" si endormi (~500ms de latence)
→ Moins bon pour le pooling

**Note importante :** Ton code utilise déjà \`new Pool()\` de pg, qui gère le connection pooling localement. Combiné avec le pooler Neon, tu as du pooling double niveau = parfait pour Vercel.`,
    },
    {
      title: "Ajouter la variable dans Vercel",
      content: `Quand tu déploieras sur Vercel, il faudra ajouter la même variable :`,
      code: `# Méthode 1 : Dashboard Vercel
# 1. Settings → Environment Variables
# 2. Add New Variable
#    Key   : DATABASE_URL
#    Value : ta connection string pooled
#    Env   : ✅ Production ✅ Preview ✅ Development

# Méthode 2 : CLI Vercel
vercel env add DATABASE_URL
# → Colle la connection string
# → Choisis "production"

# Répète pour preview et development :
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development

# Vérifier les variables
vercel env ls`,
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)" }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-6">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">Configuration Neon + Drizzle</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Configurer Neon avec Drizzle
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
            Tu n&apos;as <strong className="text-white">PAS</strong> besoin du driver serverless Neon.
            Le driver <code className="px-2 py-0.5 bg-white/10 rounded text-emerald-400 font-mono text-sm">pg</code> déjà installé fonctionne parfaitement.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            <CheckCircle className="w-4 h-4" />
            Déjà compatible — il suffit de configurer le .env
          </div>
        </div>
      </section>

      {/* Quick Answer */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-emerald-300 mb-2">
                  ⚡ Réponse courte :
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  <strong>Tu n&apos;as rien à installer de plus.</strong> Ton projet utilise déjà le bon driver (<code className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-xs">pg</code>). 
                  Il te suffit de copier ta <strong>connection string pooled</strong> de Neon dans le fichier <code className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-xs">.env</code> et de pousser le schéma avec <code className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-xs">npx drizzle-kit push</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* URL Tester Tool */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            Testeur de connection string
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Colle ta connection string pooled pour voir comment elle sera utilisée
          </p>

          <div className="glass-card rounded-xl p-5 space-y-4">
            {/* Input */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Connection string pooled (depuis Neon Dashboard)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pooledUrl}
                  onChange={(e) => setPooledUrl(e.target.value)}
                  placeholder="postgresql://neondb_owner:xxxxx@ep-xxxx-pooler.region.neon.tech/neondb?sslmode=require"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(pooledUrl)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-white/10 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {parsedPooled && (
              <>
                {/* Parsed info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Host</div>
                    <div className="text-sm font-mono text-blue-400">{parsedPooled.host}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Database</div>
                    <div className="text-sm font-mono text-emerald-400">{parsedPooled.database}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">User</div>
                    <div className="text-sm font-mono text-purple-400">{parsedPooled.user}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">SSL</div>
                    <div className="text-sm font-mono text-green-400">✅ requis</div>
                  </div>
                </div>

                {/* Connection type */}
                <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Type : Connection Pooled ✅</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Le &quot;-pooler&quot; dans l&apos;URL indique que c&apos;est une connexion avec pooling. C&apos;est le bon format pour Vercel.
                  </p>
                </div>

                {/* What Drizzle uses */}
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Ce que Drizzle/ton app va utiliser :</h4>
                  <CodeBlock
                    code={`# Dans src/db/index.ts :
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Ton URL pooled est utilisée ici :
const pool = new Pool({
  connectionString: "${pooledUrl.slice(0, 50)}...",
});

export const db = drizzle(pool);`}
                  />
                </div>
              </>
            )}

            {!parsedPooled && pooledUrl && (
              <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10 text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                URL invalide. Vérifie que c&apos;est la connection string complète depuis Neon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-8">Étapes à suivre</h2>

          <div className="space-y-3">
            {steps.map((step, i) => {
              const isActive = currentStep === i;
              const isCompleted = completedSteps.has(i);

              return (
                <div
                  key={i}
                  className={`rounded-xl border transition-all duration-300 ${
                    isActive
                      ? "border-emerald-500/30 bg-white/[0.04]"
                      : isCompleted
                      ? "border-green-500/10 bg-green-500/[0.02]"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <button
                    onClick={() => setCurrentStep(isActive ? -1 : i)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                      isCompleted ? "bg-green-500/20 text-green-400"
                      : isActive ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-gray-500"
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="flex-1 font-medium text-sm text-gray-200">{step.title}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isActive ? "rotate-90" : "text-gray-600"}`} />
                  </button>

                  {isActive && (
                    <div className="px-4 pb-4 space-y-3 animate-fade-in-up">
                      <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{step.content}</div>
                      {step.code && <CodeBlock code={step.code} />}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleComplete(i); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isCompleted ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                          }`}
                        >
                          {isCompleted ? "✅ Fait" : "Marquer fait"}
                        </button>
                        {i < steps.length - 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleComplete(i); setCurrentStep(i + 1); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-all flex items-center gap-1"
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
        </div>
      </section>

      {/* Architecture explanation */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Pourquoi pas de driver serverless ?</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Left: What you have */}
            <div className="glass-card rounded-xl p-5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-emerald-300">✅ Ta config actuelle</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Neon (PostgreSQL)</span>
                </div>
                <div className="pl-6 text-xs text-gray-600">↑ Connection pooled</div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-purple-500" />
                  <span>Vercel (Node.js)</span>
                </div>
                <div className="pl-6 text-xs text-gray-600">↑ Runtime serveur</div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-500" />
                  <span>Driver pg (node-postgres)</span>
                </div>
                <div className="pl-6 text-xs text-gray-600">↑ TCP connection</div>
              </div>
              <div className="mt-3 p-2 rounded bg-emerald-500/5 text-xs text-emerald-400">
                ✅ Fonctionne parfaitement ensemble
              </div>
            </div>

            {/* Right: Serverless driver */}
            <div className="glass-card rounded-xl p-5 border border-white/5 opacity-60">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-400">Pas nécessaire ici</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Neon (PostgreSQL)</span>
                </div>
                <div className="pl-6 text-xs text-gray-600">↑ HTTP proxy</div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  <span>Edge Runtime / CF Workers</span>
                </div>
                <div className="pl-6 text-xs text-gray-600">↑ Pas de TCP</div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>@neondatabase/serverless</span>
                </div>
                <div className="pl-6 text-xs text-gray-600">↑ HTTP connection</div>
              </div>
              <div className="mt-3 p-2 rounded bg-white/5 text-xs text-gray-500">
                ❌ Seulement pour Edge/Cloudflare
              </div>
            </div>
          </div>

          <div className="mt-6 glass-card rounded-xl p-5">
            <h3 className="font-semibold mb-3 text-sm">📦 Dépendances déjà installées</h3>
            <CodeBlock code={`{
  "dependencies": {
    "pg": "8.20.0",           // ← Driver PostgreSQL ✅
    "drizzle-orm": "0.45.2",  // ← ORM ✅
    "next": "16.2.6",         // ← Framework ✅
    "react": "19.2.6"
  }
}`} />
            <p className="text-xs text-gray-500 mt-2">
              Aucune dépendance supplémentaire n&apos;est nécessaire pour Neon.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5 text-center">
        <p className="text-xs text-gray-600">
          Guide configuration Neon + Drizzle — 2026
        </p>
      </footer>
    </main>
  );
}
