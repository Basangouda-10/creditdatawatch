import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import { AuthProvider } from './state/authContext'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
