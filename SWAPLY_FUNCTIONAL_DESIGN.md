# SWAPLY FUNCTIONAL DESIGN — versiune completă
**Data:** 2025-10-07  
**Titlu:** *Swaply – Platformă globală de schimburi inteligente cu AI și traducere universală*

---

## 🌍 Context general
Swaply este o aplicație web și mobilă pentru **schimburi de obiecte** între utilizatori, cu un sistem **AI** integrat pentru **clasificare imagine/text, potrivire (matching), traducere universală, logistică (curieri/hărți) și recomandări**. Arhitectura UI este inspirată din aplicațiile „bancare/sociale": bară de navigație jos (5 taburi), meniu sus-dreapta (⋯), gesturi (swipe), conținut personalizat după starea de **login**.

---

## 🔧 Elemente globale

### 1) Bară jos (5 taburi: **Home · Obiecte · Matching · Chat · Info**)
- **Logat:** conținut personalizat; badge-uri (mesaje/notificări).  
- **Nelogat:** versiuni demo + CTA Login/Signup.
- **Scop:** orientare constantă, 1-tap către fluxurile cheie.
- **Dacă lipsește:** navigație fragmentată, scădere conversie.
- **Limite:** max 5 taburi; badge ≤ 99+.
- **Backend:** store global (auth, counts) + SSR/CSR routing.
- **DB:** `users_sessions`, `notifications`, `unread_counts`.
- **API:** endpoint intern pentru counts (SWR revalidate).

### 2) Meniu sus-dreapta (⋯)
- **Logat:** Logout, Limba, Notificări, Preferințe AI, Ajutor, Mod întunecat.
- **Nelogat:** Login/Signup vizibile.
- **Scop:** setări rare, notificări și preferințe într-un loc.
- **Dacă lipsește:** UI încărcat; opțiuni dispersate.
- **Limite:** 6–7 opțiuni; submeniuri la nevoie.
- **Backend:** token session; salvare preferințe.
- **DB:** `user_settings(lang, theme, ai_prefs)`, `notifications`.
- **API:** i18n (`next-intl`/`i18next`), Web Push/FCM.

### 3) Căutare globală (overlay)
- **Logat:** căutare semantică în obiecte publice + potriviri personale.
- **Nelogat:** căutare doar în demo/trending.
- **Scop:** „Descoperă" ca pattern global, nu pagină separată.
- **Dacă lipsește:** descoperire greoaie, bounce ridicat.
- **Limite:** rate-limit; fallback la keyword dacă embeddings indisponibil.
- **Backend:** endpoint hibrid (text + vector); caching rezultate.
- **DB:** `objects`, `object_categories`, `locations`, `object_vectors`.
- **API:** embeddings (HuggingFace/SentenceTransformers), geocoding (Mapbox/Google).

### 4) Reclame personalizate (AdSlotTop / AdSlotInline / AdSlotBottom)
- **Logat:** contextuale pe categorie/locație/comportament (agregat, fără PII).
- **Nelogat:** contextuale pe conținutul paginii.
- **Scop:** monetizare, cross-promo relevantă.
- **Dacă lipsește:** pierdere venituri/parteneriate.
- **Limite:** fără reclame în input; 1 ad „above the fold"; CMP consimțământ.
- **Backend:** ad-decision service (frequency capping).
- **DB:** `ad_impressions`, `ad_clicks`, `ad_targets` (non-PII).
- **API:** Google Ad Manager/Prebid sau intern; CMP (IAB TCF v2).

### 5) SEO contextual (SSR + JSON-LD)
- **Logat:** SEO doar pe conținut public; privat = `noindex`.
- **Nelogat:** SEO complet pentru landing/liste publice.
- **Scop:** trafic organic, sharing corect.
- **Dacă lipsește:** vizibilitate scăzută.
- **Limite:** fără PII; `canonical`/`hreflang` corecte; sitemaps separate.
- **Backend:** generare `metadata`/`openGraph` per pagină.
- **DB:** `objects_public`, `categories`.
- **API:** schema.org JSON‑LD (Product/Offer/ItemList/Conversation/Organization).

---

