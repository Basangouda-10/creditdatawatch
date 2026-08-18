import { useEffect, useState } from 'react';
import { admin } from '../services/api/apiClient';

export default function AdminSettings() {
  const [paymentWindowDays, setPaymentWindowDays] = useState(50);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      const res = await admin.getSettings();
      if (res.ok) {
        setPaymentWindowDays(res.data.payment_window_days);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const res = await admin.updateSettings({ payment_window_days: paymentWindowDays });
    if (res.ok) {
      setStatusMessage('Settings saved successfully!');
    } else {
      setStatusMessage(res.error || 'Failed to save settings');
    }
  };

  return (
    <section className="py-6 md:py-8">
      <div className="container-custom space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-gray-900">Admin Settings</h1>
        </div>
        <div className="card flex-[1] space-y-3 self-start sticky top-4 rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Payment Window Days</label>
            <input
              type="number"
              value={paymentWindowDays}
              onChange={(e) => setPaymentWindowDays(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
            <button onClick={handleSave} className="btn-primary">
              Save
            </button>
            {statusMessage && (
              <p className="text-sm text-gray-600">
                {typeof statusMessage === 'object' ? (statusMessage.message || statusMessage.detail || JSON.stringify(statusMessage)) : String(statusMessage)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
