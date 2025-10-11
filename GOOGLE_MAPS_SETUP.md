# 🗺️ Google Maps Setup Guide

## Obținere API Key Gratuit

### Pasul 1: Creează Proiect Google Cloud
1. Mergi la [Google Cloud Console](https://console.cloud.google.com/)
2. Click pe dropdown-ul de proiecte (lângă logo-ul Google Cloud)
3. Click pe "NEW PROJECT"
4. Nume proiect: `Swaply Maps`
5. Click "CREATE"

### Pasul 2: Enable Maps JavaScript API
1. În meniul din stânga, mergi la **APIs & Services** → **Library**
2. Caută "Maps JavaScript API"
3. Click pe "Maps JavaScript API"
4. Click pe butonul "ENABLE"

### Pasul 3: Creează API Key
1. În meniul din stânga, mergi la **APIs & Services** → **Credentials**
2. Click pe "CREATE CREDENTIALS" (sus)
3. Selectează "API Key"
4. **API Key-ul tău a fost creat!** → Copiază-l

### Pasul 4: Restricționează API Key (IMPORTANT pentru securitate)
1. După ce ai copiat key-ul, click pe "RESTRICT KEY"
2. **Application restrictions:**
   - Selectează "HTTP referrers (web sites)"
   - Add referrer:
     - `http://localhost:3000/*` (pentru development)
     - `https://yourdomain.com/*` (pentru production)
3. **API restrictions:**
   - Selectează "Restrict key"
   - Bifează doar:
     - ✅ Maps JavaScript API
     - ✅ Places API (opțional, pentru search)
     - ✅ Geocoding API (opțional, pentru addresses)
4. Click "SAVE"

### Pasul 5: Adaugă în .env.local
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_actual_key_here
```

### Pasul 6: Restart Development Server
```bash
# Oprește serverul (Ctrl+C)
npm run dev
```

## 💰 Pricing & Limite

### Plan Gratuit (Sufficient pentru development):
- **$200 credit gratuit lunar**
- **28,000 map loads / lună** (gratuit)
- **100,000 API calls / zi** (gratuit pentru teste)

### Pentru Production:
- Maps JavaScript API: **$7 per 1,000 loads**
- După ce depășești creditul gratuit
- Poți seta limite de billing în Google Cloud Console

## 🔒 Securitate

### Recomandări IMPORTANTE:
1. ✅ **Restricționează API key-ul** la domeniul tău
2. ✅ **NU expune key-ul** în cod public (folosește .env.local)
3. ✅ **Setează billing limits** în Google Cloud Console
4. ✅ **Monitorizează usage-ul** săptămânal

### Dacă API Key-ul a fost compromis:
1. Mergi la [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click pe key-ul compromis
3. Click "REGENERATE KEY"
4. Actualizează .env.local cu noul key

## 🧪 Testare Fără API Key

Componenta `RealGoogleMap` va afișa un mesaj informativ dacă API key-ul lipsește:
- Hartă de fallback cu markere SVG
- Instrucțiuni pentru obținere API key
- Link direct la documentație

## 📚 Documentație

- [Google Maps Platform](https://developers.google.com/maps)
- [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

## ❓ Troubleshooting

### Eroare: "This API project is not authorized..."
**Soluție:** Enable "Maps JavaScript API" în Google Cloud Console

### Eroare: "RefererNotAllowedMapError"
**Soluție:** Adaugă `http://localhost:3000/*` în HTTP referrers restrictions

### Eroare: "ApiTargetBlockedMapError"
**Soluție:** Remove API restrictions sau add "Maps JavaScript API" to allowed APIs

### Harta nu se încarcă
1. Verifică că API key-ul e corect în `.env.local`
2. Restart development server (`npm run dev`)
3. Clear browser cache (`Ctrl + Shift + Delete`)
4. Check browser console pentru erori

## 🚀 Production Deployment

Pentru Vercel/Production:
1. Mergi la project settings în Vercel Dashboard
2. Add Environment Variable:
   - Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: `your_production_api_key`
3. Actualizează API Key restrictions:
   - Add production domain: `https://swaply.vercel.app/*`

---

**Timp estimat setup:** 5-10 minute  
**Cost lunar pentru ~1000 users:** $0 (sub limita gratuită)  
**Dificultate:** 🟢 Ușor
