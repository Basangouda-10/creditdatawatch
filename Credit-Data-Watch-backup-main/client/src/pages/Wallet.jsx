import { useEffect, useState } from 'react'
import { wallet } from '../services/api/apiClient'
import { useAuth } from '../state/authContext'

export default function Wallet() {
    const { user } = useAuth()
    const [balance, setBalance] = useState(0)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [redeemAmount, setRedeemAmount] = useState('')
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetchWalletData()
    }, [])

    const fetchWalletData = async () => {
        setLoading(true)
        try {
            // Parallel fetch balance and history
            const [balRes, histRes] = await Promise.all([
                wallet.getBalance(),
                wallet.getHistory()
            ])

            if (balRes.ok) setBalance(balRes.data?.balance || 0)
            if (histRes.ok) setHistory(histRes.data?.items || [])

        } catch (error) {
            console.error('Wallet fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRedeem = async (e) => {
        e.preventDefault()
        if (!redeemAmount || Number.isNaN(Number(redeemAmount)) || Number(redeemAmount) <= 0) {
            setMsg('Enter a valid amount')
            return
        }
        if (Number(redeemAmount) > balance) {
            setMsg('Insufficient balance')
            return
        }

        const res = await wallet.redeem(Number(redeemAmount), 'SUBSCRIPTION_DISCOUNT')
        if (res.ok) {
            setMsg(`Success! Redeemed ${redeemAmount} points.`)
            setRedeemAmount('')
            fetchWalletData() // Refresh
        } else {
            setMsg(res.error || 'Redemption failed')
        }
    }

    return (
        <section className="py-0 bg-[#F0F4FF]">
            {/* Navy Gradient Header */}
            <div 
                className="py-12 px-4 text-white text-center"
                style={{ 
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                }}
            >
                <div className="max-w-5xl mx-auto">
                    <p className="text-sm text-[#93C5FD] mb-2">Rewards & Credits</p>
                    <h1 className="text-3xl md:text-4xl font-bold">My Wallet</h1>
                    <p className="text-sm text-[#93C5FD] mt-2">Track your cashback points and referral earnings.</p>
                </div>
            </div>

            <div className="container-custom max-w-5xl mx-auto px-4 space-y-8 pt-8 pb-16">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Balance Card */}
                    <div 
                        className="rounded-[20px] p-8 text-white shadow-xl"
                        style={{ 
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                        }}
                    >
                        <p className="text-[#93C5FD] font-medium mb-3">Available Balance</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold">{loading ? '...' : balance}</span>
                            <span className="text-[#F59E0B] font-semibold text-2xl">pts</span>
                        </div>
                        <p className="text-xs text-[#93C5FD] mt-5 opacity-90">
                            1 Point = ₹1 (Applicable on Subscription renewals)
                        </p>
                    </div>

                    {/* Redeem Action */}
                    <div className="bg-white rounded-[20px] p-8 border border-[#E2E8F0] shadow-lg lg:col-span-2">
                        <h2 className="text-xl font-bold text-[#0F172A] mb-5">Redeem Points</h2>
                        <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-sm font-semibold text-[#374151]">Amount to redeem</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-[8px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                                    placeholder="Enter points"
                                    value={redeemAmount}
                                    onChange={(e) => setRedeemAmount(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || balance === 0}
                                className="py-3 px-6 rounded-[8px] text-white font-semibold text-sm transition-all duration-200"
                                style={{
                                    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                                }}
                            >
                                Apply to Subscription
                            </button>
                        </form>
                        {msg && <p className={`text-sm mt-4 font-medium ${msg.includes('Success') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{msg}</p>}

                        <div className="mt-6 p-5 bg-[#EFF6FF] rounded-[12px] border border-[#BFDBFE]">
                            <h3 className="text-sm font-bold text-[#0F172A] mb-3">How to earn?</h3>
                            <ul className="text-sm text-[#475569] space-y-2 list-disc list-inside">
                                <li>Report a defaulter successfully: <span className="font-semibold text-[#0F172A]">50 pts</span></li>
                                <li>Refer a business: <span className="font-semibold text-[#0F172A]">100 pts</span></li>
                                <li>Renew subscription early: <span className="font-semibold text-[#0F172A]">5% Cashback</span></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-[20px] p-8 border border-[#E2E8F0] shadow-lg">
                    <h2 className="text-xl font-bold text-[#0F172A] mb-6">Transaction History</h2>
                    <div className="overflow-x-auto border border-[#E2E8F0] rounded-[12px] shadow-sm">
                        <table className="min-w-full divide-y divide-[#E2E8F0]">
                            <thead className="bg-[#F9FAFB] sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Date</th>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Description</th>
                                    <th className="py-5 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Type</th>
                                    <th className="py-5 px-6 text-right text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#F3F4F6]">
                                {loading && <tr><td colSpan="4" className="py-12 text-center text-[#9CA3AF]">Loading...</td></tr>}
                                {!loading && history.length === 0 && (
                                    <tr><td colSpan="4" className="py-12 text-center text-[#9CA3AF]">No transactions found</td></tr>
                                )}
                                {history.map((tx) => (
                                    <tr key={tx.id} className="transition-colors duration-150 hover:bg-[#EFF6FF]/60 even:bg-[#F9FAFB]/60">
                                        <td className="py-5 px-6 whitespace-nowrap text-[#475569]">{new Date(tx.created_at).toLocaleDateString()}</td>
                                        <td className="py-5 px-6 font-medium text-[#0F172A]">{tx.reference_type || 'Transaction'}</td>
                                        <td className="py-5 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tx.trans_type === 'CREDIT' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                                                {tx.trans_type}
                                            </span>
                                        </td>
                                        <td className={`py-5 px-6 text-right font-bold ${tx.trans_type === 'CREDIT' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                                            {tx.trans_type === 'CREDIT' ? '+' : '-'}{tx.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    )
}
