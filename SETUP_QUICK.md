# 🚀 Setup Quick Swaply

## Problem: "A apărut o eroare neașteptată"

Această eroare apare pentru că folosești valori DEMO pentru Supabase. Iată cum rezolvi:

## ⚡ Soluție Rapidă

### 1. Creează proiect Supabase
1. Mergi la [supabase.com](https://supabase.com)
2. Sign in cu GitHub
3. "New Project" → Alege "swaply" ca nume
4. Alege regiunea Europa (Frankfurt)
5. Generează parolă random și salvează-o

### 2. Configurează Database
În SQL Editor din Supabase Dashboard, execută în ordine:

```sql
-- 1. Schema principal
```
-- Copia tot conținutul din database/schema-complete.sql

```sql
-- 2. Politici de securitate  
```
-- Copia tot conținutul din database/rls-policies.sql

```sql
-- 3. Funcții și triggers
```
-- Copia tot conținutul din database/functions-triggers.sql

```sql
-- 4. Date inițiale (opțional)
```
-- Copia conținutul din database/seed-data.sql

### 3. Actualizează Environment Variables

Din Project Settings → API în Supabase Dashboard, copiază:

**Project URL** (ex: `https://abcdefgh.supabase.co`)  
**anon public key** (începe cu `eyJhbGciOiJIUz...`)

### 4. Actualizează .env.local

```bash
# Environment Variables pentru Swaply - Local Development

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration - PRODUCTION VALUES
NEXT_PUBLIC_SUPABASE_URL=https://PROIECTUL-TAU.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary Configuration - DEMO VALUES (funcțional pentru teste)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=demo
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=demo
```

### 5. Restart Development Server

```bash
npm run dev
```

### 6. Test Signup

Acum încearcă din nou signup cu `pmelinte@gmail.com`.

## 🔧 Alternativă: Folosește demo database

Dacă nu vrei să configurezi Supabase acum, pot seta un mock pentru testing local:

```bash
# Rulează mock server
npm run mock:database
```

## 📋 Checklist

- [ ] Proiect Supabase creat
- [ ] Schema executată (schema-complete.sql)
- [ ] RLS policies execuate (rls-policies.sql)  
- [ ] Functions execuate (functions-triggers.sql)
- [ ] Environment variables actualizate
- [ ] Server restartat
- [ ] Test signup realizat

## 🆘 Suport

Dacă întâmpini probleme:
1. Verifică Console în browser (F12)
2. Verifică Terminal pentru erori
3. Confirmă că toate env vars sunt setate