'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { CreditCard, Wallet, Smartphone, Landmark, CheckCircle2, Lock } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  
  const [amount, setAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('CREDIT_CARD');

  const methods = [
    { id: 'CREDIT_CARD', name: 'Credit Card', icon: CreditCard },
    { id: 'DEBIT_CARD', name: 'Debit Card', icon: CreditCard },
    { id: 'UPI', name: 'UPI', icon: Smartphone },
    { id: 'WALLET', name: 'Digital Wallet', icon: Wallet },
  ];

  useEffect(() => {
    if (!bookingId) {
      toast.error('No booking ID provided');
      router.push('/bookings');
      return;
    }

    apiClient.get(`/bookings/${bookingId}`)
      .then(res => {
        const booking = res.data.data;
        if (booking.totalAmount !== null && booking.totalAmount !== undefined) {
          setAmount(Number(booking.totalAmount));
        } else {
          toast.error('Booking does not have a total amount calculated.');
          router.push('/bookings');
        }
      })
      .catch(() => {
        toast.error('Failed to fetch booking details');
        router.push('/bookings');
      })
      .finally(() => setIsLoading(false));
  }, [bookingId, router]);

  const handlePay = async () => {
    if (!bookingId) return;
    setIsProcessing(true);
    try {
      await apiClient.post('/payments', {
        bookingId,
        method: selectedMethod
      });
      toast.success('Payment successful!');
      router.push('/bookings');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center text-white relative">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white/90" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Secure Checkout</h1>
          <p className="text-white/70 text-sm">Please complete your payment to finalize the transaction</p>
          
          <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <p className="text-white/60 text-sm mb-1 uppercase tracking-wider font-semibold">Total Amount Due</p>
            <p className="text-4xl font-light tracking-tight">{amount !== null ? formatCurrency(amount) : '---'}</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left",
                  selectedMethod === method.id 
                    ? "border-blue-600 bg-blue-50/50" 
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  selectedMethod === method.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                )}>
                  <method.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 font-medium text-gray-900">
                  {method.name}
                </div>
                {selectedMethod === method.id && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors cursor-pointer shadow-sm disabled:opacity-70"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              <span>Pay {amount !== null ? formatCurrency(amount) : ''}</span>
            )}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> End-to-end encrypted transaction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentContent />
    </Suspense>
  );
}
