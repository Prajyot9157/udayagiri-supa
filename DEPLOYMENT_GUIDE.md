# EduFlow Pro - Deployment & Storage Guide

## Architecture Overview
This application has been successfully migrated to **Supabase** backend while strictly preserving the existing UI design. It's built as a Single Page Application (SPA) using React, Vite, and TailwindCSS.

### File Mapping
The requested files have been mapped directly into a modern, production-ready React application:
- `index.html` → Compiled to `dist/index.html` (Served by Vite)
- `admin.html` → Accessible via `/admin`
- `viewer.html` → Accessible via `/viewer`
- `styles.css` → Compiled cleanly via Tailwind into standard global CSS.
- `app.js / viewer.js / admin.js` → Automatically bundled and minified by Vite in `src/pages`.
- `supabase.js` → Located at `src/lib/supabase.ts`
- `schema.sql` → Located at the project root `schema.sql`

## 1. Storage Setup Guide (Supabase)
To enable the PDF upload feature, you must configure a Storage Bucket in your Supabase project.

1. Go to your Supabase Project Dashboard.
2. Navigate to **Storage** on the left menu.
3. Click **New Bucket**.
4. Name the bucket precisely: `pdfs`
5. Enable **Public bucket** toggle.
6. Check **"Allowed MIME types"** to be `application/pdf` (optional for extra security).
7. Save.
8. The RLS policies for storage and row level security for tables have already been generated for you in `schema.sql`.

## 2. Environment Variables Setup
In your Supabase Dashboard, go to **Project Settings > API** to find your keys.
Add these variables to your `.env` (or pass them into your hosting provider):
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
``` 
Without these, the fallback keys encoded in the code are used (the placeholders you requested).

## 3. Deployment Guide (Vercel / Netlify / AI Studio / Firebase Hosting)

Since it is a modern React/Vite application, deployment is fully automated. 

### Deploying to Vercel/Netlify
1. Connect your GitHub repository to Vercel or Netlify.
2. Select your repository.
3. Set the Build Command to: `npm run build`
4. Set the Publish Directory to: `dist`
5. *Important*: Set up URL rewrites for SPA routing. In Netlify, add a `_redirects` file in your `public` directory with: `/* /index.html 200`. In Vercel, this is handled automatically if framework is set to Vite.

### Accessing live routes
- **Student App**: `https://your-domain.com/`
- **Admin Panel**: `https://your-domain.com/admin`
- **PDF Viewer**: `https://your-domain.com/viewer`

Enjoy your professional, fully-functional EdTech platform! Everything is integrated precisely with Row Level Security, Storage, and Realtime sync built immediately in.