## 🌐 Multilingvism (i18n global dinamic — **fără „limbi principale"**)
- **Orice limbă** suportată de AI/API este disponibilă dinamic (≈200+).  
- **UI (statice):** fișiere `/locales/{{lang}}.json`, fallback în EN, încărcare dinamică.  
- **Conținut utilizatori:** detectare limbă + traducere on‑demand (chat, descrieri).  
- **Texte AI:** generate în EN → traduse automat în limba utilizatorului (cache pe limbă).  
- **SEO:** `hreflang` dinamic pentru limbile cerute.  
- **API traduceri:** DeepL, Google Translate, Microsoft, modele NLLB (Meta).  
- **Tabel cache traduceri:** `translations(id, src, src_lang, dst_lang, dst, model, confidence, created_at)`.

---

## 🏠 Pagina 1 — Home
**Logat**  
- Salut personalizat; 3 acțiuni rapide: **Adaugă obiect · Potriviri · Cereri**.  
- Hartă „în apropiere" (pini cluster) + feed **„Pentru tine"** (AI).  

**Nelogat**  
- Hero cu misiune + buton **Login/Signup** (2 pași sau Google/Facebook/Apple).  
- Hartă demo + carusel „Cum funcționează" + mini‑video.

**Scop**: introducere, orientare, explorare locală.  
**Dacă lipsește**: lipsă punct de pornire clar.  
**Limite**: geolocație doar cu consimțământ; feed limitat (10–20 iteme).  
**Backend**: feature flags; prefetch feed; A/B copy.  
**DB**: `objects_public`, `users_public`, `geo_cache`.  
**API**: Mapbox/Google Maps, AI recomandări.  
**SEO**: titlu/descriere localizate; OpenGraph; JSON‑LD `ItemList`.  
**Ads**: Top=Premium; Inline=curieri; Bottom=parteneri locali.

---

## 🎒 Pagina 2 — Obiecte (Obiectele mele · Wishlist · Propuneri AI)
**Logat**  
- **Obiectele mele** (max 3 vizibile): [img/no‑image] titlu (AI), categorie (AI), **preț AI** în moneda locală, **scor matching**, bife **metodă schimb**.  
- **+ Adaugă obiect** (formular inline): upload Cloudinary / link → **HuggingFace** (titlu/categorie/descriere) → **Estimare preț AI** + conversie valută (ECB/BNR) → vizibilitate → metodă schimb.  
- **Wishlist** (max 3) — aceleași câmpuri.  
- **Propuneri AI** (feed 1‑card cu swipe): Dreapta=Accept, Stânga=Respinge, Sus=Atenție; după Accept → **slider interes 0–100**.

**Nelogat**  
- Carduri demo + CTA login.

**Scop**: centru de creare/gestionare și de instruire a AI‑ului.  
**Dacă lipsește**: feed/matching rămân fără sursă de date.  
**Limite**: imagine obligatorie (fallback `no-image.png`); max 10 obiecte active/user; preț AI refresh 48 h; metodă schimb obligatorie.  
**Backend**: pipeline upload → Cloudinary → clasificare AI → DB; cron valută/prețuri.  
**DB**: `objects(id,user_id,title,description,category,price_ai,currency,method,visibility,status,created_at)`, `object_images`, `wishlists`, `ai_prices`, `object_vectors`.  
**API**: HuggingFace (clasificare/zero‑shot), Cloudinary, ECB/BNR.  
**SEO**: `ItemList` public (fără date private).  
**Ads**: Top=ambalare/curieri; Inline=categorii relevante; Bottom=cross‑sell.

---

## 🔗 Pagina 3 — Matching
**Logat**  
- Lot **5–10** obiecte propuse (imagine, titlu, **scor potrivire**, **preț AI**, **distanță**).  
- Butoane: **Acceptă matching cu <user>**, **Alege metoda de schimb** (Local/Regional/Vacanță/Curier), **☑ Acord transport** (ambii obligatoriu).  
- Secțiune **„În curs"** (așteaptă confirmare).

**Nelogat**  
- Demo + CTA login.

