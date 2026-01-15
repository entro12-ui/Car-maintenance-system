# Car Service Management System

A complete car service management system built with React, FastAPI, and PostgreSQL.

## Features

- **Customer Management**: Register and manage customers
- **Vehicle Management**: Track customer vehicles with service history
- **Appointment Scheduling**: Schedule and manage service appointments
- **Service Records**: Complete service tracking with parts and labor costs
- **Parts Inventory**: Manage parts inventory with low stock alerts
- **Loyalty Program**: "Pay 3 Get 4th Free" loyalty program
- **Notifications**: Automated service reminders
- **Reports**: Daily and monthly financial reports
- **Dashboard**: Real-time statistics and overview

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Query, React Router
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Database**: PostgreSQL 15

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API routes
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── database.py      # Database connection
│   │   └── main.py          # FastAPI app
│   ├── database/
│   │   └── schema.sql       # PostgreSQL schema
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OR Python 3.11+ and Node.js 18+

### Using Docker (Recommended)

1. Clone the repository
2. Run the entire stack:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Manual Setup

#### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb car_service_db

# Run schema
psql -U postgres -d car_service_db -f database/schema.sql
```

4. Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/car_service_db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

5. Run the backend:
```bash
uvicorn app.main:app --reload
```

#### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
```

3. Run the frontend:
```bash
npm run dev
```

## API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/{id}` - Get customer details
- `PUT /api/customers/{id}` - Update customer
- `GET /api/customers/{id}/vehicles` - Get customer vehicles
- `GET /api/customers/{id}/history` - Get service history

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles/{id}` - Get vehicle details
- `PUT /api/vehicles/{id}` - Update vehicle

### Appointments
- `GET /api/appointments` - List appointments
- `GET /api/appointments/today` - Get today's appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment
- `POST /api/appointments/{id}/start` - Start appointment
- `POST /api/appointments/{id}/complete` - Complete appointment

### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `GET /api/services/{id}` - Get service details
- `PUT /api/services/{id}` - Update service
- `POST /api/services/{id}/calculate-bill` - Calculate service bill

### Parts
- `GET /api/parts` - List parts
- `GET /api/parts/low-stock` - Get low stock items
- `POST /api/parts` - Create part
- `PUT /api/parts/{id}` - Update part

### Loyalty
- `GET /api/loyalty/programs` - Get loyalty programs
- `GET /api/loyalty/status/{customer_id}` - Get customer loyalty status
- `POST /api/loyalty/{customer_id}/apply-free-service` - Apply free service

### Reports
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/customers-due` - Customers due for service

### Dashboard
- `GET /api/dashboard` - Dashboard statistics

## Database Schema

The system includes the following main entities:

- **customers**: Customer information
- **vehicles**: Vehicle details linked to customers
- **appointments**: Service appointments
- **services**: Service records with billing
- **service_types**: Pre-defined service packages
- **parts_inventory**: Parts inventory
- **service_parts**: Parts used in services
- **loyalty_programs**: Loyalty program definitions
- **customer_loyalty**: Customer loyalty tracking
- **notifications**: Notification system
- **employees**: Employee management

See `backend/database/schema.sql` for complete schema.

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting

```bash
# Backend
black app/
isort app/

# Frontend
npm run lint
```

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

# Car-maintenance-system
