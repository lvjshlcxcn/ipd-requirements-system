# IPD Requirements Management System - Frontend

React frontend for the IPD Requirements Management System.

## Features

- Dashboard with statistics
- Requirement management (CRUD + 10 questions form)
- APPEALS analysis visualization
- KANO classification
- Requirements Traceability Matrix (RTM)
- Distribution management (SP/BP/Charter/PCR)
- Verification records

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript 5+
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **UI Library**: Ant Design 5
- **State Management**: Zustand
- **Server State**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## Setup

### Local Development

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env if needed
```

3. **Start the development server**:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Docker

1. **Build and run with Docker Compose**:
```bash
docker-compose up frontend
```

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component
│   ├── pages/                # Page components
│   ├── components/           # Reusable components
│   ├── stores/               # Zustand state management
│   ├── services/             # API service layer
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   └── styles/               # Global styles
├── public/
├── index.html
├── package.json
└── vite.config.ts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