**Scop**: formarea perechilor compatibile cu acord logistic explicit.  
**Dacă lipsește**: nu există trecere spre Chat/Change Page.  
**Limite**: același obiect ≤ 3 apariții/zi / user; fără Chat fără „Acord transport"; timeout 48 h la inactivitate.  
**Backend**: job AI (embeddings text+imagine, **pgvector**); trigger `create_match`.  
**DB**: `matches(id,user_a,user_b,object_a,object_b,score,transport_agreed,method,status,created_at)`, `notifications`.  
**API**: HuggingFace embeddings/CLIP; geocoding Mapbox/Google.  
**SEO**: `noindex`; demo public separabil.  
**Ads**: Top=curieri; Inline=logistică/asigurare; Bottom=pick‑up local.

---

## 💬 Pagina 4 — Chat
**Logat**  
- Tabs: **Conversații** | **Notificări**.  
- Fereastră chat: text, emoticoane, **atașamente** (foto/video scurt/fișiere), **locație**, **contact**, **traducere instant**; **Tipărește (PDF)**; buton **„Deschide Change Page"**.

**Nelogat**  
- Demo chat + CTA login.

**Scop**: comunicare și coordonare între părți.  
**Dacă lipsește**: nu se pot finaliza detaliile schimbului.  
**Limite**: atașamente ≤ 10 MB; 20 mesaje/min; traduceri 10/zi (plan free).  
**Backend**: WebSocket (Supabase Realtime / Pusher); service traduceri; audit log.  
**DB**: `messages(id,match_id,sender_id,content,type,created_at)`, `attachments`, `translations`.  
**API**: Cloudinary (upload), DeepL/Google Translate, Mapbox (previzualizare locație).  
**SEO**: `noindex`; demo public opțional.  
**Ads**: Top=Siguranță la schimb; Bottom=parteneri.

---

## 🔄 Pagina 5 — Change Page (Rezumat înțelegerii)
**Logat**  
- Rezumat participanți + contact (după acord).  
- Submeniuri după metodă:  
  - **Local:** hartă, propuneri locuri, intervale, checklist întâlnire.  
  - **Curier:** cost/ETA, AWB, **sfaturi ambalare (AI)**, tracking.  
  - **Vacanță:** loc, perioadă, transport, cazare, **sugestii AI**, calendar comun.  
- Butoane: **Confirmă amândoi** / **Anulează** (motiv).  
- **Feedback obligatoriu** la final → rating & reputație.

**Nelogat**  
- Demo „Cum arată un schimb reușit".

**Scop**: finalizare logistică + feedback formal.  
**Dacă lipsește**: matching-ul rămâne informal; lipsesc metrici & reputație.  
**Limite**: fără feedback = suspendare rating până la completare; validări adresă; confirmare ambii înainte de închidere.  
**Backend**: integrări curieri; AI assistant; webhooks notificări.  
**DB**: `agreements(match_id,method,logistics_json,status)`, `feedback(match_id,from_user,to_user,rating,comment,created_at)`.  
**API**: DHL/DPD/FAN Courier, LLM pentru sfaturi, Mapbox (hărți).  
**SEO**: `noindex`; demo public.  
**Ads**: Inline=curieri/hoteluri; Bottom=asigurare colet.

---

## 👤 Pagina 6 — Info (Profil / Statistici / Plăți Premium)
**Logat**  
- Profil: avatar, bio, **rang**; vizibilitate granulară (public/prieteni/match).  
- Statistici:  
  - **User:** rating, punctualitate, dispute rezolvate.  
  - **Obiecte:** nr. listate, interes mediu, preț AI mediu.  
  - **Schimburi:** finalizate/în curs, timp mediu, **hărți** geografice.  
- Plăți: abonament Premium (Stripe/PayPal).  
- Export date / ștergere cont (GDPR).

**Nelogat**  
- Profil public minimal: avatar, oraș general, rating, obiecte publice.

**Scop**: reputație, administrare cont, monetizare.  
**Dacă lipsește**: fără istoric, progres, venituri premium.  
**Limite**: actualizare statistici zilnic; max 12 luni istoric; acces condiționat după intenție.  
**Backend**: cron agregare statistici; cache; integrare plăți.  
**DB**: `users`, `user_stats`, `payments`.  
**API**: Stripe/PayPal; Mapbox; AI insights.  
**SEO**: `Person/Organization` JSON‑LD pentru profiluri publice.  
**Ads**: Top=Upgrade Premium; Inline=parteneri; Bottom=oferte locale.

