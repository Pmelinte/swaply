# Swaply

Swaply este o aplicație web care facilitează schimbul de obiecte între utilizatori. Platforma conectează oameni cu nevoi complementare într-un mod eficient și transparent, permițând schimbul de bunuri utile fără a implica bani.

## 🎯 Despre Proiect

Swaply oferă o platformă unde utilizatorii pot:
- Adăuga obiecte pe care doresc să le schimbe
- Găsi parteneri potriviți pentru schimb de obiecte
- Comunica și negocia detaliile schimbului
- Gestiona profil personal și preferințe
- Lăsa feedback și construi reputație în comunitate

### Misiunea Noastră
Să conectăm oameni cu nevoi complementare într-un mod cât mai eficient și prietenos, oferind instrumentele potrivite pentru a descoperi, comunica și confirma un schimb de obiecte.

### De ce Swaply?
- Economisești bani — obții lucruri utile fără să plătești
- Sustenabilitate — reduci risipa prin reutilizare
- Comunitate — construiești relații prin schimburi reciproce
- Control total — alegi ce schimbi și cu cine

## 🌍 Internationalizare (i18n)
- Româna este limba implicită; Engleza este limba secundară
- Comutator de limbă în header
- Preferința de limbă este salvată în cookie
- Rutele nu se schimbă (rămân de forma: `/`, `/login`, `/signup`)

Notă: Dacă Google Fonts sunt blocate în CI, aplicația revine automat la fonturile de sistem.

