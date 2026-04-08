# AutoPark - Smart Parking Management System

A full-stack smart parking management system that automates and optimizes vehicle parking through real-time slot tracking, intelligent allocation algorithms, and digital monitoring.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **Real-time** | Socket.IO (WebSocket) |
| **Auth** | JWT (Access + Refresh tokens) |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Testing** | Jest + ts-jest |

## Architecture

```
autopark/
├── client/           # Next.js frontend (App Router)
├── server/           # Express + TypeScript backend
│   ├── prisma/       # Database schema & migrations
│   └── src/
│       ├── config/   # Database singleton, env config
│       ├── core/     # Interfaces, abstract classes, errors, types
│       ├── modules/  # Feature modules (auth, user, vehicle, parking, booking, payment, notification, report)
│       ├── middleware/# Auth, authorization, validation, error handling
│       └── utils/    # JWT, password hashing, logger
└── shared/           # Shared TypeScript types
```

### Layered Architecture (per module)

```
Controller → Service → Repository → Database
     ↓           ↓          ↓
    DTO       Mapper    BaseRepository (abstract)
```

## Design Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Singleton** | `server/src/config/database.ts` | Single PrismaClient instance across the app |
| **Factory** | `server/src/modules/vehicle/vehicle.factory.ts` | Creates correct vehicle subclass (Car, Motorcycle, Truck, ElectricVehicle) from type enum |
| **Strategy** | `server/src/modules/parking/strategies/` | Swappable slot allocation algorithms (Nearest, Cheapest, Priority) |
| **Observer** | `server/src/modules/notification/` | Multi-channel notifications (InApp, WebSocket, Email) |
| **Repository** | `server/src/core/abstract/BaseRepository.ts` | Generic data access abstraction with TypeScript generics |

## SOLID Principles

| Principle | Implementation |
|-----------|---------------|
| **Single Responsibility** | Each class has one job: Controller handles HTTP, Service handles logic, Repository handles data, Mapper converts entities |
| **Open/Closed** | New strategies, observers, and vehicle types added without modifying existing code |
| **Liskov Substitution** | All vehicle subclasses substitutable for BaseVehicle; all strategies for IParkingStrategy |
| **Interface Segregation** | Small focused interfaces: IParkingStrategy (1 method), INotificationObserver (1 method) |
| **Dependency Inversion** | Services depend on interfaces (IParkingStrategy, INotificationObserver), not concrete classes |

## OOP Concepts

| Concept | Implementation |
|---------|---------------|
| **Encapsulation** | Private constructor in Singleton, readonly properties in entities, repositories hide query logic |
| **Inheritance** | BaseVehicle → Car/Motorcycle/Truck/EV; AppError → NotFound/Validation/Auth errors; BaseRepository → all repos |
| **Polymorphism** | Strategy `allocate()` varies by implementation; vehicle `getCompatibleSlotTypes()` varies by subclass |
| **Abstraction** | Abstract classes (BaseVehicle, BaseRepository, BaseController); Interfaces (IParkingStrategy, IObserver) |

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Clone and install

```bash
git clone https://github.com/your-username/autopark.git
cd autopark
npm install
```

### 2. Setup environment

```bash
cp .env.example server/.env
# Edit server/.env with your PostgreSQL credentials
```

### 3. Setup database

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run the application

```bash
# From root directory - runs both server and client
npm run dev

# Or separately:
npm run dev:server  # http://localhost:3001
npm run dev:client  # http://localhost:3000
```

### 5. Test credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@autopark.com | admin123 |
| User | john@example.com | user123 |
| User | jane@example.com | user123 |

## How to Run Tests

```bash
cd server
npm test
```

## API Endpoints (29 total)

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/me` - Profile
- `PUT /api/users/me` - Update profile
- `GET /api/users` - [Admin] List users
- `PUT /api/users/:id/role` - [Admin] Change role

### Vehicles
- `GET /api/vehicles` - List my vehicles
- `POST /api/vehicles` - Register vehicle
- `GET/PUT/DELETE /api/vehicles/:id` - CRUD

### Parking
- `GET /api/parking/slots` - List slots (filterable)
- `GET /api/parking/slots/available` - Available slots
- `POST /api/parking/slots/allocate` - Smart allocation (Strategy Pattern)
- `POST /api/parking/slots` - [Admin] Create slot
- `GET /api/parking/floors` - List floors

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - My bookings
- `PUT /api/bookings/:id/cancel` - Cancel
- `POST /api/bookings/:id/checkin` - Check in
- `POST /api/bookings/:id/checkout` - Check out

### Payments
- `POST /api/payments` - Process payment
- `GET /api/payments` - My payments
- `POST /api/payments/:id/refund` - [Admin] Refund

### Notifications
- `GET /api/notifications` - My notifications
- `PUT /api/notifications/read-all` - Mark all read

### Reports (Admin)
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/occupancy` - Occupancy data
- `GET /api/reports/revenue` - Revenue breakdown
- `GET /api/reports/popular-slots` - Top 10 slots
- `GET /api/reports/peak-hours` - Usage by hour

## Database Schema (ER)

```
Users 1──* Vehicles 1──* Bookings *──1 ParkingSlots *──1 ParkingFloors
  |                         |
  |                    1──1 Payments
  |                    1──1 EntryExitLogs
  |
  1──* Notifications
```

8 tables: `users`, `vehicles`, `parking_floors`, `parking_slots`, `bookings`, `payments`, `entry_exit_logs`, `notifications`

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Registration |
| `/dashboard` | User dashboard with stats |
| `/parking` | Live parking slot grid |
| `/bookings` | Booking list with check-in/out |
| `/bookings/new` | Create booking with strategy selection |
| `/vehicles` | Vehicle management |
| `/payments` | Payment history |
| `/notifications` | Notification inbox |
| `/admin/dashboard` | Admin analytics with charts |
| `/admin/slots` | Manage parking slots/floors |
| `/admin/users` | User management |
| `/admin/reports` | Revenue & popular slots reports |
