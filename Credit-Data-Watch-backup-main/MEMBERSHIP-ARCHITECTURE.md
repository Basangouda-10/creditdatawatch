# Membership & Payment System - Architecture Documentation

## Overview
Production-ready membership system with payment gateway integration, supporting multiple payment methods (UPI, Cards, Net Banking, QR), membership lifecycle management, and user theme preferences.

---

## 1. Database Schema

### 1.1 Plans Table (Enhanced)
```sql
plans
├── id (UUID, PK)
├── name (String) - "basic", "pro", "premium"
├── display_name (String) - "Basic", "Pro", "Premium"
├── description (Text)
├── duration_type (Enum) - "monthly", "yearly"
├── price (Float) - in INR
├── validity_days (Integer) - calculated from duration_type
├── follow_up_limit (Integer)
├── legal_assistance_limit (Integer)
├── is_active (Boolean)
├── created_at (DateTime)
└── updated_at (DateTime)
```

**Key Points:**
- `duration_type` determines if plan is monthly or yearly
- `price` stored per duration type (different price for monthly vs yearly)
- Admin can create separate plan entries for monthly/yearly of same tier

### 1.2 Subscriptions Table (Enhanced)
```sql
subscriptions
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id)
├── plan_id (UUID, FK -> plans.id)
├── status (Enum) - "active", "expired", "cancelled"
├── is_active (Boolean) - computed from status
├── start_date (DateTime)
├── expiry_date (DateTime)
├── payment_id (UUID, FK -> payments.id, nullable) - link to payment
├── created_at (DateTime)
└── updated_at (DateTime)
```

**Key Points:**
- `status` explicitly tracks: active, expired, cancelled
- `is_active` is a computed flag (status == 'active' && not expired)
- One active membership per user (enforced in service layer)
- `payment_id` links subscription to successful payment

### 1.3 Payments Table (NEW)
```sql
payments
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id)
├── plan_id (UUID, FK -> plans.id) - plan being purchased
├── amount (Float) - in INR
├── currency (String) - "INR"
├── payment_method (Enum) - "upi", "credit_card", "debit_card", "net_banking", "qr_code"
├── payment_provider (String) - "razorpay", "payu", "stripe", etc.
├── status (Enum) - "pending", "success", "failed", "cancelled"
├── transaction_id (String, unique) - gateway transaction ID
├── reference_id (String, unique) - internal reference
├── gateway_order_id (String) - payment gateway order ID
├── gateway_payment_id (String, nullable) - payment ID from gateway
├── failure_reason (Text, nullable) - if failed
├── metadata (JSON) - additional payment data (card last 4 digits, UPI ID, etc.)
├── initiated_at (DateTime)
├── completed_at (DateTime, nullable)
└── created_at (DateTime)
```

**Key Points:**
- Stores all payment attempts (successful and failed)
- `transaction_id` from payment gateway
- `reference_id` for internal tracking
- `metadata` stores non-sensitive payment info (last 4 digits, UPI ID, bank name)
- NO sensitive card details stored (PCI-DSS compliant)

### 1.4 UserSettings Table (NEW)
```sql
user_settings
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id, unique)
├── theme_preference (String) - "light", "dark", "system"
├── language (String, default "en")
├── notifications_enabled (Boolean, default true)
├── created_at (DateTime)
└── updated_at (DateTime)
```

**Key Points:**
- One settings record per user (1:1 relationship)
- `theme_preference` defaults to "system" (or "dark")
- Created automatically on user registration

---

## 2. Membership Lifecycle

### 2.1 States & Transitions

```
NO MEMBERSHIP
    ↓ (User purchases plan)
PENDING PAYMENT
    ↓ (Payment successful)
ACTIVE
    ↓ (Expiry date reached OR User cancels)
EXPIRED / CANCELLED
```

### 2.2 Detailed Flow

1. **User Registration**
   - User registered → NO membership
   - UserSettings created with default theme

2. **Plan Selection**
   - User browses `/membership` page
   - Sees available plans (Basic/Pro/Premium, Monthly/Yearly)
   - Selects plan → Redirect to payment

3. **Payment Initiation**
   - `POST /api/v1/payments/initiate`
   - Creates Payment record with `status: pending`
   - Returns payment options (UPI, Cards, Net Banking, QR)
   - Returns `reference_id` and `payment_id`

