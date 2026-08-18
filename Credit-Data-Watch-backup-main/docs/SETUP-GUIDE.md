# CreditDataWatch - Complete Setup Guide

## Prerequisites
- Node.js 18+ installed
- PowerShell 6+ (pwsh) or Windows PowerShell

## Quick Setup

### Step 1: Create Directory Structure

Run one of these commands in the project root:

**Option A - Using Node.js:**
```bash
node setup-dirs.js
```

**Option B - Using PowerShell:**
```powershell
.\setup-dirs.ps1
```

**Option C - Manual:**
```bash
mkdir src src\components src\components\layout src\components\home src\components\common src\pages src\routes src\services src\utils src\assets docs public
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

## Project Files Structure

All files are provided below. Copy them to their respective locations after creating the directory structure.

### Root Configuration Files

#### package.json
```json
{
  "name": "credit-data-watch",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "framer-motion": "^10.16.16"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8"
  }
}
```

#### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
```

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
    },
  },
  plugins: [],
}
```

#### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### .eslintrc.cjs
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

#### index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
    <title>CreditDataWatch - Professional Credit Solutions</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Source Files (src/)

#### src/main.jsx
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### src/App.jsx
```javascript
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
```

#### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans text-gray-900 antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}

@layer components {
  .container-custom {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  .btn-primary {
    @apply bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 shadow-md hover:shadow-lg;
  }

  .btn-secondary {
    @apply bg-white text-primary-600 px-6 py-3 rounded-lg font-medium border-2 border-primary-600 hover:bg-primary-50 transition-colors duration-200;
  }

  .btn-accent {
    @apply bg-accent-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-600 transition-colors duration-200 shadow-md hover:shadow-lg;
  }

  .card {
    @apply bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300;
  }

  .section-padding {
    @apply py-16 md:py-24;
  }
}
```

#### src/routes/index.jsx
```javascript
import { Routes, Route } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import Home from '../pages/Home'
import CreditRepair from '../pages/services/CreditRepair'
import CreditMonitoring from '../pages/services/CreditMonitoring'
import DebtManagement from '../pages/services/DebtManagement'
import CreditEducation from '../pages/services/CreditEducation'
import IndividualSolutions from '../pages/solutions/IndividualSolutions'
import BusinessSolutions from '../pages/solutions/BusinessSolutions'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Appointment from '../pages/Appointment'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        
        {/* Services Routes */}
        <Route path="services">
          <Route path="credit-repair" element={<CreditRepair />} />
          <Route path="credit-monitoring" element={<CreditMonitoring />} />
          <Route path="debt-management" element={<DebtManagement />} />
          <Route path="credit-education" element={<CreditEducation />} />
        </Route>

        {/* Solutions Routes */}
        <Route path="solutions">
          <Route path="individuals" element={<IndividualSolutions />} />
          <Route path="businesses" element={<BusinessSolutions />} />
        </Route>

        {/* Appointment */}
        <Route path="appointment" element={<Appointment />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Auth Routes (no layout) */}
      <Route path="auth">
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  )
}
```

---

## Next Steps After Setup

1. Review the color scheme in `tailwind.config.js` (Option A: Business blue vs Option B: Warm accent)
2. Run `npm run dev` to start development server
3. Access the application at `http://localhost:3000`
4. Continue with component implementation

## Troubleshooting

### PowerShell Execution Policy
If you get an error running .ps1 files:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js Not Found
Install Node.js from https://nodejs.org/ (LTS version recommended)

### Port Already in Use
Change the port in `vite.config.js` if 3000 is already in use.
