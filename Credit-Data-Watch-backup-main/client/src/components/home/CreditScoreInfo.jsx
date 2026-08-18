import { motion } from 'framer-motion'

export default function CreditScoreInfo() {
    return (
        <section className="section-padding bg-white">
            <div className="container-custom">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
                            What Goes Into Your Credit Score?
                        </h2>
                        <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                            <p>
                                Think of a credit score as a numerical summary of your payment habits. It is a three-digit number that tells suppliers how reliable you are based on your past transactions.
                            </p>
                            <p>
                                The score is calculated using an intelligent algorithm that evaluates key financial factors for businesses and individuals alike.
                            </p>
                        </div>

                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <h3 className="text-xl font-bold text-blue-900 mb-2">How Can We Help?</h3>
                            <p className="text-blue-800">
                                Master the three areas of Punctuality, Resolution, and Trust to unlock a higher credit score.
                            </p>
                        </div>
                    </motion.div>

                    {/* Best Practices List */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm"
                    >
                        <h3 className="text-2xl font-heading font-semibold mb-6">Best Practices for Enhancement</h3>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center">1</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Punctuality</h4>
                                    <p className="text-gray-600">Pay all bills on or before the due date.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center">2</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Resolution</h4>
                                    <p className="text-gray-600">Clear any outstanding dues listed on CreditDataWatch.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center">3</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Trust</h4>
                                    <p className="text-gray-600">Foster strong connections with your creditors.</p>
                                </div>
                            </li>
                        </ul>
                    </motion.div>

                </div>
            </div>
        </section>
    )
}
