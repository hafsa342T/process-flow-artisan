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
  Home,
  User
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientDetailsForm } from '@/components/ClientDetailsForm';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'confirmed' | 'error'>('processing');
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  
  // Get URL parameters - try both session_id and sessionId
  const email = searchParams.get('email') || '';
  const industry = searchParams.get('industry') || '';
  const sessionId = searchParams.get('session_id') || searchParams.get('sessionId') || '';

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      // Skip edge function call and go straight to form if we have email and industry
      if (email && industry) {
        console.log('Payment parameters found, proceeding to form');
        setPaymentStatus('confirmed');
        setShowDetailsForm(true);
        setIsProcessing(false);
        return;
      }

      if (!sessionId) {
        setPaymentStatus('error');
        setIsProcessing(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('handle-payment-success', {
          body: { sessionId }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        setPaymentStatus('confirmed');
        setShowDetailsForm(true);
      } catch (error) {
        console.error('Error processing payment success:', error);
        // If edge function fails but we have the basic info, still proceed
        if (email && industry) {
          setPaymentStatus('confirmed');
          setShowDetailsForm(true);
        } else {
          setPaymentStatus('error');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [sessionId, email, industry]);

  const handleDownload = (format: string) => {
    // TODO: Implement actual download functionality with branded reports
    console.log(`Downloading ${format} for ${industry}`);
  };

  // Show client details form if payment confirmed and details not submitted yet
  if (showDetailsForm && !detailsSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto space-y-8 pt-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Payment Confirmed!</h1>
              <p className="text-lg text-muted-foreground">
                Please provide your business details to complete your premium report order
              </p>
            </div>
          </div>

          {/* Client Details Form */}
          <ClientDetailsForm
            email={email}
            industry={industry}
            onSubmitSuccess={() => setDetailsSubmitted(true)}
          />
        </div>
      </div>
    );
  }

  // Show final confirmation after details are submitted
  if (detailsSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="max-w-2xl mx-auto space-y-8 pt-16">
          {/* Success Header */}
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">All Set!</h1>
              <p className="text-lg text-muted-foreground">
                Your consultant is now working on your custom report
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Order Details Submitted
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
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Report In Progress
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <h4 className="font-medium">Business Details Received</h4>
                    <p className="text-sm text-muted-foreground">
                      Our consultant has all your business information and process data
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Custom Report Creation</h4>
                    <p className="text-sm text-muted-foreground">
                      Expert ISO 9001 consultant creates your branded report with your logo and specific requirements
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Report Delivery</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive your complete premium report with all formats via email
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected Delivery - Updated to 48H */}
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="font-medium">Expected Delivery</div>
                  <div className="text-sm text-muted-foreground">
                    Your consultant will complete your report within <strong>48 hours</strong> and send it to {email}
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
              Questions about your order? Contact our support team at{' '}
              <a href="mailto:support@qse-academy.com" className="text-primary hover:underline">
                support@qse-academy.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              Verifying your payment...
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
      </div>
    </div>
  );
};

export default PaymentSuccess;