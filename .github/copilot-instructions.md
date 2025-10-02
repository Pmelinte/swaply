# Swaply - Copilot Instructions

## Architecture Overview

This is a **Next.js 15** house swapping platform with **App Router**, **Supabase** authentication, and **TailwindCSS**. The app facilitates home exchanges between users with dual language support (Romanian primary, English secondary).

## Key Conventions

### Route Structure
- **Route Groups**: Use `(auth)` for authentication pages, `(main)` for app pages with bottom navigation
- **Layout Hierarchy**: Root layout → ClientLayout → route group layouts (e.g., `(main)/layout.tsx` adds BottomNav)
- **File Structure**: Follow `app/[route]/page.tsx` pattern, avoid nested routing unless necessary

### Internationalization
- **Context-based i18n**: Use `useI18n()` hook from `@/lib/i18n` for translations
- **Cookie persistence**: Language preference stored in cookies, not URL-based routing
- **JSON structure**: Organize translations as `{ "section": { "key": "value" } }` in `src/locales/`
- **Default language**: Romanian (`ro`) is primary, English (`en`) is secondary

### Supabase Integration
- **Client vs Server**: Use `getBrowserSupabase()` for client components, `getServerSupabase()` for server components/pages
- **Middleware pattern**: Session refresh handled in `middleware.ts` for route protection
- **Auth helpers**: Leverage `@supabase/auth-helpers-nextjs` for Next.js integration

### Authentication Patterns
- **Server Actions**: Use `"use server"` with `getServerSupabase()` for signup/login (see `src/app/(auth)/signup/actions.ts`)
- **OAuth Callback**: Dedicated route handler at `auth/callback/route.ts` for code-to-session exchange
- **Logout**: POST route handler at `logout/route.ts` with redirect
- **Error Handling**: Use query params for error/success messages in redirects
- **Session Management**: Middleware automatically refreshes sessions on each request

### Database Patterns
- **Schema Validation**: Use Zod schemas for server-side validation before DB operations (see `src/app/swap/new/actions.ts`)
- **User Auth Check**: Always verify `supabase.auth.getUser()` before database mutations
- **Table Structure**: `swaps` table with `user_id`, `title`, `description`, `category`, `location`, `images` (JSON array)
- **Images**: Store Cloudinary URLs as JSON array (max 6 images per swap)
- **Error Handling**: Redirect with encoded error messages in query params on DB failures

### Form Patterns
- **Server Actions**: Use `formAction={actionFunction}` directly on form buttons, not onSubmit
- **Zod Validation**: Define schemas separately, use `safeParse()` for server-side validation
- **FormData Processing**: `Object.fromEntries(formData)` to convert FormData to object
- **Native HTML Forms**: Standard HTML forms, not React Hook Form library
- **Error Handling**: Redirect with query params on validation/submission errors

### State Management
- **Context for Global State**: React Context for i18n (see `src/lib/i18n/context.tsx`)
- **Custom Hooks**: `useI18n()` pattern for accessing context with error boundaries
- **Cookie Persistence**: Language preference stored in cookies, not localStorage
- **Provider Pattern**: Wrap app in providers via `ClientLayout` component
- **Local State**: Use `useState` for component-specific state, avoid external stores

### Component Patterns
- **Client boundaries**: Use `'use client'` directive for interactive components and context providers
- **Type safety**: Export TypeScript interfaces for component props (e.g., `{{ComponentName}}Props`)
- **Styling**: TailwindCSS with utility-first approach, responsive design patterns

## Code Generation Commands

```bash
# Use Plop generators for consistent code structure
npm run plop page      # Creates app/[name]/page.tsx
npm run plop component # Creates src/components/[Name].tsx  
npm run plop hook      # Creates custom React hook
npm run plop api       # Creates app/api/[name]/route.ts
```

## Development Workflow

```bash
# Primary commands
npm run dev         # Development server
npm run check       # TypeScript + ESLint validation
npm run build       # Production build

# Code quality (enforced in CI)
npm run typecheck   # TypeScript validation only
npm run lint        # ESLint with max-warnings=0
```

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_preset
```

## Build Considerations

- **TypeScript**: Build errors are ignored (`ignoreBuildErrors: true`) for deployment flexibility
- **ESLint**: Ignored during builds, but enforced in development and CI
- **Images**: Cloudinary integration for remote image optimization
- **Redirects**: Handle legacy URLs (e.g., `/loghin` → `/login`)