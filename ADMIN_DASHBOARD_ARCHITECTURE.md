# Admin Dashboard - Current Design & Architecture

**Date:** October 18, 2025  
**Version:** 1.0  
**Status:** Production Active

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Access Control](#access-control)
3. [Current Features](#current-features)
4. [Page Structure](#page-structure)
5. [API Endpoints](#api-endpoints)
6. [User Management](#user-management)
7. [Market Data Management](#market-data-management)
8. [Technical Architecture](#technical-architecture)
9. [UI Components](#ui-components)
10. [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

The Admin Dashboard is a restricted-access interface designed for platform administrators to manage users, monitor system health, and control market data. It provides comprehensive tools for user administration, data management, and system monitoring.

### Key Characteristics

- **Role-Based Access**: Only users with `role: "admin"` can access
- **Protected Routes**: Uses `AdminRoute` wrapper for authentication
- **Separate Navigation**: Hidden sidebar and top nav links (full-screen mode)
- **Real-time Data**: Fetches live user counts and system status
- **Service-Oriented**: Uses dedicated service layers for API communication

---

## 🔐 Access Control

### Authentication Flow

```
User Login → Firebase Auth → Token Validation → Role Check → Admin Dashboard
                                                      ↓
                                            (if not admin) → Redirect to /dashboard
```

### AdminRoute Component

**Location:** `frontend/src/components/auth/AdminRoute.tsx`

**Logic:**
1. Checks if user is authenticated
2. Verifies user role is "admin"
3. Shows loading spinner during check
4. Redirects to "/" if not authenticated
5. Redirects to "/dashboard" if not admin
6. Renders admin content if authorized

```typescript
// Protection levels:
- No user → Redirect to login (/)
- User but role !== "admin" → Redirect to retail dashboard (/dashboard)
- User with role === "admin" → Grant access
```

### Role Assignment

**Backend:** `Backend/api/users.py`
- Roles stored in MongoDB `users` collection
- Field: `role: "admin" | "retail"`
- Promoted via `/api/users/admin/promote` endpoint
- Default role for new users: `"retail"`

---

## 🎨 Current Features

### 1. **Dashboard Overview** (`/admin-dashboard`)

#### Header Section
- **Title:** "Admin Dashboard"
- **Greeting:** "Welcome back, {displayName or email}"
- **Role Badge:** Shows "ADMIN" with shield icon

#### Stats Cards (Grid Layout - 3 columns)

**Card 1: Total Users**
- Icon: Users (Lucide)
- Value: Live count from `/api/users/admin/count`
- Description: "Active users in the system"
- **Interactive:** Clicking navigates to `/user-management`
- Status: ✅ Functional

**Card 2: Strategies**
- Icon: BarChart3 (Lucide)
- Value: "-" (Placeholder - not implemented)
- Description: "Total strategies created"
- Status: ⚠️ Pending implementation

**Card 3: Backtests**
- Icon: TrendingUp (Lucide)
- Value: "-" (Placeholder - not implemented)
- Description: "Backtests run today"
- Status: ⚠️ Pending implementation

#### Admin Actions Card

**Purpose:** Quick access to admin tasks

Features listed (visual only, not functional):
- **User Management** - Promote/demote users, manage roles
- **Data Management** - Upload market data, manage symbols
- **Strategy Approval** - Review and approve user strategies

Status: ⚠️ UI elements only, no functionality

#### System Status Card

**Purpose:** Monitor system health

Real-time status indicators:
- **API Status:** Online (Green badge)
- **Database:** Connected (Green badge)
- **Firebase Auth:** Active (Green badge)

Status: ⚠️ Static values, no real monitoring

---

### 2. **User Management** (`/user-management`)

**Location:** `frontend/src/pages/UserManagement.tsx`

#### Features

**A. User Listing**
- Displays all users from `/api/users/admin`
- Shows: displayName, email, UID, role, active status, last login
- Real-time filtering by:
  - Search query (name/email/UID)
  - Role filter (All, Admin, Retail)
- Pagination support (via skip/limit)

**B. User Creation**
- Add new users via form
- Fields:
  - Email (required)
  - Password (optional - Firebase generates if empty)
  - Display Name (optional)
  - Role (Admin/Retail dropdown)
- API: `POST /api/users/admin`

**C. User Modification**
- **Change Role:** Dropdown to switch between Admin/Retail
- **Reset Password:** Generate password reset link (copied to clipboard)
- **Revoke Sessions:** Force logout user from all devices
- **Deactivate/Activate:** Toggle user active status
- **Delete User:** Permanently remove user

**D. User Details Display**
- Badge showing role
- Inactive badge for deactivated users
- Last login timestamp
- UID for debugging

#### API Integration

| Action | Endpoint | Method |
|--------|----------|--------|
| List Users | `/api/users/admin` | GET |
| Count Users | `/api/users/admin/count` | GET |
| Create User | `/api/users/admin` | POST |
| Update User | `/api/users/admin` | PUT |
| Delete User | `/api/users/admin/{uid}` | DELETE |
| Deactivate | `/api/users/admin/{uid}/deactivate` | POST |
| Reset Password | `/api/users/admin/{uid}/reset-password` | POST |
| Revoke Sessions | `/api/users/admin/{uid}/revoke-sessions` | POST |

---

## 📊 Page Structure

### Admin Dashboard (`AdminDashboard.tsx`)

```tsx
Layout:
  └─ Container (p-6, space-y-6)
      ├─ Header
      │   ├─ Title + Greeting
      │   └─ Role Badge
      │
      ├─ Stats Grid (3 columns on lg, 2 on md, 1 on mobile)
      │   ├─ Total Users Card (clickable)
      │   ├─ Strategies Card
      │   └─ Backtests Card
      │
      └─ Bottom Grid (2 columns)
          ├─ Admin Actions Card
          │   ├─ User Management
          │   ├─ Data Management
          │   └─ Strategy Approval
          │
          └─ System Status Card
              ├─ API Status
              ├─ Database Status
              └─ Firebase Auth Status
```

### User Management (`UserManagement.tsx`)

```tsx
Layout:
  └─ Container (p-6, space-y-6)
      ├─ Header
      │   ├─ Title
      │   └─ Controls
      │       ├─ Search Input
      │       ├─ Role Filter
      │       └─ Refresh Button
      │
      ├─ Add User Card
      │   └─ Form (5 fields + Create button)
      │       ├─ Email
      │       ├─ Password
      │       ├─ Display Name
      │       ├─ Role Select
      │       └─ Create Button
      │
      └─ Users List Card
          └─ User Items (filtered list)
              ├─ User Info
              │   ├─ Name/Email + Badges
              │   └─ UID + Last Login
              │
              └─ Actions
                  ├─ Role Dropdown
                  ├─ Reset Password
                  ├─ Revoke Sessions
                  ├─ Deactivate/Activate
                  └─ Delete
```

---

## 🔌 API Endpoints

### User Management APIs

**Base URL:** `/api/users`

#### 1. Get Current User Info
```
GET /me
Headers: Authorization: Bearer {token}
Response: { uid, email, role, displayName }
```

#### 2. List All Users (Admin)
```
GET /admin
Headers: Authorization: Bearer {token}
Required Role: admin
Response: User[]
```

#### 3. Get User Count (Admin)
```
GET /admin/count
Headers: Authorization: Bearer {token}
Required Role: admin
Response: { count: number }
```

#### 4. Create User (Admin)
```
POST /admin
Headers: Authorization: Bearer {token}
Body: { 
  email: string, 
  password?: string, 
  displayName?: string, 
  role?: "admin" | "retail",
  permissions?: object
}
Response: { uid: string }
```

#### 5. Update User (Admin)
```
PUT /admin
Headers: Authorization: Bearer {token}
Body: { 
  uid: string,
  email?: string,
  displayName?: string,
  role?: "admin" | "retail",
  permissions?: object,
  active?: boolean
}
Response: { uid: string }
```

#### 6. Delete User (Admin)
```
DELETE /admin/{uid}
Headers: Authorization: Bearer {token}
Response: { deleted: true }
```

#### 7. Deactivate User (Admin)
```
POST /admin/{uid}/deactivate
Headers: Authorization: Bearer {token}
Response: { uid: string, active: false }
```

#### 8. Reset Password (Admin)
```
POST /admin/{uid}/reset-password
Headers: Authorization: Bearer {token}
Response: { resetLink: string }
```

#### 9. Revoke Sessions (Admin)
```
POST /admin/{uid}/revoke-sessions
Headers: Authorization: Bearer {token}
Response: { revoked: true }
```

#### 10. Promote User Role (Admin)
```
POST /admin/promote
Headers: Authorization: Bearer {token}
Body: { uid: string, role: "admin" | "retail" }
Response: { uid: string, role: string }
```

---

### Market Data Management APIs

**Base URL:** `/api/admin/market-data`

#### 1. List Cached Data
```
GET /
Headers: Authorization: Bearer {token}
Required Role: admin
Response: MarketDataCacheListItem[]
```

#### 2. Sync Market Data
```
POST /sync
Headers: Authorization: Bearer {token}
Body: {
  symbol: string,
  timeframe: "1d" | "1h" | "30m" | "15m",
  start_date: string (YYYY-MM-DD),
  end_date: string (YYYY-MM-DD),
  force_refresh: boolean
}
Response: MarketDataSyncResponse
```

#### 3. Delete Market Data
```
DELETE /
Headers: Authorization: Bearer {token}
Body: {
  symbol: string,
  timeframe?: "1d" | "1h" | "30m" | "15m"
}
Response: { success: boolean, message: string }
```

#### 4. Get Statistics
```
GET /stats
Headers: Authorization: Bearer {token}
Response: {
  total_symbols: number,
  total_records: number,
  total_cache_entries: number,
  by_timeframe: object,
  recent_updates: array
}
```

#### 5. Get Activity Logs
```
GET /activity-logs?limit=100&skip=0&action=sync&target=market_data
Headers: Authorization: Bearer {token}
Response: {
  logs: array,
  count: number,
  limit: number,
  skip: number
}
```

---

## 👥 User Management

### User Data Model

```typescript
interface User {
  uid: string;                    // Firebase UID
  email?: string;                 // User email
  displayName?: string;           // Display name
  role: "admin" | "retail";       // User role
  createdAt?: string;             // ISO timestamp
  lastLogin?: string;             // ISO timestamp
  active?: boolean;               // Account status
  permissions?: Record<string, any>; // Custom permissions
}
```

### User Lifecycle

```
1. Creation
   ↓
   Admin creates user → Firebase Auth account created
   ↓
   User record saved to MongoDB → Default role: "retail"
   ↓
   Welcome email sent (if configured)

2. Role Management
   ↓
   Admin updates role → MongoDB updated
   ↓
   User's next request → New role applied

3. Deactivation
   ↓
   Admin deactivates → active: false in MongoDB
   ↓
   User blocked from actions (auth middleware checks)

4. Deletion
   ↓
   Admin deletes → Record removed from MongoDB
   ↓
   Firebase account remains (manual cleanup needed)
```

### Role Hierarchy

```
Admin
├─ Full platform access
├─ User management
├─ Market data management
├─ System configuration
└─ View all data

Retail
├─ Personal dashboard
├─ Create strategies
├─ Run backtests
├─ View own data only
└─ Limited public data access
```

---

## 📈 Market Data Management

### Current Implementation

**Status:** Backend APIs complete, Frontend UI pending

### Available Operations

1. **List Cached Data**
   - View all symbols and timeframes in cache
   - See record counts and last update timestamps
   
2. **Sync Market Data**
   - Fetch data from Yahoo Finance
   - Merge with existing cache
   - Supports date range selection
   - Force refresh option available

3. **Delete Cache**
   - Remove specific symbol/timeframe
   - Clear all data for a symbol

4. **View Statistics**
   - Total symbols and records
   - Breakdown by timeframe
   - Recent update activity

5. **Activity Logs**
   - Track all admin actions
   - Filter by action type and target
   - Pagination support

### Data Storage

**Location:** MongoDB collection `market_data_cache`

**Document Structure:**
```javascript
{
  symbol: "NIFTY",
  timeframe: "1d",
  data: [
    {
      date: "2024-01-01",
      open: 21000,
      high: 21200,
      low: 20900,
      close: 21150,
      volume: 1234567
    },
    // ... more records
  ],
  last_updated: "2025-10-18T10:30:00Z",
  admin_uid: "abc123",
  admin_email: "admin@example.com"
}
```

---

## 🏗️ Technical Architecture

### Frontend Stack

```
AdminDashboard
├─ React 18
├─ TypeScript
├─ Tailwind CSS
├─ shadcn/ui components
└─ React Router v6

Components Used:
├─ Card (shadcn/ui)
├─ Badge (shadcn/ui)
├─ Button (shadcn/ui)
├─ Input (shadcn/ui)
├─ Select (shadcn/ui)
└─ Toast (shadcn/ui)

Icons: Lucide React
```

### Backend Stack

```
API Layer
├─ FastAPI (Python)
├─ Firebase Admin SDK
├─ Motor (MongoDB async driver)
└─ Pydantic (validation)

Authentication:
├─ Firebase JWT tokens
├─ Custom role verification
└─ MongoDB user storage

Middleware:
├─ verify_firebase_token()
└─ require_role("admin")
```

### Data Flow

```
Frontend Action
    ↓
Service Layer (users.service.ts)
    ↓
HTTP Request + JWT Token
    ↓
Backend API Endpoint
    ↓
Auth Middleware (verify_firebase_token)
    ↓
Role Check (require_role("admin"))
    ↓
Business Logic
    ↓
MongoDB Operations
    ↓
Response
    ↓
Frontend State Update
    ↓
UI Refresh
```

### State Management

**Current:** React useState hooks
- Simple state per component
- No global state management
- API calls trigger re-fetch

**Potential Enhancement:** React Query for:
- Automatic refetching
- Cache management
- Optimistic updates

---

## 🎨 UI Components

### Design System

**Theme:** Dark mode (consistent with retail dashboard)
**Colors:**
- Background: `#0A0A0A` (dark)
- Cards: Default shadcn/ui card styles
- Text: Default (light on dark)
- Accent: Default (blue)

### Component Library

All components from **shadcn/ui**:

| Component | Usage | Location |
|-----------|-------|----------|
| Card | Stats, actions, user list | Multiple |
| Badge | Role indicators, status | Dashboard, User Management |
| Button | Actions, navigation | All pages |
| Input | Search, forms | User Management |
| Select | Filters, role selection | User Management |
| Toast | Success/error messages | User Management |

### Icons (Lucide React)

- **Users:** User-related features
- **Shield:** Admin badge
- **BarChart3:** Strategies stat
- **TrendingUp:** Backtests stat
- **Settings:** System settings (future)

---

## 📱 Responsive Design

### Breakpoints

```css
Mobile:  < 768px   → 1 column layout
Tablet:  768-1024  → 2 column layout
Desktop: > 1024px  → 3 column layout
```

### Layout Adaptations

**AdminDashboard:**
- Stats grid: 3 cols (lg) → 2 cols (md) → 1 col (mobile)
- Bottom grid: 2 cols → 1 col on mobile

**UserManagement:**
- Add user form: 5 cols → stacked on mobile
- User cards: Full width on all sizes
- Action buttons: Wrap on small screens

---

## 🔒 Security Considerations

### Current Implementation

✅ **Implemented:**
- JWT token verification on every request
- Role-based access control (RBAC)
- Protected routes (AdminRoute wrapper)
- Server-side role validation
- Secure password reset links

⚠️ **Needs Attention:**
- No rate limiting on admin endpoints
- No audit log UI (backend logs exist)
- No multi-factor authentication
- No session timeout enforcement
- Firebase accounts not deleted when users removed

### Best Practices

1. **Always verify role on backend** - Never trust frontend
2. **Use HTTPS in production** - Encrypt data in transit
3. **Sanitize user inputs** - Prevent injection attacks
4. **Log all admin actions** - Audit trail (partially implemented)
5. **Implement session timeouts** - Force re-auth periodically

---

## 📊 Data & Analytics

### Available Metrics

**User Metrics:**
- Total user count ✅
- Users by role (backend only)
- Active vs inactive users (backend only)
- Last login timestamps ✅

**Strategy Metrics:**
- Total strategies (pending)
- Public vs private (pending)
- Strategies by user (pending)

**Backtest Metrics:**
- Total backtests (pending)
- Backtests today (pending)
- Success rate (pending)

### Missing Analytics

- User growth over time
- Most active users
- Popular strategies
- System usage patterns
- Error rates
- API performance metrics

---

## 🚀 Future Enhancements

### High Priority

1. **Market Data UI**
   - Build frontend for market data management
   - Visual data sync interface
   - Cache statistics dashboard
   - Activity log viewer

2. **Strategy Approval System**
   - Review pending strategies
   - Approve/reject with comments
   - Flag inappropriate content

3. **Analytics Dashboard**
   - Real strategy/backtest counts
   - User growth charts
   - System usage graphs
   - Performance metrics

4. **Audit Logs UI**
   - View all admin actions
   - Filter by admin, date, action type
   - Export logs for compliance

### Medium Priority

5. **System Configuration**
   - Platform settings management
   - Feature flags
   - Maintenance mode toggle

6. **Bulk Operations**
   - Bulk user import/export
   - Bulk role assignments
   - Bulk data uploads

7. **Advanced User Management**
   - User groups/teams
   - Custom permission sets
   - User activity tracking

### Low Priority

8. **Notification System**
   - Send announcements to users
   - Email templates
   - In-app notifications

9. **Reporting**
   - Scheduled reports
   - PDF exports
   - Email reports

10. **API Rate Limiting**
    - Configure limits per user/role
    - Monitor API usage
    - Auto-throttling

---

## 📝 File Structure

### Frontend Files

```
frontend/src/
├── pages/
│   ├── AdminDashboard.tsx           # Main admin dashboard
│   └── UserManagement.tsx           # User management page
├── components/
│   └── auth/
│       └── AdminRoute.tsx           # Admin route protection
├── services/
│   └── users.service.ts             # User API service
└── contexts/
    └── AuthContext.tsx              # Auth state management
```

### Backend Files

```
Backend/
├── api/
│   ├── users.py                     # User management endpoints
│   └── admin_market_data.py         # Market data admin endpoints
├── auth_mongodb.py                  # Auth middleware
├── models/
│   └── market_data.py               # Market data models
└── services/
    └── market_data_service.py       # Market data business logic
```

---

## 🔧 Configuration

### Environment Variables

**Frontend:**
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
```

**Backend:**
```env
MONGODB_URI=mongodb+srv://...
FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json
```

### Route Configuration

**App.tsx:**
```tsx
<Route 
  path="/admin-dashboard" 
  element={
    <AdminRoute>
      <AppLayout hideSidebar hideTopNavLinks>
        <ErrorBoundary>
          <AdminDashboard />
        </ErrorBoundary>
      </AppLayout>
    </AdminRoute>
  } 
/>

<Route 
  path="/user-management" 
  element={
    <AdminRoute>
      <AppLayout hideSidebar hideTopNavLinks>
        <ErrorBoundary>
          <UserManagement />
        </ErrorBoundary>
      </AppLayout>
    </AdminRoute>
  } 
/>
```

---

## 🐛 Known Issues

1. **Stats Cards Placeholders**
   - Strategies and Backtests show "-"
   - Need backend endpoints implementation

2. **Admin Actions Card**
   - Visual elements only
   - No click handlers for actions

3. **System Status Static**
   - Shows hardcoded "Online" status
   - No real health checks

4. **No Market Data UI**
   - Backend APIs ready
   - Frontend interface not built

5. **Firebase Account Cleanup**
   - Deleting user in app doesn't delete Firebase account
   - Manual cleanup required

6. **No Audit Log UI**
   - Backend logs admin actions
   - No frontend viewer

---

## 📚 Related Documentation

- `ADMIN_RBAC.md` - Role-based access control details
- `MONGODB_SETUP.md` - Database configuration
- `FIREBASE_CONSOLIDATION_GUIDE.md` - Firebase setup
- `MARKET_DATA_BACKEND.md` - Market data service details

---

## 📞 Support & Maintenance

### Common Admin Tasks

**Promote User to Admin:**
```bash
# Via API
POST /api/users/admin/promote
Body: { "uid": "user_uid", "role": "admin" }
```

**Reset User Password:**
```bash
# Via UI
User Management → User Row → Reset Password button
# Copies link to clipboard
```

**Deactivate Suspicious Account:**
```bash
# Via UI
User Management → User Row → Deactivate button
```

### Troubleshooting

**Issue:** User can't access admin dashboard
- Check role in MongoDB `users` collection
- Verify Firebase token is valid
- Check browser console for errors

**Issue:** Stats not loading
- Check backend server is running
- Verify MongoDB connection
- Check network tab for failed requests

---

## ✅ Summary

### What Works
- ✅ Admin authentication and authorization
- ✅ User listing and filtering
- ✅ User creation, update, deletion
- ✅ Role management
- ✅ Password reset
- ✅ Session revocation
- ✅ User count stats
- ✅ Backend market data APIs

### What's Pending
- ⚠️ Real strategy and backtest stats
- ⚠️ Market data management UI
- ⚠️ Strategy approval system
- ⚠️ Audit log viewer
- ⚠️ Analytics charts
- ⚠️ System health monitoring
- ⚠️ Bulk operations

---

**Last Updated:** October 18, 2025  
**Maintained By:** Development Team
