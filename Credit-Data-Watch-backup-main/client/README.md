# CreditDataWatch

Professional business credit management platform built with React + Vite + Tailwind CSS.

## Project Structure

```
credit-data-watch/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/   # Header, Footer, MainLayout
│   │   │   ├── home/     # Home page sections
│   │   │   └── common/   # Reusable components
│   │   ├── pages/        # Route pages
│   │   │   ├── services/ # Service detail pages
│   │   │   ├── solutions/ # Solution detail pages
│   │   │   └── auth/     # Auth pages
│   │   ├── routes/       # Route configuration
│   │   ├── services/     # API service layer (future)
│   │   ├── utils/        # Utility functions
│   │   └── assets/       # Static assets
│   ├── docs/             # Documentation
│   │   ├── api-contract.md
│   │   └── requirements.md
│   └── public/           # Public static files
└── server/               # Backend (future)

```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd client
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:3000

### Build for Production

```bash
npm run build
npm run preview
```

## Features Implemented

### ✅ Pages & Routes
- **Home** (`/`) - Hero, Scam Alert, Services Grid, Solutions, Stats, Testimonial, FAQ, CTA
- **About** (`/about`)
- **Services** (`/services`) - Overview page
  - Report Overdue Payer (`/services/report-overdue`)
  - Credit Management (`/services/credit-management`)
  - Partners Credit Overdue Report (`/services/partners-report`)
  - Finalization Steps (`/services/finalization`)
- **Solutions** (`/solutions`) - Overview page
  - B2B Solutions (`/solutions/b2b`)
  - MSME Solutions (`/solutions/msme`)
  - Business Credit (`/solutions/business-credit`)
  - Business Debt (`/solutions/business-debt`)
- **Offerings** (`/offerings`)
- **Contact** (`/contact`)
- **Appointment** (`/appointment`) - Book consultation with GST validation
- **Auth**
  - Landing (`/auth`)
  - Login (`/auth/login`) - GST-validated login
  - Register (`/auth/register`) - GST-validated registration
- **404** - Not Found page

### ✅ Components
- Responsive Header with mobile menu
- Footer with multi-column links
- Animated sections using Framer Motion
- Form components (Contact, Appointment, Auth)
- Card-based layouts
- FAQ accordion with smooth animations

### ✅ Design System
- **Colors**: Primary (blue), Accent (amber), semantic colors
- **Typography**: Inter (body), Poppins (headings)
- **Utilities**: btn-primary, btn-secondary, btn-accent, card, section-padding
- **Animations**: Entrance animations, hover effects, smooth transitions

### ✅ Documentation
- API Contract (`client/docs/api-contract.md`) - Backend endpoints spec
- Requirements (`client/docs/requirements.md`) - Client brief summary

## Key Requirements Met

✅ GST-first approach (mandatory GSTIN validation in auth/forms)
✅ B2B + MSME focused workflows
✅ Trade validation & overdue reporting flows
✅ Modern animations (Framer Motion)
✅ Responsive design (mobile-first)
✅ All required routes from client brief
✅ Home page tiles (9 sections as specified)
✅ Services & Solutions pages
✅ Auth with GST validation messaging
✅ Appointment booking with GSTIN field
✅ API contract for backend team
✅ Clean component architecture

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Fonts**: Google Fonts (Inter, Poppins)

## Next Steps (Backend Integration)

1. Implement GSTIN validation API
2. Connect auth endpoints (login/register)
3. Implement file upload for overdue reports
4. Add reminder cadence engine
5. Partner report sharing system
6. Finalization workflow with document storage
7. Appointment scheduling backend
8. Stats/metrics real-time updates

## Development Standards

- ES6+ modules
- Functional components with hooks
- Mobile-first responsive design
- Consistent naming conventions
- Reusable utility classes
- Component-based architecture
- Route-based code splitting ready

## License

Proprietary - CreditDataWatch Platform
