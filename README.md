# NoGapGas UI

A modern React UI for the NoGapGas automation service - automate your gas meter readings on gasolina-online.com.

## Features

- User authentication (login, register, password change)
- Dashboard with service status and recent jobs
- Job management (create, list, view details)
- Configuration management for Gasolina credentials
- Monthly increment settings for gas meter readings
- Job logs and screenshots viewer
- Responsive design with mobile support

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching and caching
- **React Hook Form** + **Zod** for form validation
- **Axios** for HTTP requests
- **Lucide React** for icons
- **date-fns** for date formatting

## Getting Started

### Prerequisites

- Node.js 18+
- The NoGapGas API server running on port 8080

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`. The development server proxies API requests to `http://localhost:8080`.

### Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Main app layout with sidebar
│   │   └── ProtectedRoute.tsx  # Auth guard component
│   └── ui/
│       ├── Alert.tsx           # Alert/notification component
│       ├── Badge.tsx           # Status badge component
│       ├── Button.tsx          # Button component
│       ├── Card.tsx            # Card components
│       └── Input.tsx           # Form input component
├── contexts/
│   └── AuthContext.tsx         # Authentication state management
├── lib/
│   └── api.ts                  # API client with axios
├── pages/
│   ├── Configuration.tsx       # Gasolina settings page
│   ├── Dashboard.tsx           # Main dashboard
│   ├── JobDetails.tsx          # Single job view
│   ├── Jobs.tsx                # Jobs list page
│   ├── Login.tsx               # Login page
│   ├── Profile.tsx             # User profile page
│   └── Register.tsx            # Registration page
├── types/
│   └── api.ts                  # TypeScript type definitions
├── App.tsx                     # App routes
├── main.tsx                    # Entry point
└── index.css                   # Tailwind imports
```

## API Endpoints

The UI connects to the following API endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### User
- `GET /api/me` - Get current user
- `PUT /api/me/password` - Change password

### Configuration
- `GET /api/config` - Get user config
- `PUT /api/config` - Update user config

### Jobs
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details

### Screenshots
- `GET /api/screenshots/:jobId` - List job screenshots
- `GET /api/screenshots/:jobId/:filename` - Download screenshot

### Status
- `GET /api/status` - Get service status

## Environment Variables

The app uses Vite's proxy for API requests in development. No environment variables are required for local development.

For production, you may need to configure the API base URL if hosting the frontend separately from the backend.

## License

MIT