4. **Payment Processing**
   - User selects payment method
   - For UPI: Shows QR code + UPI ID
   - For Cards/Net Banking: Shows form
   - User completes payment on gateway

5. **Payment Verification**
   - Gateway callback/webhook → `POST /api/v1/payments/verify`
   - Verifies transaction with gateway
   - Updates Payment `status: success`
   - **ONLY NOW** activates subscription:
     - Creates Subscription record
     - Sets `status: active`
     - Calculates expiry_date
     - Links `payment_id` to subscription

6. **Active Membership**
   - User has access to premium features
   - Profile shows membership badge

7. **Expiry**
   - Background job checks `expiry_date < now()`
   - Updates Subscription `status: expired`
   - User loses premium access
   - Profile shows "Expired" badge

8. **Cancellation**
   - User cancels → `status: cancelled`
   - Membership ends immediately
   - No refund (unless specified in policy)

---

## 3. Payment Flow (Step-by-Step)

### 3.1 Payment Initiation

**Request:**
```http
POST /api/v1/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan_id": "uuid-of-plan",
  "payment_method": "upi" | "credit_card" | "debit_card" | "net_banking" | "qr_code"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated",
  "data": {
    "payment_id": "uuid",
    "reference_id": "REF123456789",
    "amount": 999.00,
    "currency": "INR",
    "plan": {
      "name": "Pro",
      "duration_type": "monthly"
    },
    "payment_options": {
      "upi": {
        "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=merchant@upi&pn=Company&am=999&cu=INR",
        "upi_id": "merchant@upi",
        "instructions": "Scan QR code or send money to UPI ID"
      },
      "card": {
        "gateway_url": "https://checkout.razorpay.com/v1/checkout.js",
        "order_id": "order_xyz"
      },
      "net_banking": {
        "banks": ["HDFC", "ICICI", "SBI", "Axis"],
        "gateway_url": "https://checkout.razorpay.com/v1/checkout.js"
      }
    }
  }
}
```

### 3.2 Payment Completion (Simulated Gateway)

**UPI Payment:**
- User scans QR or sends to UPI ID
- Frontend polls `GET /api/v1/payments/{payment_id}/status`
- When payment detected (simulated), calls verify

**Card/Net Banking Payment:**
- User fills form on gateway
- Gateway redirects to callback URL
- Callback calls verify endpoint

**Verification:**
```http
POST /api/v1/payments/{payment_id}/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "transaction_id": "TXN123456789",
  "gateway_order_id": "order_xyz",
  "gateway_payment_id": "pay_abc"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment successful",
  "data": {
    "payment_id": "uuid",
    "transaction_id": "TXN123456789",
    "status": "success",
    "subscription": {
      "id": "sub-uuid",
      "plan_name": "Pro",
      "start_date": "2026-01-05T10:00:00Z",
      "expiry_date": "2026-02-05T10:00:00Z",
      "status": "active"
    }
  }
}
```

### 3.3 Payment Status Check

```http
GET /api/v1/payments/{payment_id}/status
```

Returns current payment status (pending/success/failed).

---

## 4. API Endpoints

### 4.1 Membership & Plans

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/membership/plans` | List all available plans | Public |
| GET | `/api/v1/membership/status` | Get user's membership status | Required |
| GET | `/api/v1/membership/history` | Get user's membership history | Required |

### 4.2 Payment

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/payments/initiate` | Initiate payment for plan | Required |
| POST | `/api/v1/payments/{id}/verify` | Verify payment completion | Required |
| GET | `/api/v1/payments/{id}/status` | Get payment status | Required |
| GET | `/api/v1/payments/history` | Get user's payment history | Required |
| POST | `/api/v1/payments/{id}/cancel` | Cancel pending payment | Required |

### 4.3 User Settings (Theme)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/user/settings` | Get user settings (theme) | Required |
| PUT | `/api/v1/user/settings` | Update user settings (theme) | Required |

### 4.4 User Profile (Enhanced)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/user/profile` | Get user profile with membership | Required |

---

## 5. Payment Gateway Simulation

Since we're not integrating real payment gateway yet, we'll simulate:

1. **UPI**: User "confirms" payment → frontend calls verify with fake transaction_id
2. **Cards**: User enters card details → frontend generates fake transaction_id → calls verify
3. **Net Banking**: User selects bank → frontend generates fake transaction_id → calls verify

