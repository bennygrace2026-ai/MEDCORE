# Medcore Academy - Deployment & Environment Configuration

This document contains the credentials, environment configuration, and instructions for deploying the application to Netlify, Render, Railway, or VPS.

---

## 🔑 Configured Supabase Credentials

The application is pre-configured with the following Supabase parameters:

| Variable | Value |
| :--- | :--- |
| **`SUPABASE_URL`** | `https://sdpjxnmzxgpsxovpbwnk.supabase.co` |
| **`SUPABASE_ANON_KEY`** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcGp4bm16eGdwc3hvdnBid25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTk5NDgsImV4cCI6MjEwNTQzNTk0OH0.vLfrhk_GI_xWWCPmFrIEr3z5kBOyOUUyDZiHhh8xHRs` |
| **`SUPABASE_DATABASE_URL`** | `postgresql://postgres:chimuanya2001@db.sdpjxnmzxgpsxovpbwnk.supabase.co:5432/postgres` |
| **`JWT_SECRET`** | `chimuanya2001` |

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
   - The variables are already pre-loaded into `netlify.toml` and `.env`.
   - Optionally verify under **Site configuration** ➡️ **Environment variables**:
     - `SUPABASE_DATABASE_URL`: `postgresql://postgres:chimuanya2001@db.sdpjxnmzxgpsxovpbwnk.supabase.co:5432/postgres`
     - `SUPABASE_URL`: `https://sdpjxnmzxgpsxovpbwnk.supabase.co`
     - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - `JWT_SECRET`: `chimuanya2001`
5. **Deploy**:
   - Click **Deploy Site**.
   - Netlify will build the client and deploy the serverless functions (`/.netlify/functions/api`).
   - The redirect rule in `netlify.toml` forwards `/api/*` requests to the serverless function.
