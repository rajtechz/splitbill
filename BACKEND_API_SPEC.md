# SplitMate — Backend REST API Specification & Integration Guide

This document defines the complete backend API specification required by the SplitMate mobile application.
Whether you are implementing the backend in **Node.js (Express / NestJS)**, **Go**, **Python (FastAPI / Django)**, or **Java (Spring Boot)**, follow this specification for 100% plug-and-play compatibility.

---

## 1. General Architecture & Standards

- **Protocol**: HTTP/1.1 or HTTP/2 over TLS (HTTPS in production)
- **Data Format**: `application/json` (both requests and responses)
- **Character Encoding**: UTF-8
- **Base Path Convention**: `/api/v1`
  - Android Emulator Local: `http://10.0.2.2:3000/api/v1`
  - iOS Simulator Local: `http://localhost:3000/api/v1`
  - Production: `https://api.splitmate.app/v1`
- **Monetary Units**: Amounts should either be integer minor units (paise/cents) or standard decimals. SplitMate handles both gracefully.

### Client Headers Sent by SplitMate
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <accessToken>
X-Client-App: SplitMate-Mobile
X-Client-Version: 1.0.0
```

### Standard Response Envelope (2xx)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```
*(Note: SplitMate's `HttpRepository` supports both wrapped `{ data: ... }` and unwrapped direct JSON).*

### Standard Error Envelope (4xx, 5xx)
```json
{
  "success": false,
  "message": "Invalid credentials or session expired",
  "statusCode": 401,
  "code": "INVALID_TOKEN",
  "errors": {
    "email": ["Invalid email address format"]
  }
}
```

---

## 2. Authentication & Token Lifecycle

SplitMate implements **Dual Token Authentication (Access Token + Refresh Token)** with automatic 401 interceptor refresh.

### Flow
1. Upon successful login or registration, the server returns:
   - `accessToken`: Short-lived JWT (15 to 60 minutes)
   - `refreshToken`: Long-lived cryptographic token (30 to 90 days)
   - `user`: User profile object
2. SplitMate stores both securely in persistent storage.
3. Every request automatically attaches `Authorization: Bearer <accessToken>`.
4. When `accessToken` expires (HTTP 401), SplitMate silently calls `POST /auth/refresh-token` with the refresh token, updates storage, and replays the original queued requests without user disruption.

---

## 3. API Endpoints

### 3.1 Health Check (Used by In-App "Test Ping" Button)
- **Method**: `GET`
- **Route**: `/health`
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "status": "ok",
  "timestamp": "2026-11-10T06:00:00.000Z",
  "version": "1.0.0"
}
```

---

### 3.2 Authentication Endpoints

#### `POST /auth/login`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "alex.johnson@example.com",
  "password": "password123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_101",
      "name": "Alex Johnson",
      "email": "alex.johnson@example.com",
      "phoneNumber": "+91 98765 43210",
      "upiId": "alex@okhdfcbank",
      "defaultCurrency": "INR",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "d8e3b2a1-7c4f-...",
      "expiresIn": 3600
    }
  }
}
```

#### `POST /auth/register`
- **Auth**: None
- **Request Body**:
```json
{
  "name": "Rahul Sharma",
  "email": "rahul.sharma@example.com",
  "password": "securePassword123",
  "phoneNumber": "+91 98765 11111",
  "defaultCurrency": "INR"
}
```
- **Response (201 Created)**: Same schema as `/auth/login`.

#### `POST /auth/otp/send`
- **Auth**: None
- **Request Body**:
```json
{
  "phoneNumber": "+91 98765 43210"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### `POST /auth/otp/verify`
- **Auth**: None
- **Request Body**:
```json
{
  "phoneNumber": "+91 98765 43210",
  "otp": "123456"
}
```
- **Response (200 OK)**: Same schema as `/auth/login`.

#### `POST /auth/refresh-token`
- **Auth**: None (or Refresh Bearer)
- **Request Body**:
```json
{
  "refreshToken": "d8e3b2a1-7c4f-..."
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "optional-new-rotated-refresh-token"
  }
}
```

#### `POST /auth/logout`
- **Auth**: `Bearer <accessToken>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 3.3 User Profile Endpoints

#### `GET /users/me`
- **Auth**: `Bearer <accessToken>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "usr_101",
    "name": "Alex Johnson",
    "email": "alex.johnson@example.com",
    "phoneNumber": "+91 98765 43210",
    "upiId": "alex@okhdfcbank",
    "avatarUrl": "https://images.unsplash.com/photo-...",
    "defaultCurrency": "INR",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### `PATCH /users/me`
- **Auth**: `Bearer <accessToken>`
- **Request Body**:
```json
{
  "name": "Alex Johnson",
  "phoneNumber": "+91 98765 43210",
  "upiId": "alex@okhdfcbank",
  "defaultCurrency": "INR"
}
```

---

### 3.4 Groups Endpoints

#### `GET /groups`
- **Auth**: `Bearer <accessToken>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "grp_1",
      "name": "Goa Trip 2026",
      "description": "Weekend getaway in North Goa",
      "category": "Trip",
      "currency": "INR",
      "membersCount": 4,
      "totalSpending": 28400,
      "userBalance": -1400,
      "members": [
        {
          "userId": "usr_me",
          "name": "Alex Johnson",
          "email": "alex@example.com",
          "role": "admin",
          "joinedAt": "2026-05-01T00:00:00.000Z",
          "netBalance": -1400
        }
      ],
      "createdAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /groups`
