# ⚡ Quick Start Guide - Local Development with Render Database

## 🎯 One-Command Start

### Backend:
```bash
cd backend
bash start-local.sh
```

### Frontend (in another terminal):
```bash
cd frontend
npm run dev
```

## ✅ What's Already Done

- ✅ `.env` file configured with Render database URL
- ✅ Database tables created (18 tables)
- ✅ Schema and migrations applied
- ✅ Initial data seeded

## 📋 First Time Setup

### 1. Create Admin User
```bash
cd backend
source venv/bin/activate
python3 create_admin.py admin@example.com your-password
```

### 2. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Manual Start (if script doesn't work)

### Backend:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt  # First time only
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend:
```bash
cd frontend
npm install  # First time only
npm run dev
```

## 📝 Environment Variables

Your Render database URL is already in `backend/.env`:
```
DATABASE_URL=postgresql://health_system_2pbp_user:KRAfa0heCSr0uYqW7Mi0qjZcdaBNyAtV@dpg-d5jnohq4d50c73d4pgm0-a.oregon-postgres.render.com/health_system_2pbp
```

## 🆘 Troubleshooting

**Connection Error?**
- Check internet connection (Render database requires internet)
- Verify `.env` file exists in `backend/` directory

**Port Already in Use?**
- Change port: `uvicorn app.main:app --port 8001 --reload`
- Update frontend API URL if needed

**Module Not Found?**
- Activate venv: `source venv/bin/activate`
- Install deps: `pip install -r requirements.txt`

---

For detailed instructions, see `LOCAL_SETUP.md`
