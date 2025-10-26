# FlacronAI Vercel Deployment Guide

## Why Vercel?

✅ **Better for React Apps**: Built specifically for React/Next.js
✅ **Automatic SPA Routing**: No `_redirects` needed
✅ **Faster Deployment**: Single command, global CDN
✅ **Better Free Tier**: 100GB bandwidth, unlimited projects
✅ **Easier Setup**: Automatic environment variable detection

---

## 🚀 Quick Deployment (5 Minutes)

### **Step 1: Login to Vercel**

```bash
vercel login
```

Choose your login method (GitHub recommended).

---

### **Step 2: Deploy Frontend**

```bash
cd frontend
vercel --prod
```

**During setup:**
1. **Set up and deploy?** → Yes
2. **Which scope?** → Your account
3. **Link to existing project?** → No
4. **Project name?** → `flacronai` (or press Enter)
5. **In which directory is your code located?** → `./` (press Enter)
6. **Want to override settings?** → Yes
7. **Build Command?** → `npm run build` (press Enter)
8. **Output Directory?** → `dist` (press Enter)
9. **Development Command?** → `npm run dev` (press Enter)

**Wait 1-2 minutes for deployment.**

You'll get a URL like: `https://flacronai.vercel.app`

---

### **Step 3: Add Frontend Environment Variables**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project → **Settings** → **Environment Variables**
3. Add these:

```bash
VITE_API_URL=https://flacronai-backend.vercel.app/api
VITE_FIREBASE_API_KEY=AIzaSyAEtWQZaTf8czc8tLdMatYSnAUhIOyCOis
VITE_FIREBASE_AUTH_DOMAIN=flacronai-c8dab.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flacronai-c8dab
VITE_FIREBASE_STORAGE_BUCKET=flacronai-c8dab.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=773892679617
VITE_FIREBASE_APP_ID=1:773892679617:web:daa3f6b5e3774501957140
VITE_FIREBASE_MEASUREMENT_ID=G-NB7SZYH1KS
```

4. Click **Save**
5. Go to **Deployments** → Click **⋯** → **Redeploy**

---

### **Step 4: Deploy Backend**

```bash
cd ../backend
vercel --prod
```

**During setup:**
1. **Set up and deploy?** → Yes
2. **Project name?** → `flacronai-backend`
3. **In which directory is your code located?** → `./`
4. **Want to override settings?** → No

**Wait 1-2 minutes.**

You'll get a URL like: `https://flacronai-backend.vercel.app`

---

### **Step 5: Add Backend Environment Variables**

1. Vercel Dashboard → **flacronai-backend** → **Settings** → **Environment Variables**
2. Add these:

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://flacronai.vercel.app

# Firebase
FIREBASE_PROJECT_ID=flacronai-c8dab
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_complete_private_key_here
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@flacronai-c8dab.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_PROFESSIONAL=price_id
STRIPE_PRICE_AGENCY=price_id
STRIPE_PRICE_ENTERPRISE=price_id

# Domain
DOMAIN=flacronai.com
```

3. Click **Save**
4. Redeploy

---

### **Step 6: Update Frontend with Backend URL**

1. Go to **flacronai** (frontend) → **Settings** → **Environment Variables**
2. Update `VITE_API_URL` to your actual backend URL:
   ```
   VITE_API_URL=https://flacronai-backend.vercel.app/api
   ```
3. Redeploy frontend

---

### **Step 7: Update Backend with Frontend URL**

1. Go to **flacronai-backend** → **Settings** → **Environment Variables**
2. Update `FRONTEND_URL` to your actual frontend URL:
   ```
   FRONTEND_URL=https://flacronai.vercel.app
   ```
3. Redeploy backend

---

## ✅ **Testing**

### **1. Test Backend**
Open: `https://flacronai-backend.vercel.app/`

Should return:
```json
{
  "status": "OK",
  "message": "FlacronAI Backend API is running"
}
```

### **2. Test Frontend**
1. Go to: `https://flacronai.vercel.app/auth`
2. Try to register/login
3. Should work perfectly! ✅

### **3. Test All Routes**
- `/` - Homepage ✅
- `/auth` - Authentication ✅
- `/dashboard` - Dashboard ✅
- `/checkout` - Checkout ✅

All routes should work without 404 errors!

---

## 🎯 **Custom Domain (Optional)**

### **Add Your Domain**

1. **Vercel Dashboard** → **flacronai** → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `flacronai.com`
4. Follow DNS configuration instructions
5. Add these DNS records at your registrar:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

6. Wait 24-48 hours for DNS propagation
7. Vercel automatically provisions SSL certificate

---

## 📊 **Advantages Over Render**

| Feature | Render | Vercel |
|---------|--------|--------|
| SPA Routing | ❌ Manual config | ✅ Automatic |
| Deployment Speed | ~3-5 min | ~1-2 min |
| Global CDN | ❌ Single region | ✅ Global edge |
| Free Bandwidth | 100GB | 100GB |
| Environment Variables | Manual | Web UI |
| Preview Deployments | ❌ No | ✅ Every push |
| Custom Domains | ✅ Yes | ✅ Easier setup |

---

## 🔧 **Troubleshooting**

### **Issue: CORS Errors**

**Fix:**
1. Backend env: `FRONTEND_URL=https://flacronai.vercel.app`
2. Frontend env: `VITE_API_URL=https://flacronai-backend.vercel.app/api`
3. Redeploy both

### **Issue: 404 on Routes**

**Fix:**
Vercel automatically handles this! No config needed.

### **Issue: Environment Variables Not Working**

**Fix:**
1. Add variables in Vercel Dashboard (not `.env` file)
2. Redeploy after adding variables

---

## 🚨 **Important Notes**

1. **Never commit `.env` files** - Use Vercel Dashboard for env vars
2. **Redeploy after adding env vars** - Changes don't apply until redeployment
3. **Use production Stripe keys** - Switch from `sk_test_` to `sk_live_`
4. **Enable Firebase Storage** - Required for file uploads in production

---

## 📝 **Deployment Checklist**

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Vercel
- [ ] Frontend environment variables added
- [ ] Backend environment variables added
- [ ] `VITE_API_URL` points to backend
- [ ] `FRONTEND_URL` points to frontend
- [ ] Both services redeployed with new env vars
- [ ] Firebase Storage enabled
- [ ] Stripe webhooks configured (point to Vercel backend URL)
- [ ] All routes tested (`/`, `/auth`, `/dashboard`)
- [ ] Login/register tested
- [ ] Report generation tested

---

## 🎉 **After Deployment**

Your app will be live at:
- **Frontend**: `https://flacronai.vercel.app`
- **Backend**: `https://flacronai-backend.vercel.app`

**Every git push** to `main` branch will automatically trigger a new deployment!

---

## 💡 **Pro Tips**

1. **Preview Deployments**: Every pull request gets a preview URL
2. **Instant Rollbacks**: One-click rollback to previous deployment
3. **Analytics**: Built-in analytics in Vercel Dashboard
4. **Logs**: Real-time logs for debugging

---

**Vercel is PERFECT for your React + Node.js app!** 🚀