- **Auth**: `Bearer <accessToken>`
- **Request Body**:
```json
{
  "name": "Manali Roadtrip",
  "description": "Friends cabin stay",
  "category": "Trip",
  "currency": "INR",
  "members": [
    { "userId": "usr_me", "name": "Alex Johnson", "email": "alex@example.com", "role": "admin" },
    { "userId": "usr_2", "name": "Rahul Sharma", "email": "rahul@example.com", "role": "member" }
  ]
}
```

#### `GET /groups/:id`
- **Auth**: `Bearer <accessToken>`
- Returns complete group details with all members.

#### `PATCH /groups/:id`
- **Auth**: `Bearer <accessToken>`
- **Request Body**: Partial group fields (`name`, `description`, `category`).

#### `DELETE /groups/:id`
- **Auth**: `Bearer <accessToken>`

#### `POST /groups/:id/members`
- **Auth**: `Bearer <accessToken>`
- **Request Body**:
```json
{
  "userId": "usr_3",
  "name": "Priya Patel",
  "email": "priya@example.com",
  "role": "member"
}
```

#### `DELETE /groups/:id/members/:memberId`
- **Auth**: `Bearer <accessToken>`

---

### 3.5 Friends Endpoints

#### `GET /friends`
- **Auth**: `Bearer <accessToken>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "f_1",
      "userId": "usr_2",
      "name": "Rahul Sharma",
      "email": "rahul.sharma@example.com",
      "phoneNumber": "+91 98765 11111",
      "upiId": "rahul@okhdfcbank",
      "netBalance": 1200,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /friends`
- **Auth**: `Bearer <accessToken>`
- **Request Body**:
```json
{
  "userId": "usr_3",
  "name": "Priya Patel",
  "email": "priya.patel@example.com",
  "phoneNumber": "+91 98765 22222",
  "upiId": "priya@okicici"
}
```

#### `DELETE /friends/:id`
- **Auth**: `Bearer <accessToken>`

---

### 3.6 Expenses Endpoints

#### `GET /expenses`
- **Auth**: `Bearer <accessToken>`
- **Query Params**: `?groupId=grp_1` (optional filter)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "exp_1",
      "title": "Villa Booking",
      "totalAmount": 16000,
      "currency": "INR",
      "date": "2026-05-10T14:30:00.000Z",
      "category": "Rent",
      "groupId": "grp_1",
      "groupName": "Goa Trip 2026",
      "notes": "Paid advance via UPI",
      "splitMethod": "EQUAL",
      "createdBy": "usr_me",
      "participants": [
        {
          "userId": "usr_me",
          "name": "Alex Johnson",
          "paidAmount": 16000,
          "shareAmount": 4000,
          "netBalance": 12000
        },
        {
          "userId": "usr_2",
          "name": "Rahul Sharma",
          "paidAmount": 0,
          "shareAmount": 4000,
          "netBalance": -4000
        }
      ],
      "commentsCount": 0,
      "createdAt": "2026-05-10T14:35:00.000Z"
    }
  ]
}
```

#### `POST /expenses`
- **Auth**: `Bearer <accessToken>`
- **Request Body**:
```json
{
  "title": "Dinner at Fisherman's Wharf",
  "totalAmount": 3400,
  "currency": "INR",
  "date": "2026-05-11T20:00:00.000Z",
  "category": "Food",
  "groupId": "grp_1",
  "splitMethod": "EQUAL",
  "participants": [
    {
      "userId": "usr_2",
      "name": "Rahul Sharma",
      "paidAmount": 3400,
      "shareAmount": 1700,
      "netBalance": 1700
    },
    {
      "userId": "usr_me",
      "name": "Alex Johnson",
      "paidAmount": 0,
      "shareAmount": 1700,
      "netBalance": -1700
    }
  ]
}
```

#### `PATCH /expenses/:id`
- **Auth**: `Bearer <accessToken>`
- Updates expense details or participants.

#### `DELETE /expenses/:id`
- **Auth**: `Bearer <accessToken>`

#### `POST /expenses/:id/comments`
- **Auth**: `Bearer <accessToken>`
- **Request Body**:
```json
{
  "text": "Receipt uploaded in drive folder!"
}
```

---

### 3.7 Settlements Endpoints

#### `GET /settlements`
- **Auth**: `Bearer <accessToken>`
- **Query Params**: `?groupId=grp_1` (optional)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "set_1",
      "payerId": "usr_2",
      "payerName": "Rahul Sharma",
      "receiverId": "usr_me",
      "receiverName": "Alex Johnson",
      "amount": 1200,
      "currency": "INR",
      "date": "2026-05-12T10:00:00.000Z",
      "paymentMethod": "UPI",
      "status": "CONFIRMED",
      "referenceNumber": "UPI-408912389102",
      "createdAt": "2026-05-12T10:05:00.000Z"
    }
  ]
}
```

