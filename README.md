# Swaply

Swaply este o aplicație web care facilitează schimbul de locuințe între utilizatori, fie pentru vacanțe, fie pe termen mediu. Platforma conectează oameni cu nevoi complementare într-un mod eficient și transparent.

## 🎯 Despre Proiect

Swaply oferă o platformă unde utilizatorii pot:
- Găsi parteneri potriviți pentru schimb de locuințe
- Comunica și negocia detaliile schimbului
- Gestiona profil personal și preferințe
- Lăsa feedback și construi reputație în comunitate

### Misiunea Noastră
Să conectăm oameni cu nevoi complementare într-un mod cât mai eficient și prietenos, oferind instrumentele potrivite pentru a descoperi, comunica și confirma un schimb.

### De ce Swaply?
- Economisești bani și timp — eviți costurile cazării tradiționale
- Experiență autentică — descoperi locuri noi prin ochii localnicilor
- Control total — alegi perioadele și preferințele care ți se potrivesc

## 🌍 Internationalizare (i18n)
- Româna este limba implicită; Engleza este limba secundară
- Comutator de limbă în header
- Preferința de limbă este salvată în cookie
- Rutele nu se schimbă (rămân de forma: `/`, `/login`, `/signup`)

Notă: Dacă Google Fonts sunt blocate în CI, aplicația revine automat la fonturile de sistem.

## 🚀 Tehnologii Utilizate
- Framework: [Next.js 15](https://nextjs.org/) (App Router)
- UI/Styling: [TailwindCSS 4](https://tailwindcss.com/)
- Autentificare: [Supabase Auth](https://supabase.com/auth)
- Bază de date: [Supabase](https://supabase.com/)
- Limbaj: TypeScript
- Linting: ESLint
- Git Hooks: Husky

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

### Autentificare
- Înregistrare și autentificare prin email
- Gestionare sesiune cu Supabase

### Match & Chat
- Căutare parteneri compatibili
- Sistem de mesagerie în aplicație
- Propuneri de schimb

### Profil
- Completare profil utilizator
- Adăugare preferințe și disponibilitate
- Istoric schimburi

### Informații
- Despre Swaply
- Cum funcționează
- Întrebări frecvente
- Termeni și condiții
- Politică de confidențialitate
- Contact

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