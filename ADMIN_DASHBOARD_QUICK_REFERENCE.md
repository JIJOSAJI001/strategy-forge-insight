# Admin Dashboard - Quick Reference

**Version:** 1.0 | **Date:** October 18, 2025

---

## 🎯 Quick Overview

The Admin Dashboard is a secure, role-protected interface for platform administrators to manage users, monitor system health, and control market data.

---

## 🔑 Key Features

### ✅ Fully Implemented

1. **User Management** (`/user-management`)
   - List all users with search and filters
   - Create new users (email, password, role)
   - Update user roles (Admin ↔ Retail)
   - Reset passwords (generates secure link)
   - Revoke user sessions (force logout)
   - Deactivate/Activate accounts
   - Delete users

2. **User Statistics**
   - Live user count on dashboard
   - User role distribution
   - Last login tracking

3. **Access Control**
   - Role-based authentication (admin only)
   - Protected routes with `AdminRoute` wrapper
   - Server-side role verification
   - JWT token validation

### ⚠️ Partially Implemented

4. **Dashboard Overview** (`/admin-dashboard`)
   - User count card (working)
   - Strategy count card (placeholder)
   - Backtest count card (placeholder)
   - System status indicators (static)

5. **Market Data Management** (Backend only)
   - APIs ready: sync, list, delete, stats, logs
   - Frontend UI: Not yet built

---

## 📍 Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/admin-dashboard` | Admin only | Overview and stats |
| `/user-management` | Admin only | User CRUD operations |

---

## 🔌 Key API Endpoints

### User Management
- `GET /api/users/admin` - List all users
- `POST /api/users/admin` - Create user
- `PUT /api/users/admin` - Update user
- `DELETE /api/users/admin/{uid}` - Delete user
- `POST /api/users/admin/{uid}/reset-password` - Reset password
- `POST /api/users/admin/{uid}/revoke-sessions` - Force logout

### Market Data (Backend Ready)
- `GET /api/admin/market-data` - List cached data
- `POST /api/admin/market-data/sync` - Sync from Yahoo Finance
- `DELETE /api/admin/market-data` - Delete cache
- `GET /api/admin/market-data/stats` - Get statistics

---

## 🎨 Design

**Layout:**
- Dark theme (consistent with retail dashboard)
- Full-screen mode (no sidebar, no top nav)
- shadcn/ui components
- Lucide React icons
- Responsive grid layouts

**Color Scheme:**
- Cards: Default dark theme
- Badges: Green (active), Red (inactive), Blue (role)
- Buttons: Primary (blue), Outline (white), Destructive (red)

---

## 🔒 Security

**Implemented:**
- JWT token verification
- Role-based access control (RBAC)
- Protected routes
- Server-side validation
- Secure password reset links

**Missing:**
- Rate limiting
- Multi-factor authentication
- Session timeouts
- Audit log UI

---

## 📊 Data Model

```typescript
User {
  uid: string              // Firebase UID
  email: string
  displayName?: string
  role: "admin" | "retail"
  active: boolean
  createdAt: string
  lastLogin: string
  permissions?: object
}
```

---

## 🚀 Next Steps

### High Priority
1. ✅ Build Market Data Management UI
2. ✅ Implement real stats (strategies, backtests)
3. ✅ Add audit log viewer
4. ✅ Strategy approval system

### Medium Priority
5. Analytics dashboard with charts
6. System health monitoring
7. Bulk user operations
8. Advanced permissions

---

## 📁 Files

**Frontend:**
- `src/pages/AdminDashboard.tsx` - Main dashboard
- `src/pages/UserManagement.tsx` - User management
- `src/components/auth/AdminRoute.tsx` - Route protection
- `src/services/users.service.ts` - API service

**Backend:**
- `api/users.py` - User endpoints
- `api/admin_market_data.py` - Market data endpoints
- `auth_mongodb.py` - Auth middleware

---

## 🔧 Common Tasks

**Promote User to Admin:**
```
User Management → Find user → Change role dropdown to "Admin"
```

**Reset User Password:**
```
User Management → Find user → Reset Password button
→ Link copied to clipboard → Send to user
```

**Deactivate User:**
```
User Management → Find user → Deactivate button
→ User can't access platform until reactivated
```

**Create New Admin:**
```
User Management → Add New User form
→ Email, Password, Name, Role: "Admin" → Create
```

---

## 📖 Full Documentation

See `ADMIN_DASHBOARD_ARCHITECTURE.md` for complete details on:
- Detailed architecture
- API specifications
- Security guidelines
- Future enhancements
- Troubleshooting

---

**Status:** Production Active  
**Maintained By:** Development Team