#### `POST /settlements`
- **Auth**: `Bearer <accessToken>`
- **Request Body**:
```json
{
  "payerId": "usr_me",
  "payerName": "Alex Johnson",
  "receiverId": "usr_2",
  "receiverName": "Rahul Sharma",
  "amount": 1200,
  "currency": "INR",
  "date": "2026-05-12T10:00:00.000Z",
  "paymentMethod": "UPI",
  "status": "PENDING",
  "referenceNumber": "UPI-408912389102",
  "notes": "Settled via PhonePe"
}
```

#### `POST /settlements/:id/confirm`
- **Auth**: `Bearer <accessToken>`
- Sets settlement status to `CONFIRMED` and reduces debt in backend ledger.

#### `POST /settlements/:id/reject`
- **Auth**: `Bearer <accessToken>`
- Sets settlement status to `REJECTED` and preserves existing debt.

---

### 3.8 Activity, Notifications & Search

#### `GET /activities`
- Returns chronological feed of expense creations, updates, settlements, and member joins.

#### `GET /notifications`
- Returns list of user notifications.

#### `PATCH /notifications/:id/read`
- Marks notification as read.

#### `GET /search?q=query`
- Returns matched groups, friends, and expenses.

---

## 4. Recommended Database Schema (Prisma ORM Example)

If you are using PostgreSQL with Prisma ORM:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String         @id @default(uuid())
  name            String
  email           String         @unique
  passwordHash    String?
  phoneNumber     String?        @unique
  upiId           String?
  avatarUrl       String?
  defaultCurrency String         @default("INR")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  groupMemberships GroupMember[]
  friendships      Friend[]      @relation("UserFriends")
  expensesPaid     ExpenseParticipant[]
  settlementsPaid  Settlement[]  @relation("PayerSettlements")
  settlementsRcvd  Settlement[]  @relation("ReceiverSettlements")
}

model Group {
  id          String        @id @default(uuid())
  name        String
  description String?
  category    String        @default("Other")
  currency    String        @default("INR")
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]
}

model GroupMember {
  id        String   @id @default(uuid())
  groupId   String
  userId    String
  role      String   @default("member")
  joinedAt  DateTime @default(now())

  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model Friend {
  id          String   @id @default(uuid())
  ownerId     String
  friendUserId String
  name        String
  email       String
  phoneNumber String?
  upiId       String?
  createdAt   DateTime @default(now())

  owner       User     @relation("UserFriends", fields: [ownerId], references: [id], onDelete: Cascade)
}

model Expense {
  id           String               @id @default(uuid())
  title        String
  totalAmount  Decimal              @db.Decimal(12, 2)
  currency     String               @default("INR")
  date         DateTime
  category     String               @default("Other")
  groupId      String?
  splitMethod  String               @default("EQUAL")
  notes        String?
  receiptUrl   String?
  createdBy    String
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt

  group        Group?               @relation(fields: [groupId], references: [id])
  participants ExpenseParticipant[]
  comments     ExpenseComment[]
}

model ExpenseParticipant {
  id          String   @id @default(uuid())
  expenseId   String
  userId      String
  paidAmount  Decimal  @db.Decimal(12, 2) @default(0)
  shareAmount Decimal  @db.Decimal(12, 2) @default(0)

  expense     Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])
}

model ExpenseComment {
  id        String   @id @default(uuid())
  expenseId String
  userId    String
  userName  String
  text      String
  createdAt DateTime @default(now())

  expense   Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
}

enum SettlementStatus {
  PENDING
  CONFIRMED
  REJECTED
}

model Settlement {
  id              String           @id @default(uuid())
  groupId         String?
  payerId         String
  receiverId      String
  amount          Decimal          @db.Decimal(12, 2)
  currency        String           @default("INR")
  date            DateTime
  paymentMethod   String           @default("UPI")
  status          SettlementStatus @default(CONFIRMED)
  referenceNumber String?
  notes           String?
  createdAt       DateTime         @default(now())

  group           Group?           @relation(fields: [groupId], references: [id])
  payer           User             @relation("PayerSettlements", fields: [payerId], references: [id])
  receiver        User             @relation("ReceiverSettlements", fields: [receiverId], references: [id])
}
```

---

## 5. How to Connect SplitMate to Your Backend

1. **Start Your Backend**:
   - Run your backend on port `3000` (or your preferred port).
2. **Open SplitMate**:
   - Navigate to **Account & Settings (Profile Screen)**.
   - Tap **"Backend & Server API"**.
   - Select your preset:
     - **Android Emulator**: `http://10.0.2.2:3000/api/v1`
     - **iOS Simulator**: `http://localhost:3000/api/v1`
     - **Physical Device**: `http://YOUR_WIFI_IP:3000/api/v1`
   - Switch mode from **"Mock Adapter"** to **"Live Backend (REST)"**.
   - Tap **"Test Ping"** to verify connection.
   - Tap **"Apply & Save"**. SplitMate will immediately begin communicating with your live server!

