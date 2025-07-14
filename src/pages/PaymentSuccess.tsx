import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Download, 
  Mail, 
  Clock,
  ArrowRight,
  Home
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ClientDetailsForm from '@/components/ClientDetailsForm';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'confirmed' | 'error'>('processing');
  const [showForm, setShowForm] = useState(false);
  
  const email = searchParams.get('email') || '';
  const industry = searchParams.get('industry') || '';
  const sessionId = searchParams.get('session_id') || '';

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (!sessionId) {
        setPaymentStatus('error');
        setIsProcessing(false);
        return;
      }

      try {
        console.log('Processing payment success for session:', sessionId);
        
        const { data, error } = await supabase.functions.invoke('handle-payment-success', {
          body: { sessionId }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        console.log('Payment success processed:', data);
        setPaymentStatus('confirmed');
        setShowForm(true);
      } catch (error) {
        console.error('Error processing payment success:', error);
        setPaymentStatus('error');
      } finally {
        setIsProcessing(false);
      }
    };

    if (sessionId) {
      handlePaymentSuccess();
    } else {
      setIsProcessing(false);
    }
  }, [sessionId]);

  const handleFormSubmit = () => {
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto space-y-8 pt-16">
        {/* Success Header */}
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Payment Successful!</h1>
            <p className="text-lg text-muted-foreground">
              Your premium branded report is being prepared
            </p>
          </div>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Order Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Industry</div>
                <div className="font-medium">{industry}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Amount Paid</div>
                <div className="font-medium">$99.00</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                {isProcessing ? (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Verifying Payment...
                  </Badge>
                ) : paymentStatus === 'confirmed' ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Payment Confirmed
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    Payment Error
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Details Form or Completion Message */}
        {showForm ? (
          <ClientDetailsForm 
            email={email} 
            industry={industry} 
            onSubmit={handleFormSubmit}
          />
        ) : (
          <>
            {/* What Happens Next */}
            <Card>
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-medium">Details Submitted</h4>
                      <p className="text-sm text-muted-foreground">
                        Your business details have been sent to our consultant team
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Report Customization</h4>
                      <p className="text-sm text-muted-foreground">
                        Adding your company branding and expert recommendations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Delivery</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive your branded report via email within 48 hours
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expected Delivery */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Expected Delivery</div>
                    <div className="text-sm text-muted-foreground">
                      Within 48 hours to {email}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1 gap-2">
                <Home className="h-4 w-4" />
                Create New Mapping
              </Button>
              <Button 
                onClick={() => window.open('mailto:support@qse-academy.com', '_blank')} 
                className="flex-1 gap-2"
              >
                <Mail className="h-4 w-4" />
                Contact Support
              </Button>
            </div>

            {/* Footer Note */}
            <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
              <p>
                Need immediate assistance? Contact our support team at{' '}
                <a href="mailto:support@qse-academy.com" className="text-primary hover:underline">
                  support@qse-academy.com
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;