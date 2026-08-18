# CreditDataWatch - Complete Component Files

This document contains all component files for the CreditDataWatch application. 
Create the directory structure first (see SETUP-GUIDE.md), then copy these files to their respective locations.

## Layout Components

### src/components/layout/MainLayout.jsx
```javascript
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
```

### src/components/layout/Header.jsx
```javascript
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/' },
    { 
      name: 'Services', 
      href: '#',
      submenu: [
        { name: 'Credit Repair', href: '/services/credit-repair' },
        { name: 'Credit Monitoring', href: '/services/credit-monitoring' },
        { name: 'Debt Management', href: '/services/debt-management' },
        { name: 'Credit Education', href: '/services/credit-education' },
      ]
    },
    { 
      name: 'Solutions', 
      href: '#',
      submenu: [
        { name: 'For Individuals', href: '/solutions/individuals' },
        { name: 'For Businesses', href: '/solutions/businesses' },
      ]
    },
    { name: 'Book Appointment', href: '/appointment' },
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="font-heading font-bold text-xl text-gray-900">
              CreditDataWatch
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                {item.submenu ? (
                  <>
                    <button className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                      {item.name}
                    </button>
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="py-2">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.name}
                            to={subitem.href}
                            className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          >
                            {subitem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            <Link to="/auth/login" className="btn-secondary text-sm">
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden mt-4 pb-4"
          >
            {navigation.map((item) => (
              <div key={item.name} className="py-2">
                {item.submenu ? (
                  <>
                    <div className="font-medium text-gray-900 mb-2">{item.name}</div>
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        to={subitem.href}
                        className="block py-2 pl-4 text-gray-600 hover:text-primary-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className="block text-gray-700 hover:text-primary-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            <Link
              to="/auth/login"
              className="block mt-4 btn-secondary text-center text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          </motion.div>
        )}
      </nav>
    </header>
  )
}
```

### src/components/layout/Footer.jsx
```javascript
import { Link } from 'react-router-dom'

export default function Footer() {
  const footerLinks = {
    services: [
      { name: 'Credit Repair', href: '/services/credit-repair' },
      { name: 'Credit Monitoring', href: '/services/credit-monitoring' },
      { name: 'Debt Management', href: '/services/debt-management' },
      { name: 'Credit Education', href: '/services/credit-education' },
    ],
    solutions: [
      { name: 'For Individuals', href: '/solutions/individuals' },
      { name: 'For Businesses', href: '/solutions/businesses' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="font-heading font-bold text-xl text-white">
                CreditDataWatch
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Professional credit solutions and financial services for individuals and businesses.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-primary-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Solutions</h3>
            <ul className="space-y-2">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-primary-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-primary-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} CreditDataWatch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
```

## Home Page Sections

### src/components/home/HeroSection.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white section-padding">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
              Transform Your Credit, Transform Your Life
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Professional credit repair and financial solutions backed by expert guidance and proven results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/appointment" className="btn-accent">
                Book Free Consultation
              </Link>
              <Link to="/services/credit-repair" className="btn-secondary bg-white/10 border-white text-white hover:bg-white/20">
                Explore Services
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:block"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Expert Analysis</h3>
                    <p className="text-primary-100">Comprehensive credit evaluation</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Fast Results</h3>
                    <p className="text-primary-100">See improvements in 30-60 days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Secure & Confidential</h3>
                    <p className="text-primary-100">Your data is protected</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
```

### src/components/home/ScamAlertSection.jsx
```javascript
import { motion } from 'framer-motion'

