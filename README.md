# AinurPOS Clone

A full-featured Point of Sale (POS) system clone built with modern technologies.

## Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **Socket.io** for real-time updates
- **Express-session** with connect-pg-simple for session management

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Styled Components** for styling
- **React Hook Form** with Zod for form validation
- **Axios** for API calls
- **Socket.io-client** for real-time features

## Features

- 🔐 **Authentication** - Session-based authentication with secure cookies
- 🛒 **POS Sales** - Full point-of-sale functionality
- 📦 **Inventory Management** - Products, categories, stock tracking
- 👥 **Customer Management** - Customer profiles, loyalty, discounts
- 🏪 **Multi-store Support** - Multiple locations management
- 💰 **Financial Tracking** - Accounts, money movements, reports
- 📊 **Reporting** - Sales analytics and business insights
- ⏰ **Shift Management** - Open/close shifts, cash reconciliation
- 🔄 **Real-time Updates** - WebSocket-based sync

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Then run database setup
npm run db:setup

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Database Setup

Run the SQL schema to create all tables:

```bash
psql -U postgres -d ainur_pos -f backend/src/database/schema.sql
```

## Project Structure

```
ainur-pos-clone/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and app configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── database/        # SQL schemas
│   │   ├── middleware/      # Auth and other middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store and slices
│   │   ├── styles/          # Global styles
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helper functions
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/check` - Check auth status

### Data (CRUD)
- `GET /data/:companyId/catalog` - Get products
- `GET /data/:companyId/clients` - Get customers
- `GET /data/:companyId/stores` - Get stores
- `GET /data/:companyId/accounts` - Get accounts
- `GET /data/:companyId/suppliers` - Get suppliers
- `GET /data/:companyId/register` - Get cash registers
- `GET /data/:companyId/sources` - Get money sources

### Documents
- `GET /docs/:companyId/:offset/:limit` - Get documents
- `POST /docs/:companyId` - Create document

### Shifts
- `GET /shift/:companyId` - Get current shift
- `POST /shift/:companyId/open` - Open shift
- `POST /shift/:companyId/close` - Close shift

### Search
- `POST /search/docs/:companyId/:offset/:limit` - Search documents
- `POST /search/money/:companyId/:offset/:limit` - Search money movements
- `POST /search/catalog/:companyId/:offset/:limit` - Search products
- `POST /search/clients/:companyId/:offset/:limit` - Search customers

## Default Credentials

For development:
- Email: `admin@demo.com`
- Password: `admin123`

## License

MIT
