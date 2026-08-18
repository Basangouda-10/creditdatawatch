# CreditDataWatch Requirements (Client Summary)

- Product: Business credit management platform for GST-registered entities (B2B + MSME).
- Mandatory: GST registration; registration != subscription; subscription required for continued access.
- Core goals: report overdue payers, manage business credit/debt, enable formal trade validation, improve credit score & collections.

## Routes / Pages
- `/` Home
- `/about`
- `/services` overview
- `/services/report-overdue`
- `/services/credit-management`
- `/services/partners-report`
- `/services/finalization`
- `/solutions` overview
- `/solutions/b2b`
- `/solutions/msme`
- `/solutions/business-credit`
- `/solutions/business-debt`
- `/offerings`
- `/contact`
- `/auth` (landing) + `/auth/login` + `/auth/register`
- `/appointment`

## Home Page Tiles
1) Hero: "India’s Credit Intelligence Hub – Streamline Your Business Credit Transactions" with trade validation, GST-only badge.
2) Scam Alert banner.
3) Services overview cards (report overdue, credit management, partners report, finalization).
4) Solutions overview (B2B, MSME, Business Credit, Business Debt) with bullets and images/gradients.
5) Stats section with metrics UI.
6) Customer testimonial.
7) Help & Education (FAQ/accordion: credit score, best practices, subscription vs registration, GST notice, registration procedure video link).
8) CTA: "Ready to begin?" + Book Appointment.
9) Footer: Other Pages, Services, Solutions, Reach Us.

## UX / UI
- Tech: React + Vite + Tailwind + Framer Motion + React Router.
- Animations: entrance + hover micro-interactions; gradients for hero/solutions; cards with shadow/scale.
- Typography: Inter for body, Poppins for headings (from index.html preload).
- Buttons: primary, secondary, accent utility classes in `index.css`.

## Future Backend Hooks
- GSTIN validation on register/login.
- Overdue report intake (invoice, PO, proof uploads).
- Reminder cadence engine.
- Partner report sharing (visibility controls).
- Finalization audit trails and document storage.
- Appointments scheduling endpoint.

## Non-Goals (current phase)
- Real auth, uploads, or API calls (UI-first).
- Payment/subscription checkout.