export default function ScamAlertSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-red-50 border-l-4 border-red-500 py-8"
    >
      <div className="container-custom">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-red-900 mb-2">
              ⚠️ Beware of Credit Repair Scams
            </h3>
            <p className="text-red-800 mb-3">
              Protect yourself from fraudulent companies promising instant credit fixes. Learn to identify legitimate credit repair services.
            </p>
            <ul className="space-y-2 text-red-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>No company can legally remove accurate negative information from your credit report</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Legitimate services never ask for payment before delivering results</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Be cautious of companies that discourage you from contacting credit bureaus directly</span>
              </li>
            </ul>
            <a href="#" className="inline-block mt-4 text-red-700 font-semibold hover:text-red-900 underline">
              Learn More About Credit Scams →
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
```

### src/components/home/ServicesGridSection.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function ServicesGridSection() {
  const services = [
    {
      title: 'Credit Repair',
      description: 'Remove inaccuracies and negative items from your credit report with our expert dispute process.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/services/credit-repair',
      color: 'bg-blue-500',
    },
    {
      title: 'Credit Monitoring',
      description: '24/7 credit monitoring with instant alerts for any changes to your credit report.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      href: '/services/credit-monitoring',
      color: 'bg-green-500',
    },
    {
      title: 'Debt Management',
      description: 'Strategic debt consolidation and management plans to help you become debt-free faster.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/services/debt-management',
      color: 'bg-purple-500',
    },
    {
      title: 'Credit Education',
      description: 'Comprehensive resources and personalized coaching to help you understand and improve your credit.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/services/credit-education',
      color: 'bg-orange-500',
    },
  ]

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive credit solutions tailored to your unique financial situation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={service.href} className="block h-full">
                <div className="card h-full hover:scale-105 transition-transform duration-300">
                  <div className={`${service.color} w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <span className="text-primary-600 font-semibold inline-flex items-center">
                    Learn More
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### src/components/home/SolutionsSection.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function SolutionsSection() {
  const solutions = [
    {
      title: 'For Individuals',
      description: 'Personal credit repair, score improvement, and financial planning services designed for your unique needs.',
      features: [
        'Personalized credit analysis',
        'Dispute resolution assistance',
        'Credit score monitoring',
        'Financial literacy resources',
      ],
      href: '/solutions/individuals',
      image: 'bg-gradient-to-br from-blue-500 to-blue-700',
    },
    {
      title: 'For Businesses',
      description: 'Enterprise credit solutions, business credit building, and commercial debt management services.',
      features: [
        'Business credit reports',
        'Trade line establishment',
        'Vendor credit accounts',
        'Commercial debt restructuring',
      ],
      href: '/solutions/businesses',
      image: 'bg-gradient-to-br from-purple-500 to-purple-700',
    },
  ]

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            Tailored Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whether you're an individual or business, we have the right solution for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="card group"
            >
              <div className={`${solution.image} h-48 -m-6 mb-6 rounded-t-xl flex items-center justify-center text-white`}>
                <h3 className="text-3xl font-heading font-bold">{solution.title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{solution.description}</p>
              <ul className="space-y-3 mb-6">
                {solution.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={solution.href}
                className="btn-primary w-full text-center group-hover:scale-105 transition-transform"
              >
                Explore Solutions
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### src/components/home/StatsSection.jsx
```javascript
import { motion } from 'framer-motion'

export default function StatsSection() {
  const stats = [
    { value: '50K+', label: 'Clients Served', icon: '👥' },
    { value: '98%', label: 'Success Rate', icon: '📈' },
    { value: '100pts', label: 'Avg Score Increase', icon: '⭐' },
    { value: '45 Days', label: 'Avg Result Time', icon: '⚡' },
  ]

  return (
    <section className="section-padding bg-primary-600 text-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Proven Track Record
          </h2>
          <p className="text-xl text-primary-100">
            Numbers that speak to our commitment and expertise
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-4xl md:text-5xl font-heading font-bold mb-2">
                {stat.value}
              </div>
              <div className="text-primary-100">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### src/components/home/TestimonialSection.jsx
```javascript
import { motion } from 'framer-motion'

export default function TestimonialSection() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Small Business Owner',
      content: 'CreditDataWatch helped me increase my credit score by 150 points in just 4 months. Now I qualified for the business loan I needed!',
      rating: 5,
      avatar: 'SJ',
    },
    {
      name: 'Michael Chen',
      role: 'First-time Home Buyer',
      content: 'The team was professional, transparent, and delivered results. I went from a 580 to a 720 credit score and bought my dream home.',
      rating: 5,
      avatar: 'MC',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Recent Graduate',
      content: 'Amazing credit education resources! They taught me how to build and maintain good credit from scratch. Highly recommended!',
      rating: 5,
      avatar: 'ER',
    },
  ]

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600">
            Real stories from real people
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 italic">"{testimonial.content}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### src/components/home/FAQSection.jsx
```javascript
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'How long does credit repair take?',
      answer: 'Most clients see initial results within 30-45 days. Complete credit repair typically takes 3-6 months depending on the complexity of your credit issues.',
    },
    {
      question: 'Can you guarantee specific results?',
      answer: 'While we cannot legally guarantee specific results, we have a 98% success rate in removing inaccurate, outdated, or unverifiable negative items from credit reports.',
    },
    {
      question: 'Is credit repair legal?',
      answer: 'Yes, credit repair is completely legal under the Fair Credit Reporting Act (FCRA). You have the legal right to dispute inaccurate information on your credit report.',
    },
    {
      question: 'How much does it cost?',
      answer: 'Our pricing varies based on your specific needs. We offer flexible payment plans starting from $79/month. Book a free consultation to get a personalized quote.',
    },
    {
      question: 'Will credit repair hurt my score?',
      answer: 'No, legitimate credit repair will not hurt your score. Disputing inaccurate items can only help improve your credit score over time.',
    },
  ]

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Got questions? We've got answers
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="card cursor-pointer"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </h3>
                  <svg
                    className={`w-6 h-6 text-primary-600 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-gray-600 mt-4 pt-4 border-t border-gray-200">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

### src/components/home/CTASection.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function CTASection() {
  return (
    <section className="section-padding bg-gradient-to-r from-accent-500 to-accent-600 text-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Ready to Take Control of Your Credit?
          </h2>
          <p className="text-xl mb-8 text-accent-50">
            Book a free consultation today and discover how we can help you achieve your financial goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/appointment" className="btn-primary bg-white text-accent-600 hover:bg-gray-100">
              Book Free Consultation
            </Link>
            <Link to="/auth/register" className="btn-secondary border-white text-white hover:bg-white/10">
              Create Account
            </Link>
          </div>
          <p className="mt-6 text-accent-100 text-sm">
            No credit card required • Free consultation • 100% confidential
          </p>
        </motion.div>
      </div>
    </section>
  )
}
```

## Continue in next file for remaining components...
