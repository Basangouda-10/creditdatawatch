# CreditDataWatch

Professional credit solutions and financial services platform built with React, Vite, and Tailwind CSS.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
credit-data-watch/
├── src/
│   ├── components/
│   │   ├── layout/      # Header, Footer, Layout shells
│   │   ├── home/        # Home page sections
│   │   └── common/      # Reusable UI components
│   ├── pages/           # Route pages
│   ├── routes/          # Route configuration
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   └── assets/          # Static assets
├── docs/                # Documentation
└── public/              # Public static files
```

## Features

- React 18 with Vite for fast development
- Tailwind CSS for styling
- Framer Motion for animations
- React Router for navigation
- Responsive design
- Component-based architecture
- JWT cookie-based authentication
- Google Drive integration for document management
- Phone OTP verification
- Multi-tier subscription plans

## Available Routes

- `/` - Home
- `/services/*` - Service pages
- `/solutions/*` - Solution pages
- `/auth/*` - Authentication pages
- `/appointment` - Book appointment
