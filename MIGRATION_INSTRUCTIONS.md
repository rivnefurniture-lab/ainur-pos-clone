# Project Migration Instructions - PipeLogic POS

## Project Overview
- **Name**: PipeLogic POS (formerly ainur-pos-clone)
- **Frontend**: React + TypeScript + Vite + Redux Toolkit + Styled Components
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Database**: PostgreSQL (Railway hosted)
- **Deployment**: Frontend on Vercel, Backend on Railway

## Database Credentials
```
Host: autorack.proxy.rlwy.net
Port: 28902
Database: railway
Username: postgres
Password: olegister14041992
Connection String: postgresql://postgres:olegister14041992@autorack.proxy.rlwy.net:28902/railway
```

## Repository Structure
```
ainur-pos-clone/
├── frontend/          # React frontend application
├── backend/           # Express backend API
└── algotcha_scripts/  # Data fetching scripts (not used in deployment)
```

## Step 1: Clone Repository to New GitHub Account

```bash
# Clone the original repository
git clone https://github.com/rivnefurniture-lab/ainur-pos-clone.git pipelogic-pos
cd pipelogic-pos

# Remove old remote
git remote remove origin

# Create new repository on GitHub (via GitHub UI or CLI)
gh repo create YOUR_USERNAME/pipelogic-pos --public --source=. --remote=origin

# Push to new repository
git push -u origin main
```

## Step 2: Backend Deployment to Railway

### 2.1 Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 2.2 Create Railway Project
```bash
cd backend
railway init
# Select: "Create new project"
# Name: pipelogic-pos-backend
```

### 2.3 Link to Existing PostgreSQL Database
```bash
# Add database connection as environment variable
railway variables set DATABASE_URL="postgresql://postgres:olegister14041992@autorack.proxy.rlwy.net:28902/railway"
railway variables set PORT=3001
railway variables set NODE_ENV=production
```

### 2.4 Deploy Backend
```bash
railway up --detach
```

### 2.5 Get Backend URL
```bash
railway domain
# Note the URL (e.g., https://YOUR-PROJECT.up.railway.app)
```

## Step 3: Frontend Deployment to Vercel

### 3.1 Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 3.2 Configure Environment Variables
```bash
cd ../frontend

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=https://YOUR-RAILWAY-BACKEND-URL.up.railway.app
VITE_SOCKET_URL=https://YOUR-RAILWAY-BACKEND-URL.up.railway.app
EOF

# Create .env.production file (same content)
cp .env .env.production
```

### 3.3 Deploy to Vercel
```bash
vercel --prod
```

### 3.4 Set Vercel Environment Variables
```bash
# Remove any existing variables (if redeploying)
echo "y" | vercel env rm VITE_API_URL production 2>/dev/null || true
echo "y" | vercel env rm VITE_SOCKET_URL production 2>/dev/null || true

# Add environment variables (replace YOUR-RAILWAY-BACKEND-URL)
printf "https://YOUR-RAILWAY-BACKEND-URL.up.railway.app" | vercel env add VITE_API_URL production
printf "https://YOUR-RAILWAY-BACKEND-URL.up.railway.app" | vercel env add VITE_SOCKET_URL production

# Force redeploy to pick up new variables
vercel --prod --force
```

## Step 4: Verify Deployment

### 4.1 Test Backend
```bash
# Replace with your Railway backend URL
curl https://YOUR-RAILWAY-BACKEND-URL.up.railway.app/data/58c872aa3ce7d5fc688b49bd/stores
# Should return JSON with status: true and array of stores
```

### 4.2 Test Frontend
```bash
# Open in browser
open https://YOUR-VERCEL-URL.vercel.app
# Should show PipeLogic POS dashboard with data (not zeros)
```

## Step 5: Local Development Setup

### 5.1 Backend Local Setup
```bash
cd backend
npm install

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:olegister14041992@autorack.proxy.rlwy.net:28902/railway
PORT=3001
NODE_ENV=development
EOF

# Start backend
npm run dev
# Backend runs on http://localhost:3001
```

### 5.2 Frontend Local Setup
```bash
cd ../frontend
npm install

# .env already created in Step 3.2, but for local development:
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
EOF

# Start frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## Step 6: Database Access (Optional)

### Via psql
```bash
psql postgresql://postgres:olegister14041992@autorack.proxy.rlwy.net:28902/railway
```

### Via pgAdmin or DBeaver
```
Host: autorack.proxy.rlwy.net
Port: 28902
Database: railway
Username: postgres
Password: olegister14041992
SSL Mode: require
```

## Important Files and Configurations

### Backend package.json scripts
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Frontend package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

### Backend tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Default User Credentials (Hardcoded - No Auth)

The system has authentication disabled. Default hardcoded values:
```javascript
// In backend/src/routes/auth.ts and all route files
DEFAULT_USER_ID = '58c872aa3ce7d5fc688b49bd'
DEFAULT_CLIENT_ID = '58c872aa3ce7d5fc688b49bd'

