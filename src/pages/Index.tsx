import { useEffect, useState } from 'react';
import { ProcessMappingTool } from '@/components/ProcessMappingTool';
import PaymentSuccess from '@/pages/PaymentSuccess';

const Index = () => {
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    // Check if we're being redirected from Stripe payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      setShowPaymentSuccess(true);
    }
  }, []);

  if (showPaymentSuccess) {
    return <PaymentSuccess />;
  }

  return <ProcessMappingTool />;
};

export default Index;
