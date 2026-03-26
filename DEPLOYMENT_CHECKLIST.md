# ExamPrep Deployment Checklist

## Step 1 — Cloudflare R2 (Media Storage)
1. Log in to dash.cloudflare.com
2. Go to **R2 Object Storage** → Create bucket → name it `examprep-media`
3. Go to **R2 → Manage R2 API Tokens** → Create token with read/write permissions
4. Copy: Account ID, Access Key ID, Secret Access Key
5. In bucket settings → Enable **Public Access** → copy the public URL
6. Optionally add a custom domain (e.g. `media.examprep.ng`) under bucket → Custom Domains
7. Add all R2 values to Railway environment variables

## Step 2 — Brevo (Email)
1. Sign up at brevo.com (free — 300 emails/day)
2. Go to **SMTP & API** → **API Keys** → Create a new API key
3. Go to **Senders & Domains** → Add your domain → Verify DNS records on Namecheap
4. Copy your API key
5. Add `BREVO_API_KEY` to Railway environment variables
6. Install: `pip install django-anymail[brevo]`

## Step 3 — Railway (App Hosting)
1. Push code to GitHub (make sure `.env` is in `.gitignore`)
2. Go to railway.app → **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Add services:
   - Click **+ New** → **Database** → **PostgreSQL**
   - Click **+ New** → **Database** → **Redis**
5. Railway auto-sets `DATABASE_URL` and `REDIS_URL` — no manual entry needed
6. Go to your app service → **Variables** → Add all variables from `.env.example`:
   - `DEBUG=False`
   - `SECRET_KEY` (generate with: `python -c "import secrets; print(secrets.token_urlsafe(50))"`)
   - `ALLOWED_HOSTS=your-railway-domain.up.railway.app,yourdomain.com`
   - All `CLOUDFLARE_R2_*` variables
   - `BREVO_API_KEY`
   - `DEFAULT_FROM_EMAIL`
   - `PAYSTACK_SECRET_KEY`
   - `PAYSTACK_PUBLIC_KEY`
   - `ANTHROPIC_API_KEY`
   - `CACHE_BACKEND=redis`
7. Railway will auto-deploy on first variable save

## Step 4 — Custom Domain (Namecheap + Cloudflare)
1. In Railway → your app service → **Settings** → **Domains** → Add custom domain
2. Railway gives you a CNAME record
3. Log in to Namecheap → Manage domain → Advanced DNS
4. Add the CNAME record Railway provided
5. SSL certificate is automatic (Let's Encrypt via Railway)
6. Update `ALLOWED_HOSTS` in Railway variables to include your domain

## Step 5 — GitHub Actions (CI/CD)
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `RAILWAY_TOKEN`
4. Value: Go to Railway → Account Settings → Tokens → Create token → paste here
5. From now on every push to `main` will:
   - Run Django tests
   - Build React frontend
   - Deploy to Railway automatically

## Step 6 — Post-deployment checks
- [ ] Visit your domain — site loads correctly
- [ ] Register a test account — OTP email arrives
- [ ] Upload a test file — appears in R2 bucket
- [ ] Make a test payment — Paystack works
- [ ] Check Railway logs — no errors
- [ ] Run: `railway run python manage.py createsuperuser`
- [ ] Seed Mathematics topics: `railway run python manage.py maths_seed`

## Install new packages locally before pushing
```bash
pip install django-anymail[brevo] django-storages boto3 whitenoise gunicorn psycopg2-binary
pip freeze > requirements.txt
```