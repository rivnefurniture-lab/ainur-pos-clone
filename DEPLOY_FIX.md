# Fix: Dashboard shows all zeros / Nothing displays

## Status (updated)
- **New backend deployed**: https://wonderful-growth-production-44cf.up.railway.app
- **Frontend updated** to use new backend URL
- **Database**: Still needs setup - see below

## Connect database (to fix zeros)

The backend runs but database returns ECONNRESET. Fix:

1. Go to https://railway.app/project/a9addc15-d490-44a4-b335-1ac933bd4ada
2. You should see **Postgres** service (added) and **wonderful-growth** (backend)
3. Click **wonderful-growth** → **Variables** → Add variable:
   - Key: `DATABASE_URL`
   - Value: Click "Add Reference" → Select **Postgres** service → `DATABASE_URL`
4. Redeploy: wonderful-growth → Deployments → Redeploy
5. Run schema on new DB: Railway Postgres → Connect → copy URL, then:
   ```bash
   psql "postgresql://postgres:PASSWORD@HOST:PORT/railway" -f ainur-pos-clone/backend/src/database/schema.sql
   ```
6. Import data if needed (the old autorack DB had data - may need to migrate)

## Working URLs
- **Frontend**: https://frontend-mkkxia8mo-andriis-projects-ae2f998e.vercel.app
- **Backend**: https://wonderful-growth-production-44cf.up.railway.app
