# CreditDataWatch API Contract (Draft)

> Scope: aligns with frontend screens. GST validation is mandatory for authentication and service actions.

## Auth
- **POST /api/auth/register** — body: { companyName, email, password, phone, gstin }. Validates GSTIN, creates account. Response: { userId, token }.
- **POST /api/auth/login** — body: { email, password, gstin }. Validates GSTIN ownership. Response: { userId, token }.
- **POST /api/auth/refresh** — body: { refreshToken }. Response: { token }.

## Appointments
- **POST /api/appointments** — body: { company, email, phone, gstin, topic, date, notes }.

## Services
- **POST /api/services/report-overdue** — body: { invoiceNo, invoiceDate, amount, currency, counterpartyName, counterpartyGstin, poNumber?, deliveryProofUrls?, notes }. Response: { caseId }.
- **POST /api/services/credit-management/reminders** — body: { caseId, cadence: 'gentle'|'standard'|'aggressive', startDate }. Response: { reminderPlanId }.
- **POST /api/services/partners-report/share** — body: { caseId, partnerIds: string[], visibility: 'summary'|'detailed' }. Response: { shareId }.
- **POST /api/services/finalization** — body: { caseId, settlementDate, settlementAmount, settlementNotes, documents?: string[] }. Response: { finalized: true }.

## Solutions Data (read)
- **GET /api/solutions/b2b/insights** — returns portfolio risk snapshots.
- **GET /api/solutions/msme/playbooks** — returns guided steps for MSMEs.
- **GET /api/solutions/business-credit/score** — returns business credit indicators.
- **GET /api/solutions/business-debt/calendar** — returns upcoming dues and covenants.

## Shared
- Error format: { error: { code, message, details? } }
- Auth: Bearer tokens on protected endpoints; all service endpoints require authentication and GST match.
- Idempotency: recommend `Idempotency-Key` header for report/finalization posts.
- Pagination: GET endpoints accept `page`, `limit`, `sort`.
