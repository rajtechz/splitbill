# SplitMate Backend — Production-Grade REST API

This is the backend server for **SplitMate**, built with **Node.js, Express, TypeScript, and JWT Authentication**.

---

## 🚀 Quick Start

From the root project directory:
```bash
npm run backend
```

Or from inside the `backend/` directory:
```bash
cd backend
npm run dev
```

The server will start on **`http://localhost:3000`**:
- **Health Check**: `http://localhost:3000/health`
- **Base API Path**: `http://localhost:3000/api/v1`
- **Persistent Database**: Automatically persisted to `backend/data/db.json`

---

## 📱 Connecting SplitMate Mobile App to This Backend

1. **Start the backend server**:
   ```bash
   npm run backend
   ```
2. **Open the SplitMate mobile app**:
   - Tap the bottom tab **Account & Settings (Profile)**.
   - Tap **"Backend & Server API"**.
   - Select your environment preset:
     - **iOS Simulator**: `http://localhost:3000/api/v1`
     - **Android Emulator**: `http://10.0.2.2:3000/api/v1`
     - **Physical Device**: `http://<YOUR_COMPUTER_WIFI_IP>:3000/api/v1`
   - Switch data source from **"Mock Adapter"** to **"Live Backend (REST)"**.
   - Tap **"Test Ping"** (you will see: *"Connected successfully! (HTTP 200 in ~1ms)"*).
   - Tap **"Apply & Save"**.

---

## 🔑 Default Seed Accounts

The database comes pre-seeded with realistic financial data. All accounts use password: **`password123`**

| Name | Email | Phone | UPI ID | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Johnson** | `alex.johnson@example.com` | `+91 98765 43210` | `alex.johnson@okaxis` | Primary User |
| **Priya Sharma** | `priya.s@example.com` | `+91 98111 22334` | `priyasharma@okhdfcbank` | Friend |
| **Rohan Verma** | `rohan.v@example.com` | `+91 98222 33445` | `rohan.verma@paytm` | Friend |
| **Ananya Patel** | `ananya.p@example.com` | `+91 98333 44556` | `ananya.patel@ibl` | Friend |
| **Vikram Singh** | `vikram.s@example.com` | `+91 98444 55667` | `vikram.singh@ybl` | Friend |

---

## 📡 REST API Routes

### Authentication (`/api/v1/auth`)
- `POST /auth/login`: Email & password login (returns JWT tokens + user profile)
- `POST /auth/register`: Create a new user account
- `POST /auth/otp/send`: Send 6-digit phone OTP (dev code: `123456`)
- `POST /auth/otp/verify`: Verify phone OTP and authenticate
- `POST /auth/refresh-token`: Exchange refresh token for fresh access token
- `POST /auth/forgot-password`: Request password reset email
- `POST /auth/logout`: Invalidate session

### User Profile (`/api/v1/users`)
- `GET /users/me`: Get current authenticated user profile
- `PATCH /users/me`: Update name, phone, UPI ID, avatar, or default currency

### Groups (`/api/v1/groups`)
- `GET /groups`: List all groups with member balances and total spending
- `POST /groups`: Create a new group
- `GET /groups/:id`: Get group details and members
- `PATCH /groups/:id`: Update group name, description, or category
- `DELETE /groups/:id`: Delete a group
- `POST /groups/:id/members`: Add a member to the group
- `DELETE /groups/:id/members/:userId`: Remove a member from the group

### Friends (`/api/v1/friends`)
- `GET /friends`: List all friends with computed net balances
- `POST /friends`: Add a friend
- `DELETE /friends/:id`: Remove a friend

### Expenses (`/api/v1/expenses`)
- `GET /expenses`: List expenses (optional filter: `?groupId=<id>`)
- `GET /expenses/:id`: Get expense details with participants & comments
- `POST /expenses`: Create expense with custom splits (Equal, Exact, Percentage, Shares)
- `PATCH /expenses/:id`: Edit expense details or participant amounts
- `DELETE /expenses/:id`: Delete an expense
- `POST /expenses/:id/comments`: Add a comment to an expense

### Settlements & Payments (`/api/v1/settlements`)
- `GET /settlements`: List settlements (optional filter: `?groupId=<id>`)
- `POST /settlements`: Record a payment (Cash, UPI, Bank transfer, Other)
- `POST /settlements/:id/confirm`: Confirm payment received (clears debts)
- `POST /settlements/:id/reject`: Decline payment (preserves debts)

### Activities, Notifications & Search
- `GET /activities`: Chronological feed of expenses, settlements, and member changes
- `GET /notifications`: In-app notification center
- `PATCH /notifications/:id/read`: Mark notification as read
- `GET /search?q=<query>`: Unified search across groups, friends, and expenses

---

## 💾 Data Persistence

All data is stored and auto-saved to:
```
backend/data/db.json
```
- Modifying, adding, or deleting groups, expenses, settlements, and users writes to disk automatically.
- No external database installation (like PostgreSQL or MongoDB) is required to run the server.
- If you prefer PostgreSQL, a complete `schema.prisma` is provided in [`BACKEND_API_SPEC.md`](../BACKEND_API_SPEC.md).

---

## 🧪 Running Tests

To run the automated backend integration test suite:
```bash
npx tsx src/testApi.ts
```

