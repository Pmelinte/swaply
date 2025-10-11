# Vercel Deployment Guide - Swaply

## 🚀 Quick Deploy Steps

### 1. Pre-Deployment Checklist

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run typecheck

# Check for linting errors
npm run lint
```

### 2. Vercel Dashboard Setup

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository: `Pmelinte/swaply`

2. **Configure Project:**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Development Command: npm run dev
   ```

3. **Environment Variables:**
   Add these in Vercel Dashboard → Settings → Environment Variables:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset

   # Site URL (will be updated after first deploy)
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   ```

### 3. Deploy

Click **"Deploy"** button!

---

## 🔧 Post-Deployment Configuration

### 1. Update Site URL
After first deployment, you'll get a Vercel URL like: `https://swaply-xxx.vercel.app`

**Update environment variable:**
```env
NEXT_PUBLIC_SITE_URL=https://swaply-xxx.vercel.app
```

**Redeploy:**
- Vercel → Your Project → Deployments → Redeploy latest

### 2. Update Supabase Configuration

Go to [Supabase Dashboard](https://app.supabase.com) → Your Project:

#### Authentication → URL Configuration:
```
Site URL: https://swaply-xxx.vercel.app
Redirect URLs:
  - https://swaply-xxx.vercel.app/auth/callback
  - https://swaply-xxx.vercel.app
  - https://swaply-xxx.vercel.app/**
```

### 3. Update OAuth Providers (if configured)

#### Google Cloud Console:
- Authorized JavaScript origins: Add `https://swaply-xxx.vercel.app`
- Authorized redirect URIs: Add `https://[your-supabase-project].supabase.co/auth/v1/callback`

#### Facebook Developers:
- Valid OAuth Redirect URIs: Add `https://[your-supabase-project].supabase.co/auth/v1/callback`

#### Apple Developer:
- Return URLs: Add `https://[your-supabase-project].supabase.co/auth/v1/callback`

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

### Production Deployments:
- Push to `main` or `vercel-fresh-deploy` branch → auto-deploy to production

### Preview Deployments:
- Push to any other branch → auto-deploy to preview URL
- Each PR gets its own preview URL

### Manual Redeploy:
```bash
# From Vercel Dashboard
Deployments → Select deployment → Redeploy
```

---

## 🎯 Custom Domain (Optional)

### 1. Add Domain in Vercel:
- Vercel Dashboard → Your Project → Settings → Domains
- Add domain: `swaply.ro` (example)

### 2. Configure DNS:
Add these records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Update Environment Variables:
```env
NEXT_PUBLIC_SITE_URL=https://swaply.ro
```

### 4. Update Supabase & OAuth:
- Update all redirect URLs to use new domain
- Redeploy

---

## 📊 Monitoring

### Vercel Analytics:
- Dashboard → Your Project → Analytics
- Monitor page views, performance, errors

### Vercel Logs:
- Dashboard → Your Project → Deployments → Select deployment → Logs
- Real-time logs during build and runtime

### Error Tracking:
Consider integrating:
- [Sentry](https://sentry.io) for error tracking
- [LogRocket](https://logrocket.com) for session replay

---

## ⚙️ Advanced Configuration

### vercel.json (already configured):
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "redirects": [
    {
      "source": "/loghin",
      "destination": "/login",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Environment Variables per Environment:
- **Production**: Used for `main` branch deployments
- **Preview**: Used for other branches
- **Development**: Only available locally

---

## 🐛 Troubleshooting

### Build Fails:
```bash
# Check locally first
npm run build

# Common issues:
# - TypeScript errors (check with npm run typecheck)
# - Missing environment variables
# - Import errors
```

### Runtime Errors:
1. Check Vercel logs
2. Verify environment variables are set
3. Check Supabase connection
4. Verify API routes are accessible

### Redirect Issues:
1. Verify `NEXT_PUBLIC_SITE_URL` is correct
2. Check Supabase redirect URLs
3. Verify OAuth provider redirect URIs

---

## 📈 Performance Optimization

### Image Optimization:
- Next.js automatically optimizes images
- Use `<Image>` component from `next/image`
- Cloudinary handles remote images

### Caching:
- Vercel automatically caches static assets
- Set cache headers in `next.config.ts` if needed

### Edge Functions:
- Middleware runs on Vercel Edge (already configured)
- Ultra-fast session refresh

---

## 🔒 Security

### Environment Variables:
- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel Dashboard to manage secrets
- ✅ Rotate keys regularly

### Headers:
- ✅ Security headers already configured in `vercel.json`
- ✅ HTTPS enforced automatically by Vercel

### Database:
- ✅ Supabase RLS policies protect data
- ✅ Only use `SUPABASE_ANON_KEY` in frontend (never service role key)

---

## ✅ Final Checklist

Before going live:

- [ ] Test build locally (`npm run build`)
- [ ] All environment variables configured in Vercel
- [ ] Supabase redirect URLs updated
- [ ] OAuth providers updated (if applicable)
- [ ] Custom domain configured (if applicable)
- [ ] Test all auth flows on production URL
- [ ] Monitor Vercel logs for first few days
- [ ] Set up error tracking (Sentry recommended)

---

## 📞 Support

### Vercel Support:
- [Vercel Docs](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)

### Next.js Issues:
- [Next.js Docs](https://nextjs.org/docs)
- [GitHub Issues](https://github.com/vercel/next.js/issues)

### Supabase Issues:
- [Supabase Docs](https://supabase.com/docs)
- [Discord Community](https://discord.supabase.com)
