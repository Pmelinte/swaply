# 🚀 Configurare Variabile de Mediu - Swaply

Acest ghid te va ajuta să configurezi variabilele de mediu necesare pentru a rula aplicația Swaply cu Supabase.

## 📋 Ce avem nevoie

1. **Cont Supabase** - [Creează aici](https://app.supabase.com)
2. **Proiect Supabase** - Nou sau existent
3. **Acces la Vercel** - Pentru deployment în producție

## 🔧 Pas cu pas

### 1. Crearea proiectului Supabase

1. **Intră în** [Supabase Dashboard](https://app.supabase.com)
2. **Click pe** "New Project"
3. **Completează**:
   - **Organization**: Selectează sau creează o organizație
   - **Project Name**: `swaply` (sau alt nume)
   - **Database Password**: Alege o parolă sigură (salvează-o!)
   - **Region**: Alege cel mai apropiat de utilizatori (ex: Europe West)
4. **Click pe** "Create new project"
5. **Așteaptă** ~2-3 minute până se creează

### 2. Găsirea variabilelor de mediu

După crearea proiectului:

1. **Navighează la** Settings → API
2. **Găsește și copiază**:
   ```
   Project URL: https://your-project-ref.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. Configurarea pentru Development (.env.local)

În directorul proiectului, creează fișierul `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional - pentru dezvoltare locală
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**⚠️ Înlocuiește** `your-project-ref` și cheia cu valorile tale reale!

### 4. Deployment-ul bazei de date

În Supabase Dashboard:

1. **Navighează la** SQL Editor
2. **Execută** fișierele în ordine:
   ```sql
   -- 1. schema-complete.sql (din database/ folder)
   -- 2. rls-policies.sql
   -- 3. functions-triggers.sql  
   -- 4. seed-data.sql
   ```

### 5. Configurarea pentru Producție (Vercel)

#### În Vercel Dashboard:

1. **Intră în** proiectul tău Swaply
2. **Settings** → **Environment Variables**
3. **Adaugă** variabilele:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project-ref.supabase.co
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
```

4. **Save** și **Redeploy**

#### Sau prin CLI:

```bash
# Instalează Vercel CLI dacă nu ai
npm i -g vercel

# Setează variabilele
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Redeploy
vercel --prod
```

## ✅ Testarea configurației

### 1. Local Development

```bash
npm run dev
```

Verifică în browser console că nu mai apar erori Supabase.

### 2. Production Testing

1. **Încearcă** să te înregistrezi cu `pmelinte@gmail.com`
2. **Verifică** că nu mai apare eroarea "A apărut o eroare neașteptată"
3. **Testează** autentificarea și navigarea

## 🐛 Troubleshooting

### Eroare: "Invalid API key"
- ✅ Verifică că ai copiat cheia anon corect
- ✅ Asigură-te că nu ai spații extra

### Eroare: "fetch is not defined"
- ✅ Verifică că URL-ul Supabase este corect
- ✅ Testează URL-ul în browser

### Utilizatorul nu se poate înregistra
- ✅ Verifică că RLS policies sunt aplicate
- ✅ Asigură-te că trigger-ul pentru profile creation funcționează

### Build errors în Vercel
- ✅ Verifică că toate variabilele sunt setate pentru toate environment-urile
- ✅ Redeploy după setarea variabilelor

## 📞 Ajutor suplimentar

### Comenzi utile pentru debugging:

```bash
# Verifică variabilele locale
cat .env.local

# Testează conexiunea Supabase
npm run dev
# Apoi în browser console: 
# console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

# Forțează un rebuild complet
rm -rf .next
npm run build
```

### Log-uri Supabase:

1. **Dashboard** → **Logs** → **API**
2. Caută erori în timpul înregistrării utilizatorului

### Verificarea bazei de date:

```sql
-- Verifică că tabelele există
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verifică trigger-ele
SELECT * FROM information_schema.triggers;

-- Testează profilul utilizatorului
SELECT * FROM auth.users WHERE email = 'pmelinte@gmail.com';
SELECT * FROM public.user_profiles WHERE email = 'pmelinte@gmail.com';
```

---

## 🎯 Rezultat așteptat

După configurare:
- ✅ Aplicația funcționează local cu `npm run dev`
- ✅ Înregistrarea utilizatorilor funcționează
- ✅ Autentificarea persistă între refresh-uri
- ✅ Deployment-ul în producție funcționează
- ✅ Nu mai apar erori în console