**In Production:** Replace simulation with real gateway (Razorpay, PayU, Stripe).

---

## 6. Sample JSON Responses

### 6.1 Membership Status

```json
{
  "success": true,
  "data": {
    "has_membership": true,
    "membership": {
      "id": "sub-uuid",
      "plan_name": "Pro",
      "plan_display_name": "Pro Plan",
      "duration_type": "monthly",
      "status": "active",
      "start_date": "2026-01-05T10:00:00Z",
      "expiry_date": "2026-02-05T10:00:00Z",
      "days_remaining": 25
    },
    "payment": {
      "transaction_id": "TXN123456789",
      "amount": 999.00,
      "payment_method": "upi",
      "paid_at": "2026-01-05T10:15:00Z"
    }
  }
}
```

### 6.2 No Membership

```json
{
  "success": true,
  "data": {
    "has_membership": false,
    "membership": null,
    "message": "No active membership. Purchase a plan to access premium features."
  }
}
```

### 6.3 Payment History

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay-uuid-1",
        "plan_name": "Pro",
        "amount": 999.00,
        "status": "success",
        "payment_method": "upi",
        "transaction_id": "TXN123",
        "created_at": "2026-01-05T10:00:00Z"
      },
      {
        "id": "pay-uuid-2",
        "plan_name": "Premium",
        "amount": 1999.00,
        "status": "failed",
        "payment_method": "credit_card",
        "failure_reason": "Insufficient funds",
        "created_at": "2026-01-01T10:00:00Z"
      }
    ],
    "total": 2
  }
}
```

### 6.4 User Settings

```json
{
  "success": true,
  "data": {
    "theme_preference": "dark",
    "language": "en",
    "notifications_enabled": true
  }
}
```

---

## 7. Security & Best Practices

### 7.1 Payment Security
- ❌ **NEVER** store card numbers, CVV, or PIN
- ✅ Store only transaction IDs and reference IDs
- ✅ Use HTTPS for all payment endpoints
- ✅ Validate payment amounts server-side
- ✅ Verify ownership before activating subscription

### 7.2 Membership Activation
- ✅ Membership activates **ONLY** after payment verification
- ✅ No auto-assignment of free plans
- ✅ One active membership per user (enforce in service)
- ✅ Expired memberships cannot be reactivated without renewal

### 7.3 Data Integrity
- ✅ Use database transactions for payment + subscription creation
- ✅ Rollback on payment verification failure
- ✅ Atomic operations (payment success → subscription creation)

---

## 8. Frontend Integration Points

### 8.1 Membership Page
- List plans (Basic/Pro/Premium, Monthly/Yearly)
- "Buy Now" button → `/payments/initiate?plan_id=xxx`

### 8.2 Payment Page
- Payment method selection (UPI, Cards, Net Banking, QR)
- For UPI: Display QR code and UPI ID
- For Cards: Payment form (card number, CVV, expiry)
- For Net Banking: Bank selection dropdown
- Poll payment status or wait for callback

### 8.3 Profile Page
- Membership badge (Active / Expired / None)
- Membership details section:
  - Plan name
  - Status
  - Expiry date
  - Days remaining
- Payment history tab

### 8.4 Theme Toggle
- Theme toggle in header/navbar
- Persists preference to database
- Applies theme immediately (CSS classes or CSS variables)

---

## 9. Migration Strategy

1. Add new columns to existing tables (Subscription.status, Plan.duration_type)
2. Create new tables (payments, user_settings)
3. Migrate existing subscriptions (set status = 'active' if is_active = true)
4. Create default user_settings for existing users
5. Update frontend to use new endpoints

---

## 10. Testing Scenarios

### 10.1 Happy Path
- User purchases plan → Payment successful → Membership active

### 10.2 Payment Failure
- Payment fails → Membership NOT activated → User can retry

### 10.3 Expiry
- Membership expires → Status = expired → User loses access

### 10.4 Multiple Payments
- User initiates payment → Abandons → Starts new payment → Old payment auto-cancelled

### 10.5 Theme Persistence
- User changes theme → Logs out → Logs in → Theme persists

---

## Next Steps

1. ✅ Create database models
2. ✅ Create payment service
3. ✅ Create API endpoints
4. ✅ Update subscription service
5. ✅ Create frontend components
6. ✅ Add theme toggle
7. ✅ Write tests
