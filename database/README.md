# 🗄️ Supabase Database Setup

Acest director conține toate fișierele necesare pentru configurarea completă a bazei de date Supabase pentru aplicația Swaply.

## 📋 Fișiere incluse

### 1. `schema-complete.sql`
- **Scop**: Structura completă a bazei de date
- **Conține**: 
  - 8 tabele principale (profiles, objects, categories, etc.)
  - Tipuri ENUM pentru status-uri și condiții
  - Indecși pentru performanță optimă
  - Constrainte și validări

### 2. `rls-policies.sql`
- **Scop**: Politici Row Level Security (RLS)
- **Conține**:
  - Politici de acces pentru toate tabelele
  - Protecție a datelor utilizatorilor
  - Permisiuni granulare pe operații CRUD

### 3. `functions-triggers.sql`
- **Scop**: Funcții și trigger-e automate
- **Conține**:
  - Crearea automată a profilului la înregistrare
  - Actualizarea automată a rating-urilor
  - Gestionarea statisticilor de swap
  - Notificări automate

### 4. `seed-data.sql`
- **Scop**: Date inițiale pentru aplicație
- **Conține**:
  - Sistemul complet de categorii
  - Subcategorii organizate ierarhic
  - Setări de aplicație
  - Date de configurare

## 🚀 Instrucțiuni de deployment

### Opțiunea 1: Manual în Supabase Dashboard

1. **Accesează** [Supabase Dashboard](https://app.supabase.com)
2. **Selectează** proiectul tău
3. **Navighează** la "SQL Editor"
4. **Execută** fișierele în următoarea ordine:

```sql
-- 1. Primul: schema-complete.sql
-- Creează toate tabelele și structura

-- 2. Al doilea: rls-policies.sql  
-- Aplică politicile de securitate

-- 3. Al treilea: functions-triggers.sql
-- Adaugă funcțiile automate

-- 4. Al patrulea: seed-data.sql
-- Populează cu date inițiale
```

### Opțiunea 2: Folosind scriptul de deployment

```bash
# Rulează scriptul pentru a vedea conținutul
node database/deploy.js

# Sau folosește PowerShell pe Windows
.\database\migrate.ps1
```

## ⚙️ Configurarea Environment Variables

După deployment-ul bazei de date, configurează aceste variabile:

### În Vercel (Producție):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### În .env.local (Development):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🔐 Caracteristici de securitate

### Row Level Security (RLS)
- **Activat** pe toate tabelele
- **Utilizatorii** pot accesa doar propriile date
- **Datele publice** (categorii, obiecte) sunt vizibile tuturor
- **Conversațiile** sunt private între participanți

### Protecții implementate:
- ✅ Utilizatorii pot edita doar propriul profil
- ✅ Obiectele pot fi modificate doar de proprietar
- ✅ Cererile de swap sunt vizibile doar părților implicate
- ✅ Mesajele sunt private în conversații
- ✅ Notificările sunt personale pentru fiecare user

## 📊 Structura bazei de date

```
profiles (utilizatori)
├── objects (obiecte pentru swap)
├── swap_requests (cereri de schimb)
├── conversations (conversații)
│   └── messages (mesaje)
├── notifications (notificări)
├── user_favorites (favorite)
├── reviews (recenzii)
└── categories (categorii)
    └── subcategories (subcategorii)
```

## 🔄 Trigger-e automate

### 1. Crearea profilului
- Se activează automat la înregistrarea unui user nou
- Copiază datele din `auth.users` în `public.profiles`

### 2. Actualizarea rating-ului
- Recalculează automat rating-ul la fiecare recenzie nouă
- Updatează statisticile de swap

### 3. Gestionarea conversațiilor
- Creează automat conversații pentru swap request-uri
- Actualizează timestamp-ul ultimului mesaj

### 4. Notificări automate
- Trimite notificări pentru evenimente importante
- Match-uri, mesaje noi, cereri de swap

## 🧪 Testarea deployment-ului

După deployment, testează următoarele:

1. **Înregistrarea utilizatorului**
   ```sql
   SELECT * FROM profiles WHERE email = 'test@example.com';
   ```

2. **Categoriile**
   ```sql
   SELECT * FROM categories WHERE parent_id IS NULL;
   ```

3. **RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

4. **Funcțiile**
   ```sql
   SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
   ```

## 🐛 Troubleshooting

### Eroarea "relation does not exist"
- **Cauza**: Schema nu a fost aplicată complet
- **Soluția**: Re-execută `schema-complete.sql`

### Eroarea "permission denied"
- **Cauza**: RLS policies nu sunt configurate corect
- **Soluția**: Verifică și re-aplică `rls-policies.sql`

### Trigger-ele nu funcționează
- **Cauza**: Funcțiile nu sunt create
- **Soluția**: Execută `functions-triggers.sql`

## 📞 Support

Pentru probleme cu deployment-ul:
1. Verifică log-urile în Supabase Dashboard
2. Testează fiecare fișier SQL individual
3. Asigură-te că ordinea de execuție este respectată

---

**🎯 Rezultat așteptat**: O bază de date complet funcțională, securizată și optimizată pentru aplicația Swaply!