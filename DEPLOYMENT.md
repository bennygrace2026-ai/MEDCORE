# Medcore Academy - Deployment & Environment Configuration

This document contains the credentials, environment configuration, and instructions for deploying the application to Netlify, Render, Railway, or VPS.

---

## 🔑 Configured Supabase Credentials

Configure the following environment variables in your Netlify Site Settings (**Site Configuration ➡️ Environment Variables**):

| Variable | Description |
| :--- | :--- |
| **`SUPABASE_URL`** | Your Supabase project URL (e.g. `https://<project-ref>.supabase.co`) |
| **`SUPABASE_ANON_KEY`** | Your Supabase anon public API key |
| **`SUPABASE_DATABASE_URL`** | Your Supabase PostgreSQL connection string |
| **`JWT_SECRET`** | Secret key for signing authentication JWT tokens |

---

## 👥 Seeded Default Accounts

Once deployed, the following accounts are pre-seeded in the database:

### 1. Super Administrator
- **Email**: `bennygrace2026@gmail.com`
- **Password**: `chimuanya2001`
- **Portal URL**: `/super-admin/login`

### 2. Regular Administrator
- Configured through the Super Admin panel.
- **Portal URL**: `/admin/login`

### 3. Student Demo Account
- **Email**: `student@medcore.com`
- **Password**: `chimuanya2001`
- **Portal URL**: `/login`

---

## 🚀 Netlify Deployment Guide

1. **Push to GitHub**: Push this repository to your GitHub account.
2. **Connect to Netlify**:
   - In Netlify, click **"Add new site"** ➡️ **"Import an existing project"**.
   - Select your GitHub repository.
3. **Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. **Environment Variables**:
   - Set the following variables under **Site configuration** ➡️ **Environment variables**:
     - `SUPABASE_DATABASE_URL`: `postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres`
     - `SUPABASE_URL`: `https://<project-ref>.supabase.co`
     - `SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
     - `JWT_SECRET`: `<your-jwt-secret>`
5. **Deploy**:
   - Click **Deploy Site**.
   - Netlify will build the client and deploy the serverless functions (`/.netlify/functions/api`).
   - The redirect rule in `netlify.toml` forwards `/api/*` requests to the serverless function.
