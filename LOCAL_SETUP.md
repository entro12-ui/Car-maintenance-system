# 🚀 Running Locally with Render Database

This guide will help you run the Car Service Management application locally using the external Render PostgreSQL database.

## Prerequisites

- Python 3.11 or higher
- Node.js and npm (for frontend)
- Internet connection (to access Render database)

## Quick Start

### 1. Backend Setup

The `.env` file is already configured with your Render database URL. Just start the backend:

```bash
cd backend
bash start-local.sh
```

Or manually:

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # or: . venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 2. Create Admin User (First Time)

After starting the backend, create an admin user:

```bash
cd backend
source venv/bin/activate
python3 create_admin.py admin@example.com your-password
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The frontend will be available at:
- **Frontend**: http://localhost:5173 (or the port shown in terminal)

## Environment Variables

Your `.env` file in `backend/` directory contains:

```env
# Database Configuration - Render PostgreSQL
DATABASE_URL=postgresql://health_system_2pbp_user:KRAfa0heCSr0uYqW7Mi0qjZcdaBNyAtV@dpg-d5jnohq4d50c73d4pgm0-a.oregon-postgres.render.com/health_system_2pbp

# Security
SECRET_KEY=fnjFjNas3OsYDAtz0mTfbMy6ZvHpVoQukJFshby-pag
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Email Configuration (Optional)
EMAIL_ENABLED=false
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=
```

## Database Status

✅ Your Render database is already set up with:
- 18 tables created
- Schema and migrations applied
- Initial data seeded

## Troubleshooting

### Database Connection Issues

If you get connection errors:

1. **Check internet connection** - Render database requires internet access
2. **Verify DATABASE_URL** - Make sure it's correct in `backend/.env`
3. **Test connection manually**:
   ```bash
   cd backend
   source venv/bin/activate
   python3 -c "from app.database import engine; from sqlalchemy import text; conn = engine.connect(); print('✅ Connected!'); conn.close()"
   ```

### Port Already in Use

If port 8000 is already in use:

```bash
# Use a different port
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Then update `CORS_ORIGINS` in `.env` if needed.

### Module Not Found Errors

Make sure virtual environment is activated and dependencies are installed:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

## Running Both Backend and Frontend

### Terminal 1 - Backend:
```bash
cd backend
bash start-local.sh
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

## Notes

- **No Docker needed** - Since you're using Render's external database, you don't need to run PostgreSQL locally
- **Database is shared** - Any changes you make will affect the Render database
- **Backup recommended** - Before making major changes, consider backing up your data

## Next Steps

1. ✅ Database is configured and ready
2. ✅ Backend can connect to Render database
3. 🚀 Start backend: `cd backend && bash start-local.sh`
4. 🚀 Start frontend: `cd frontend && npm run dev`
5. 👤 Create admin user: `python3 create_admin.py admin@example.com password`

Enjoy developing! 🎉