// In frontend/src/store/slices/authSlice.ts
companyId: '58c872aa3ce7d5fc688b49bd'
userId: '58c872aa3ce7d5fc688b49bd'
```

## Troubleshooting

### Issue: Database not connected / ECONNRESET / all zeros
**Cause**: DATABASE_URL missing, wrong, or Railway database paused.

**Solution**:
1. Ensure `backend/.env` has: `DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway`
2. Test: `curl http://localhost:3001/health/db` - should return `{"database":"connected"}`
3. If ECONNRESET: Create NEW PostgreSQL on Railway:
   - Railway dashboard -> New Project -> Add PostgreSQL
   - Copy DATABASE_URL from Connect tab
   - Set in backend/.env and Railway variables
   - Run schema: `psql $DATABASE_URL -f backend/src/database/schema.sql` (if empty DB)
4. Railway free tier databases may pause after inactivity - wake via dashboard.

### Issue: Vercel shows zeros on dashboard
**Solution**: Environment variables not set correctly
```bash
cd frontend
vercel env ls production | grep VITE
# Should show VITE_API_URL and VITE_SOCKET_URL
# If missing or wrong, follow Step 3.4
```

### Issue: Backend 404 errors
**Solution**: Check Railway deployment logs
```bash
cd backend
railway logs
```

### Issue: Frontend blank pages
**Solution**: Check browser console for errors
- Open DevTools (F12)
- Check Console tab for API errors
- Check Network tab for failed requests

### Issue: CORS errors
**Solution**: Backend already configured with `cors({ origin: '*' })`
- If still issues, check backend logs
- Verify VITE_API_URL has no trailing slash

## Complete Deployment Checklist

- [ ] Clone repository to new GitHub account
- [ ] Push to new GitHub repository
- [ ] Deploy backend to Railway
- [ ] Get Railway backend URL
- [ ] Update frontend .env files with Railway URL
- [ ] Deploy frontend to Vercel
- [ ] Set Vercel environment variables (VITE_API_URL, VITE_SOCKET_URL)
- [ ] Force redeploy Vercel
- [ ] Test backend API endpoint
- [ ] Test frontend dashboard (should show data, not zeros)
- [ ] Test frontend products page (should show product list)
- [ ] Verify local development setup works

## Additional Notes

### Database Schema
Database is already populated with:
- ~1000 products
- Multiple stores (Березне, Лобановського NOVUS, Океан Плаза floors, Осокорки NOVUS, etc.)
- Categories (Антистресс, Балери, Брелки, etc.)
- Documents (sales, purchases, transfers)
- Customers and suppliers

### No Migration Scripts Needed
Database is already set up and populated. No need to run migrations or seed data.

### Backend Routes
```
GET  /data/:companyId/stores          - Get all stores
GET  /data/:companyId/catalog         - Get all products
GET  /data/:companyId/categories      - Get all categories
GET  /data/:companyId/clients         - Get all customers
GET  /data/:companyId/suppliers       - Get all suppliers
GET  /documents/search                - Search documents
GET  /shift/:companyId                - Get current shift
GET  /data/:companyId/register        - Get register info
POST /auth/login                      - Login (returns hardcoded user)
GET  /auth/status                     - Auth status (returns hardcoded user)
```

### Frontend Routes
```
/pos                    - Dashboard
/pos/cashier            - POS interface
/pos/products           - Products page (full functionality)
/pos/documents          - Documents page
/pos/customers          - Customers page
/pos/suppliers          - Suppliers page
/pos/shifts             - Shifts page
/pos/money-movement     - Money movement page
/pos/reports            - Reports page
/pos/settings           - Settings page
/pos/employees          - Employees page
/pos/stores             - Stores page
/pos/accounts           - Accounts page
/pos/loyalty            - Loyalty page
```

## Contact Information
Original Database Owner: o_kytsuk@mail.ru
Database Password: olegister14041992

## Security Notes
- Authentication is disabled (hardcoded user)
- Database credentials are embedded in code
- CORS is set to allow all origins
- For production use, implement proper authentication and security measures
