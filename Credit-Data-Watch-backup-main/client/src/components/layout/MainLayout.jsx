import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ChatAssistant from '../common/ChatAssistant'
import MobileBottomNav from '../ui/MobileBottomNav'
import CTASection from '../home/CTASection'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-16 md:pb-0">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <CTASection />
      <Footer />
      <ChatAssistant />
      <MobileBottomNav />
    </div>
  )
}
