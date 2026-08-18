import React from 'react'

export default function PricingTable({ content }) {
    // content = { plans: [ { name, price, features: [] } ] }
    const plans = content?.plans || []

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mt-12 space-y-8 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-8 lg:max-w-5xl lg:mx-auto xl:max-w-none xl:grid-cols-4">
                {plans.map((plan) => (
                    <div 
                        key={plan.name} 
                        className={`relative flex flex-col transition-all duration-250 ease-transform ${
                            plan.featured 
                                ? 'bg-gradient-to-br from-[#0F172A] to-[#1E3A8A]' 
                                : 'bg-white border border-[#E2E8F0]'
                        } rounded-[20px] shadow-lg hover:-translate-y-[6px] hover:shadow-2xl`}
                        style={{
                            boxShadow: '0 8px 32px rgba(30,58,138,0.10)',
                            borderTop: plan.featured ? 'none' : '0px solid transparent',
                        }}
                        onMouseOver={(e) => {
                            if (!plan.featured) {
                                e.currentTarget.style.borderTop = '3px solid #F59E0B'
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!plan.featured) {
                                e.currentTarget.style.borderTop = '0px solid transparent'
                            }
                        }}
                    >
                        {plan.featured && (
                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#F59E0B] text-[#0F172A] text-sm font-bold">
                                Featured
                            </div>
                        )}
                        
                        {/* Card Top Banner */}
                        <div 
                            className="flex items-center justify-center"
                            style={{
                                height: '120px',
                                background: plan.featured 
                                    ? 'transparent' 
                                    : 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                            }}
                        >
                            <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                                style={{
                                    backgroundColor: 'white'
                                }}
                            >
                                {plan.name.charAt(0)}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 flex flex-col flex-1">
                            <h3 className={`text-lg font-bold mb-4 ${
                                plan.featured ? 'text-white' : 'text-[#0F172A]'
                            }`}>
                                {plan.name}
                            </h3>
                            <div className="mb-4">
                                <span className={`text-4xl font-extrabold ${
                                    plan.featured ? 'text-white' : 'text-[#0F172A]'
                                }`}>
                                    {plan.price}
                                </span>
                            </div>
                            <p className={`mb-6 leading-relaxed ${
                                plan.featured ? 'text-[#93C5FD]' : 'text-[#475569]'
                            }`}>
                                {plan.description}
                            </p>

                            <ul className="space-y-4 flex-1 mb-8">
                                {plan.features?.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <svg 
                                                className="h-6 w-6 text-[#16A34A]" 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className={`text-sm ${
                                            plan.featured ? 'text-[#93C5FD]' : 'text-[#374151]'
                                        }`}>
                                            {feature}
                                        </p>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="/membership"
                                className={`block w-full text-center py-3 rounded-[10px] font-bold transition-all duration-200 ${
                                    plan.featured 
                                        ? 'text-[#0F172A] hover:brightness-110' 
                                        : 'text-white hover:brightness-110'
                                }`}
                                style={{
                                    background: plan.featured 
                                        ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                                        : 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                                }}
                            >
                                Get started
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
