# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Run tests
npm test                              # Run all tests once
npm run test:watch                    # Watch mode for development
npm run test:ui                       # Run tests with UI interface
npm run test:coverage                 # Generate coverage report

# Run specific test file
npm test -- src/__tests__/services/auth.service.test.ts

# Linting
npm run lint
```

### Build System
- **Build Tool**: Vite 5
- **TypeScript**: Must compile with `tsc` before Vite build
- **Dev Server**: Runs on port 5173, proxies `/api` to `http://localhost:8000`

## Architecture Overview

### Project Structure
This is a feature-based React application with a clear separation of concerns:

```
src/
├── features/              # Feature modules (domain-driven)
│   ├── auth/             # Authentication (login, register)
│   ├── requirements/     # Requirements management
│   ├── insights/         # AI insights/analysis
│   ├── analytics/        # Requirements analytics
│   ├── distribution/     # Distribution (SP/BP/Charter/PCR)
│   └── settings/         # Settings (prompt templates, etc.)
├── stores/               # Zustand global state
├── services/             # API service layer
├── shared/               # Shared components/hooks
│   ├── components/       # Reusable UI components
│   └── hooks/            # Custom hooks
├── router/               # React Router configuration
├── test/                 # Testing utilities
│   ├── utils/            # Test helpers (render, mockHelpers, modalHelpers)
│   └── mocks/data.ts     # Mock data for tests
└── __tests__/            # Test files (mirrors src structure)
```

### Key Architectural Patterns

**1. Service Layer Pattern**
All API calls go through service modules in `src/services/`:
- Services use axios instance from `src/services/api.ts`
- API interceptors automatically add auth tokens and tenant headers
- Response interceptor returns `response.data` directly (unwraps Axios response)
- Generic `ApiResponse<T>` type for all API responses

Example:
```typescript
import api from '@/services/api'
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}
```

**2. State Management Strategy**
Two-tier state management:
- **Zustand stores** (`src/stores/`): Global UI state (auth, session, screen lock)
- **TanStack Query** (React Query): Server state caching and synchronization
  - Services use `useQuery` for fetching
  - Services use `useMutation` for updates
  - Automatic cache invalidation with `queryClient.invalidateQueries()`

**3. Feature-Based Organization**
Each feature in `src/features/` is self-contained with:
- `pages/` - Page components (routes)
- `components/` - Feature-specific components
- `hooks/` - Feature-specific hooks
- Services imported from `src/services/`

**4. Routing Architecture**
- Centralized route configs in `src/router/routes.ts`
- Uses `routeConfigs` array with structure:
  ```typescript
  { path: '/path', element: Component, title: 'Title' }
  ```
- Protected routes check auth via `useAuthStore`
- MainLayout wraps authenticated routes

**5. Component Patterns**
- Use feature components from `src/features/` for business logic
- Use shared components from `src/shared/components/` for reusable UI
- Main layout component: `src/shared/components/layout/MainLayout.tsx`
- Screen lock modal integrated in MainLayout

## Testing Architecture

### Test Infrastructure
Located in `src/test/`:
- `utils/render.tsx` - Custom render with Providers (BrowserRouter, QueryClient, ConfigProvider)
- `utils/mockHelpers.ts` - Mock factory functions
- `utils/modalHelpers.ts` - Modal testing helpers
- `setup.ts` - Global test setup (DOM, fetch, localStorage mocks)
- `mocks/data.ts` - Centralized mock data

### Test Organization
Tests mirror source structure in `src/__tests__/`:
```
src/__tests__/
├── services/         # Service layer tests (API mocks)
├── stores/           # Zustand store tests
├── pages/            # Page component tests
├── components/       # Component tests
└── hooks/            # Custom hook tests
```

### Test Standards (Current Quality)
- **Pass Rate**: 96.05% (292/304 tests passing)
- **Services Layer**: 100% coverage (7/7 services tested)
- **Stores Layer**: 100% coverage (5/5 stores tested)
- **Components Layer**: ~10% coverage (complex UI interactions challenging)

### Important Testing Patterns

**Mock Service Pattern** (for Services):
```typescript
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))
// Use vi.mocked(api.post).mockResolvedValue({ data: mockData })
```

**Store Testing Pattern**:
```typescript
beforeEach(() => {
  useXxxStore.setState({ /* initial state */ })
})
const { result } = renderHook(() => useXxxStore())
await act(async () => {
  await result.current.asyncAction()
})
```

**Modal Testing Pattern** (see `modalHelpers.ts`):
- Wait for dialog role before interacting
- Use `getAllByRole('button')` to find modal buttons (not `getByText`)
- Ant Design Modal buttons may be in special containers

### Known Test Limitations
- 12 failing tests, mostly complex Modal interactions (PromptTemplatesPage, RequirementHistoryTimeline)
- Ant Design Tabs deprecation warnings (uses TabPane, should migrate to `items` prop)
- Modal tests require careful timing and button finding strategies

## API Integration

### Backend Communication
- **Base URL**: `VITE_API_URL` env var or `/api/v1`
- **Auth**: Bearer token from localStorage `access_token`
- **Tenant Header**: `X-Tenant-ID: 1` added to all requests
- **Timeout**: 30 seconds

### Service Examples
```typescript
// Import services
import authService from '@/services/auth.service'
import requirementService from '@/services/requirement.service'

// Services return ApiResponse<T>
const response = await authService.login(credentials)
// response.data contains the actual data
```

## Important Technical Details

### Path Aliases
- `@/` resolves to `src/` (configured in vite.config.ts and vitest.config.ts)

### Environment Variables
- `VITE_API_URL` - Backend API base URL (defaults to `/api/v1`)

### Ant Design Configuration
- ConfigProvider wraps app in `src/router/index.tsx`
- Chinese locale configured globally

### Screen Lock Feature
- Session timeout with countdown modal
- Integrated in MainLayout
- Hook: `src/hooks/useSessionTimeout.ts`
- Store: `src/stores/useAuthStore.ts` (lockTimeoutMs, isLocked, lockedUsername)

### Prompt Templates System
- Managed via settings pages
- Service: `src/services/promptTemplate.service.ts`
- Types: `src/types/prompt.ts`
- Supports versioning and template types (ipd_ten_questions, quick_insight)

## Common Gotchas

### When Writing Service Tests
1. Always mock all HTTP methods you'll use (get, post, put, delete)
2. Use `vi.mocked(api.method)` to access mocked functions with type safety
3. Remember response interceptor unwraps axios - expect `{ data: T }` not full AxiosResponse

### When Testing Components
1. Use custom render from `@/test/utils/render` (includes QueryClient, BrowserRouter)
2. For Modal interactions: wait for `role="dialog"` before accessing content
3. Use `getAllByRole('button')` + find() for Modal buttons (not getByText)
4. Add generous timeouts for complex async operations: `{ timeout: 5000 }`

### When Updating State
1. Zustand: can call directly in tests
2. TanStack Query mutations: wrap in `act()`
3. For state updates triggered by user actions: use `await act(async () => { ... })`

### ESLint and TypeScript
- Build runs `tsc` first - TypeScript errors will block build
- ESLint configured with TypeScript parser
- Maximum warnings set to 0 in CI
