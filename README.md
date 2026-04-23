# 🍽️ Food Controller — Restaurant Management SaaS

> Production-ready multi-tenant restaurant management system: recipe costing, P&L, suppliers, assets & SOP.

## 🏗️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router) + Tailwind  |
| Backend     | NestJS + Prisma ORM                 |
| Database    | PostgreSQL 16                       |
| Auth        | JWT (access + refresh tokens)       |
| State       | Zustand + React Query               |
| Charts      | Recharts                            |
| Deployment  | Docker Compose + Nginx              |

---

## 🚀 Quick Start (Docker — Recommended)

```bash
# 1. Clone / copy project
cd foodcontroller

# 2. Set env vars
cp .env.example .env
# Edit .env with your secrets

# 3. Start everything
docker-compose up -d

# 4. Open browser
open http://localhost:3000
```

**Default test accounts** (seeded automatically):
| Role    | Email                        | Password      |
|---------|------------------------------|---------------|
| Owner   | owner@goldenwok.co.th        | Admin1234!    |
| Manager | manager@goldenwok.co.th      | Manager1234!  |
| Staff   | staff@goldenwok.co.th        | Staff1234!    |

---

## 🛠️ Local Development (No Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ running locally
- pnpm or npm

### Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed sample data
npm run seed

# Start dev server
npm run start:dev
# → API running at http://localhost:3001
# → Swagger docs at http://localhost:3001/api/docs
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL if needed

# Start dev server
npm run dev
# → App running at http://localhost:3000
```

---

## 📐 Architecture

### Multi-tenant Design
- Every data record is scoped by `organizationId`
- All API routes extract `orgId` from JWT payload
- No cross-tenant data leakage possible

### Role Hierarchy
```
OWNER → ADMIN → MANAGER → STAFF
```
- **OWNER**: Full access, organization settings
- **ADMIN**: All data + user management
- **MANAGER**: Create/edit all records
- **STAFF**: Read + limited create

### Cost Calculation Engine
```
purchasePrice / purchaseWeight × 1000 = pricePerKg
pricePerKg × (1 + lossPercentage/100) = actualCostPerKg
actualCostPerKg / 1000 = actualCostPerGram

Per recipe line:
  cost = actualCostPerGram × quantityGrams

totalIngredientCost = SUM(all line costs)
totalCost = totalIngredientCost × (1 + laborCostPercent/100 + overheadPercent/100)
grossProfit = sellingPrice - totalCost
foodCostPercent = (totalCost / sellingPrice) × 100
grossProfitMargin = (grossProfit / sellingPrice) × 100
```

When an ingredient price is updated → **all recipes using it are automatically recalculated** in cascade.

---

## 📁 Folder Structure

```
foodcontroller/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← 12-table DB schema
│   │   └── seed.ts             ← Sample data
│   └── src/
│       ├── auth/               ← JWT auth, strategies, guards
│       ├── ingredients/        ← CRUD + cost calc engine
│       ├── recipes/            ← CRUD + cascade recalc + analytics
│       ├── suppliers/          ← Supplier management
│       ├── assets/             ← Equipment tracking
│       ├── sop/                ← Standard operating procedures
│       ├── financials/         ← P&L records + dashboard
│       ├── organizations/      ← Multi-tenant settings
│       ├── users/              ← Profile management
│       └── common/             ← Guards, interceptors, filters
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (dashboard)/    ← All protected pages
│       │   │   ├── dashboard/  ← KPI + charts overview
│       │   │   ├── recipes/    ← Recipe management + cost form
│       │   │   ├── ingredients/← Ingredient CRUD + cost preview
│       │   │   ├── suppliers/  ← Supplier management
│       │   │   ├── assets/     ← Equipment tracker
│       │   │   ├── financials/ ← P&L monthly entry + charts
│       │   │   ├── sop/        ← SOP documents
│       │   │   └── settings/   ← Org + user settings
│       │   └── auth/           ← Login + Register pages
│       ├── components/
│       │   ├── layout/Sidebar  ← Collapsible sidebar nav
│       │   └── ui/             ← StatCard, DataTable, Modal, Button...
│       ├── lib/api.ts          ← Typed axios client + auto-refresh
│       └── store/auth.store.ts ← Zustand auth state
│
├── nginx/nginx.conf            ← Reverse proxy config
├── docker-compose.yml          ← Full stack orchestration
└── README.md
```

---

## 🔌 API Endpoints

| Method | Route                        | Description                        |
|--------|------------------------------|------------------------------------|
| POST   | /auth/register               | Register user + organization       |
| POST   | /auth/login                  | Login → access + refresh tokens    |
| POST   | /auth/refresh                | Refresh access token               |
| GET    | /ingredients                 | List with supplier filter          |
| POST   | /ingredients                 | Create + auto cost calc            |
| PUT    | /ingredients/:id             | Update + cascade recipe recalc     |
| GET    | /recipes                     | List with cost summary             |
| POST   | /recipes/cost-preview        | Preview cost before saving         |
| GET    | /recipes/analytics           | Menu engineering matrix            |
| POST   | /recipes                     | Create + full cost calculation     |
| GET    | /suppliers                   | List suppliers                     |
| GET    | /assets/summary              | Department value breakdown         |
| GET    | /financials/dashboard        | KPI + monthly data                 |
| POST   | /financials                  | Upsert monthly P&L record          |
| GET    | /organization/members        | List team members                  |
| POST   | /organization/members/invite | Invite user by email               |

Full docs available at `http://localhost:3001/api/docs` (Swagger).

---

## 🌱 Seed Data (The Golden Wok Restaurant)

| Entity      | Count | Details                                      |
|-------------|-------|----------------------------------------------|
| Users       | 3     | Owner, Manager, Staff                        |
| Suppliers   | 4     | CPF, Makro, Siam Foods, Namthip              |
| Ingredients | 15    | Proteins, Seafood, Herbs, Sauces, Grains     |
| Recipes     | 5     | Tom Yum, Green Curry, Pork Stir-fry, Sea Bass, Rice |
| Assets      | 10    | Kitchen, Service, Bar equipment              |
| Financials  | 6     | Nov 2024 – Apr 2025 P&L records              |
| SOP         | 1     | Tom Yum Soup procedure                       |

---

## 🔐 Security Features

- Bcrypt password hashing (rounds: 12)
- JWT access token (15min TTL) + refresh token (7d TTL)
- Refresh token stored as bcrypt hash in DB
- Helmet.js HTTP security headers
- Rate limiting (100 req/min per IP)
- Role-based access control on every endpoint
- Multi-tenant data isolation via `organizationId` on all queries

---

## 🚢 Production Deployment

```bash
# Generate strong secrets
openssl rand -base64 32  # for JWT_ACCESS_SECRET
openssl rand -base64 32  # for JWT_REFRESH_SECRET

# Edit .env
cp .env.example .env
nano .env

# Deploy
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

For HTTPS, add SSL certificates to `./nginx/ssl/` and update `nginx.conf`.

---

## 📝 Next Steps for Production

1. **Email**: Add Nodemailer for proper email invitations & verification
2. **File upload**: Add S3 + multer for recipe images, asset photos, SOP images
3. **Payments**: Add Stripe for SaaS subscription billing
4. **Analytics**: Add more detailed menu engineering reports
5. **Mobile**: The responsive design works on mobile; consider a React Native app
6. **Backup**: Set up automated PostgreSQL backups (pg_dump daily)
7. **Monitoring**: Add Sentry for error tracking, Datadog for performance

---

Built with ❤️ for Thai restaurant operators. Developed with Food Controller concept by Dream Solution Plus Co., Ltd.