## 🚀 Tehnologii Utilizate

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **UI/Styling:** [TailwindCSS 4](https://tailwindcss.com/)
- **Autentificare:** [Supabase Auth](https://supabase.com/auth)
- **Bază de date:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Real-time:** Supabase Realtime pentru notificări instant
- **Upload imagini:** [Cloudinary](https://cloudinary.com/)
- **Limbaj:** TypeScript
- **Linting:** ESLint
- **Git Hooks:** Husky
- **Deployment:** Vercel

## 🗄️ Arhitectura Bazei de Date

Schema completă cu 8 tabele principale:

- **`objects`** - Obiectele disponibile pentru schimb
- **`user_profiles`** - Profilele utilizatorilor extinse
- **`swap_requests`** - Cererile de schimb între utilizatori
- **`messages`** - Sistemul de chat real-time
- **`notifications`** - 10+ tipuri de notificări
- **`ratings`** - Evaluări și feedback
- **`travel_suggestions`** - Sugestii destinații călătorie
- **`categories`** - Categorii obiecte cu subcategorii

Toate tabelele sunt protejate cu **Row Level Security (RLS)** policies pentru securitate maximă.

## 📋 Cerințe de Sistem
- Node.js 20.x
- npm 10.x (sau pnpm 9+)

## 🛠️ Instalare și Configurare

### 1. Clonează repository-ul
```bash
git clone https://github.com/Pmelinte/swaply.git
cd swaply
```

### 2. Instalează dependențele
```bash
npm ci
# sau
pnpm install
```

### 3. Configurează variabilele de mediu
Creează un fișier `.env.local` în rădăcina proiectului cu următoarele variabile:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_preset
```

### 4. Rulează aplicația în modul dezvoltare
```bash
npm run dev
# sau
pnpm dev
```
Aplicația va fi disponibilă la http://localhost:3000

## 🚀 Deployment

### Production Environment
- **Platform**: Vercel
- **URL**: [https://swaply-site.vercel.app](https://swaply-site.vercel.app)
- **Status**: ✅ LIVE cu toate funcționalitățile
- **Auto-deploy**: Din branch `main` cu CI/CD complet

### Variabile de Mediu Production
```env
NEXT_PUBLIC_SITE_URL=https://swaply-site.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

## 📜 Scripturi Disponibile
- `npm run dev` — Pornește serverul de dezvoltare
- `npm run build` — Construiește aplicația pentru producție
- `npm start` — Pornește serverul de producție
- `npm run typecheck` — Verifică tipurile TypeScript
- `npm run lint` — Rulează linter-ul ESLint
- `npm run check` — Rulează atât typecheck cât și lint
- `npm run plop` — Generator de componente/pagini/hooks

## 🏗️ Structura Proiectului
```
swaply/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Grup de autentificare (login, signup)
│   │   ├── (main)/            # Aplicația principală (chat, match, profil)
│   │   ├── info/              # Pagini informaționale
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Pagina de start
│   ├── components/            # Componente React reutilizabile
│   ├── lib/                   # Utilități și configurări
│   │   ├── i18n/              # Internationalizare
│   │   └── supabase/          # Client Supabase
│   └── locales/               # Fișiere de traducere
├── public/                    # Resurse statice
├── plop-templates/            # Template-uri pentru generatoare
└── .github/                   # GitHub Actions și configurări
```

## 🎨 Generare Cod (Plop)
```bash
# Generează o nouă pagină
npm run plop page

# Generează un nou component
npm run plop component

# Generează un hook personalizat
npm run plop hook

# Generează un API route
npm run plop api
```

## 🌟 Funcționalități Principale

### Adăugare Obiecte
- Formular cu 12+ categorii de obiecte
- Upload imagini multiple (Cloudinary)
- Descrieri detaliate și preferințe de schimb

### Matching Inteligent
- Algoritm de potrivire cu scoring 0-100%
- Analiza keywords și compatibilitate categorii
- Sugestii automate bazate pe preferințe

### Comunicare Real-time
- Chat instantaneu între utilizatori
- Notificări în timp real (10+ tipuri)
- System de mesagerie contextual pentru schimburi

### Cereri de Schimb
- Gestionare cereri primite și trimise
- Filtrare și sortare avansată
- Tracking status schimb

### Travel Suggestions
- Algoritm de găsire midpoint între locații
- Sugestii destinații pentru schimburi la distanță
- Estimări costuri și timp de călătorie

### Profil & Reputație
- Completare profil utilizator detaliat
- Istoric schimburi și evaluări
- Sistem de rating și feedback

### Notificări Avansate
- 10+ tipuri: match, mesaje, cereri, realizări
- Notificări browser în timp real
- Dashboard centralizat pentru toate alertele

## 📊 Status Implementare

### ✅ Funcționalități Complete (LIVE)

**URL LIVE:** [https://swaply-site.vercel.app](https://swaply-site.vercel.app)

#### 📦 Adăugare Obiecte (`/obiecte/nou`)
- Formular cu 12+ categorii validate
- Upload imagini multiple cu Cloudinary
- Validare Zod server-side
- Preferințe de schimb detaliate

#### 🔔 Sistem Notificări Avansat
- **10+ tipuri**: match, message, swap_request, welcome, rating, travel, achievement, reminder, promotional, system
- Notificări browser în timp real
- Dashboard centralizat cu dropdown UI
- Supabase realtime subscriptions

#### 🎯 Matching Algorithm Inteligent
- Scoring 0-100% compatibility
- Analiza keywords automată
- Compatibilitate categorii
- Performance optimizat cu indexe

#### 💬 Chat Real-time (`/chat/demo`)
- Mesaje instantanee cu Supabase
- Read receipts și typing indicators
- Context schimb integrat
- UI responsive mobile

#### ✈️ Travel Suggestions API
- Algoritm midpoint geographic
- Destinații România pre-definite
- Estimări costuri și timp
- Integrare în flow-ul de cereri

#### 📋 Management Cereri (`/cereri`)
- Cereri primite și trimise
- Filtrare și sortare avansată
- Tracking status în timp real
- Acțiuni bulk

### 🔄 În Dezvoltare
- Sistem rating și feedback
- Push notifications mobile
- Optimizări performance avansate
- Analytics și rapoarte

## 🧪 Testing & CI/CD
Configurare CI prin GitHub Actions care rulează:
- Type checking cu TypeScript
- Linting cu ESLint
- Build Next.js

## 📝 Contribuție
Contribuțiile sunt binevenite! Pentru a contribui:
1. Fork repository-ul
2. Creează un branch pentru feature-ul tău (`git checkout -b feature/amazing-feature`)
3. Commit modificările (`git commit -m 'Add some amazing feature'`)
4. Push pe branch (`git push origin feature/amazing-feature`)
5. Deschide un Pull Request

Asigură-te că:
- Codul trece toate verificările (typecheck, lint, build)
- Urmezi stilul de cod existent
- Documentezi funcționalitățile noi

## 📄 Licență
Acest proiect este licențiat sub licența MIT — vezi fișierul LICENSE pentru detalii.

## 📧 Contact
Pentru întrebări sau sugestii, vizitează pagina [Contact](https://swaply.ro/info/contact) sau deschide un issue pe GitHub.

---
Dezvoltat cu ❤️ pentru comunitatea de călători și exploratori