---

## 🧱 Modele de date (simplificare)
```sql
users(id, name, email, avatar, rank, lang, premium_until, created_at)
objects(id, user_id, title, description, category, price_ai, currency, method, visibility, status, created_at)
object_images(object_id, url)
wishlists(user_id, object_id, created_at)
object_vectors(object_id, embedding_vector) -- pgvector
ai_prices(object_id, amount, currency, source, refreshed_at)
matches(id, user_a, user_b, object_a, object_b, score, transport_agreed, method, status, created_at)
messages(id, match_id, sender_id, content, type, created_at)
attachments(message_id, url, type, size)
translations(id, source_text, source_lang, target_lang, translated_text, model, confidence, created_at)
agreements(match_id, method, logistics_json, status, updated_at)
feedback(match_id, from_user, to_user, rating, comment, created_at)
user_stats(user_id, objects_count, matches_done, rating_avg, last_active)
payments(user_id, provider, amount, status, created_at)
ad_impressions(id, user_id, ad_id, ts), ad_clicks(id, user_id, ad_id, ts)
```

## 🔁 Fluxuri tehnice majore

1. **Upload imagine → AI clasificare → Cloudinary → DB (objects)**
2. **Estimare preț AI + conversie valută → update ai_prices / objects**
3. **Matching AI (embeddings) → matches + notifications**
4. **Realtime Chat → messages + attachments + translations**
5. **Acord ambii → agreements → feedback → update user_stats**
6. **Cron zilnic → valută, statistici, curățare cache traduceri**

## 🧭 Wireframe logic (ASCII)
```
╔══════════════════════════════════════════════════════╗
║                     SWAPLY APP                       ║
╠══════════════════════════════════════════════════════╣
║ HEADER: [Logo]                                [⋯]    ║
║------------------------------------------------------║
║ BODY                                                 ║
║   AdSlotTop                                          ║
║   [Page content: carduri/hărți/liste/orizontale]     ║
║   AdSlotInline                                       ║
║   AdSlotBottom                                       ║
║------------------------------------------------------║
║ FOOTER NAV:  🏠  🎒  🔗  💬  👤                        ║
║              Home Obj Match Chat Info               ║
╚══════════════════════════════════════════════════════╝
```

## 🔒 Securitate, confidențialitate, GDPR

- Consimțământ explicit pentru geolocație, tracking ads, cookie-uri.
- Pseudonimizare, minimizare date; export/ștergere cont.
- Rate limiting, audit trail, protecție CSRF/XSS.
- Mod „no index" pentru pagini private; separare sitemaps.

## ♿ Accesibilitate & UX

- Contrast AA/AAA, etichete ARIA, focus vizibil.
- Taste/gesturi alternative; mărire text; cititor ecran.
- Micro-animații discrete, skeletons; haptics pe mobil.

## 🚀 Performanță & Observabilitate

- LCP < 3s, TTI < 2s; imagini optimizate; cache.
- Logging centralizat, metrics (RUM), tracing API.

## 🗺️ Roadmap (etape)

1. **App Shell** (bara jos, meniu ⋯, SEO/Ads/i18n schelet)
2. **Home + Obiecte** (upload + AI clasificare/preț)
3. **Matching + Propuneri AI** (swipe)
4. **Chat** (Realtime + traduceri + atașamente)
5. **Change Page** (Local/Curier/Vacanță) + Feedback
6. **Info** (profil, statistici, plăți Premium)

## 📚 Glosar

- **AI price:** estimare de valoare bazată pe modele + indicii de piață.
- **pgvector:** extensie Postgres pentru căutare vectorială (embeddings).
- **hreflang:** indicator pentru motoare de căutare privind limba/țara paginii.

## 🔗 Resurse generate

- **Wireframe ASCII:** SWAPLY_WIREFRAME_ASCII.txt
- **Diagrame PNG:** SWAPLY_UI_FLOW.png, SWAPLY_ARCH_FLOW.png