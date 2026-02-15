# Update Vercel Environment Variables

The Vercel deployment needs the correct environment variables. Please follow these steps:

## Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/andriis-projects-ae2f998e/frontend/settings/environment-variables
2. Find `VITE_API_URL` and click Edit
3. Set the value to: `https://eloquent-grace-production-5c92.up.railway.app`
4. Make sure there are NO newlines or extra spaces
5. Save

6. Find `VITE_SOCKET_URL` and click Edit
7. Set the value to: `https://eloquent-grace-production-5c92.up.railway.app`
8. Make sure there are NO newlines or extra spaces
9. Save

10. Go to the Deployments tab and click "Redeploy" on the latest deployment

## Option 2: Via CLI

Run these commands:

```bash
cd /Users/andriiliudvichuk/Projects/ainur-pos-clone/frontend

# Remove old variables
echo "y" | vercel env rm VITE_API_URL production
echo "y" | vercel env rm VITE_SOCKET_URL production

# Add new variables (make sure no newlines!)
printf "https://eloquent-grace-production-5c92.up.railway.app" | vercel env add VITE_API_URL production
printf "https://eloquent-grace-production-5c92.up.railway.app" | vercel env add VITE_SOCKET_URL production

# Redeploy
vercel --prod
```

## Current Deployment URL

https://frontend-emxwi0j6p-andriis-projects-ae2f998e.vercel.app

## What Was Fixed

1. ✅ Rebranded from "AinurPOS" to "PipeLogic POS"
2. ✅ Added console logging to Products page for debugging
3. ⏳ Need to fix Vercel environment variables (see above)

Once the environment variables are updated correctly, the Dashboard should show real data instead of zeros, and the Products page should display the full product list.
