# 🚀 Deploying to Render (Normal Python Deployment - No Docker)

This guide will help you deploy your Car Service Management application to Render using **normal Python deployment** (no Docker required).

## Prerequisites

- A Render account (sign up at https://render.com)
- Your Render database URL (already configured)
- Git repository with your code

## 📋 Deployment Steps

### 1. Prepare Your Repository

Make sure your code is committed and pushed to GitHub/GitLab/Bitbucket:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy Backend API

#### Option A: Using Render Blueprint (Recommended)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will detect `render.yaml` and create the service automatically
5. **Important**: Update the `DATABASE_URL` environment variable in Render dashboard:
   - Go to your service → **Environment**
   - Set `DATABASE_URL` to your existing Render database URL:
     ```
     postgresql://health_system_2pbp_user:KRAfa0heCSr0uYqW7Mi0qjZcdaBNyAtV@dpg-d5jnohq4d50c73d4pgm0-a.oregon-postgres.render.com/health_system_2pbp
     ```
6. Update `CORS_ORIGINS` with your frontend URL after deploying frontend

#### Option B: Manual Deployment (Normal Python - No Docker)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your repository
4. Configure:
   - **Name**: `car-service-api`
   - **Environment**: `Python 3` (NOT Docker)
   - **Root Directory**: `backend` (optional, or use `cd backend` in commands)
   - **Build Command**: `pip install --upgrade pip setuptools wheel && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`
   - **Plan**: Free
   - **Python Version**: Auto-detected (or specify in `runtime.txt`)

5. **Environment Variables** (add these in Render dashboard):
   ```
   DATABASE_URL=postgresql://health_system_2pbp_user:KRAfa0heCSr0uYqW7Mi0qjZcdaBNyAtV@dpg-d5jnohq4d50c73d4pgm0-a.oregon-postgres.render.com/health_system_2pbp
   SECRET_KEY=<generate-a-secure-key>
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   EMAIL_ENABLED=false
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=
   SMTP_PASSWORD=
   FROM_EMAIL=
   ```

6. Click **"Create Web Service"**

### 3. Deploy Frontend (Optional)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Connect your repository
4. Configure:
   - **Name**: `car-service-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://car-service-api.onrender.com/api
     ```

5. After deployment, update backend `CORS_ORIGINS` to include your frontend URL

### 4. Generate Secret Key

Generate a secure secret key for production:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add this to your Render environment variables as `SECRET_KEY`.

### 5. Create Admin User

After deployment, create an admin user by connecting to your Render service:

1. Go to your service → **Shell**
2. Run:
   ```bash
   cd backend
   python3 create_admin.py admin@example.com your-secure-password
   ```

Or use Render's **Shell** feature to run the command.

## 🔧 Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SECRET_KEY` | JWT secret key | Generated secure string |
| `CORS_ORIGINS` | Allowed frontend origins | `https://your-app.onrender.com` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | `30` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://car-service-api.onrender.com/api` |

## 📝 Important Notes

### Database

- ✅ Your database is already set up on Render
- ✅ Tables are created and migrations applied
- ✅ No need to run `init-db.py` during deployment (it's already done)

### Security

- ⚠️ **Never commit `.env` files** - They're already in `.gitignore`
- ✅ Use Render's environment variables for sensitive data
- ✅ Generate a strong `SECRET_KEY` for production
- ✅ Update `CORS_ORIGINS` to only allow your frontend domain

### CORS Configuration

After deploying frontend, update backend `CORS_ORIGINS`:

```
CORS_ORIGINS=https://car-service-frontend.onrender.com
```

### Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Database connections may timeout - the app handles reconnection automatically

## 🐛 Troubleshooting

### Build Fails

- Check that `requirements.txt` is in `backend/` directory
- Verify Python version compatibility
- Check build logs in Render dashboard

### Database Connection Errors

- Verify `DATABASE_URL` is correct in environment variables
- Check database is accessible (not paused)
- Ensure database user has proper permissions

### CORS Errors

- Verify `CORS_ORIGINS` includes your frontend URL
- Check frontend `VITE_API_URL` points to correct backend URL
- Ensure URLs match exactly (including `https://`)

### Service Won't Start

- Check `startCommand` is correct
- Verify port uses `$PORT` environment variable
- Review logs in Render dashboard

## 🔗 Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Render Docs**: https://render.com/docs
- **Your Backend URL**: `https://car-service-api.onrender.com`
- **API Docs**: `https://car-service-api.onrender.com/docs`

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database connection working
- [ ] Admin user created
- [ ] Frontend deployed (if applicable)
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] API documentation accessible at `/docs`
- [ ] Test login functionality

## 🎉 You're Done!

Your application should now be live on Render. Access it at:
- **Backend API**: `https://car-service-api.onrender.com`
- **API Docs**: `https://car-service-api.onrender.com/docs`
