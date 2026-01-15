# ✅ Pre-Deployment Checklist

## 🔒 Security Check

- [x] `.env` files are in `.gitignore` (lines 58, 71, 97)
- [ ] Verify `.env` is not committed: `git ls-files | grep .env` (should return nothing)
- [ ] Create `.env.example` template (already created)

## 📦 Repository Setup

- [ ] Initialize git repository (if not done):
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  ```

- [ ] Push to GitHub/GitLab/Bitbucket:
  ```bash
  git remote add origin <your-repo-url>
  git push -u origin main
  ```

## 🗄️ Database

- [x] Database URL configured: `postgresql://health_system_2pbp_user:...@dpg-d5jnohq4d50c73d4pgm0-a.oregon-postgres.render.com/health_system_2pbp`
- [x] Database tables created (18 tables)
- [x] Migrations applied

## ⚙️ Render Configuration (Normal Python - No Docker)

- [x] `render.yaml` configured for **normal Python deployment** (not Docker)
- [x] `runtime.txt` created (Python 3.11)
- [x] Build script created: `backend/render-build.sh`
- [ ] Update `CORS_ORIGINS` in `render.yaml` after frontend deployment

**Important**: This uses Render's native Python environment, NOT Docker!

## 🔑 Environment Variables

Set these in Render dashboard after deployment:

### Backend (Required)
- [ ] `DATABASE_URL` - Your Render database URL
- [ ] `SECRET_KEY` - Generate: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] `CORS_ORIGINS` - Your frontend URL
- [ ] `ALGORITHM` - `HS256`
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` - `30`

### Frontend (If deploying)
- [ ] `VITE_API_URL` - Your backend URL + `/api`

## 🚀 Deployment Steps

1. **Deploy Backend**:
   - Go to Render dashboard
   - New → Blueprint (or Web Service)
   - Connect repository
   - Render will use `render.yaml` automatically
   - Set environment variables manually

2. **Create Admin User**:
   - Use Render Shell: `cd backend && python3 create_admin.py admin@example.com password`

3. **Deploy Frontend** (optional):
   - New → Static Site
   - Connect repository
   - Root: `frontend`
   - Build: `npm install && npm run build`
   - Publish: `dist`

4. **Update CORS**:
   - Update backend `CORS_ORIGINS` with frontend URL

## 📝 Quick Commands

```bash
# Generate secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Check if .env is ignored
git check-ignore backend/.env

# Verify no .env files are tracked
git ls-files | grep .env
```

## 🎯 After Deployment

- [ ] Test API: `https://your-api.onrender.com/docs`
- [ ] Test login
- [ ] Verify database connection
- [ ] Check logs for errors
