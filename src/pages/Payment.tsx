import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  CheckCircle, 
  Star, 
  Download, 
  FileText, 
  Image, 
  FileSpreadsheet,
  Shield,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const email = searchParams.get('email') || '';
  const industry = searchParams.get('industry') || '';

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      console.log('Processing payment for:', { email, industry });
      
      // Get process data from localStorage (stored during process mapping)
      const processDataStr = localStorage.getItem('processData');
      if (!processDataStr) {
        throw new Error('No process data found. Please create a process map first.');
      }
      
      const processData = JSON.parse(processDataStr);
      
      // Create Stripe checkout session
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          email, 
          industry,
          processData 
        }
      });
      
      if (error) {
        throw new Error(`Payment error: ${error.message}`);
      }
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    {
      icon: Crown,
      title: "Custom Branded Report",
      description: "Your company logo and branding throughout the report"
    },
    {
      icon: UserCheck,
      title: "Expert Consultant Review",
      description: "Professional validation and recommendations from ISO 9001 experts"
    },
    {
      icon: Download,
      title: "All Download Formats",
      description: "PDF, CSV, JSON, and PNG diagram formats included"
    },
    {
      icon: Shield,
      title: "Compliance Guarantee",
      description: "Ensure your processes meet ISO 9001:2015 requirements"
    },
    {
      icon: Sparkles,
      title: "Priority Support",
      description: "Direct access to our quality management specialists"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-8 pt-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="gap-2">
            <Crown className="h-4 w-4" />
            Premium Report Service
          </Badge>
          <h1 className="text-4xl font-bold">Upgrade Your Process Report</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get your ISO 9001 process map professionally reviewed, branded with your company identity, 
            and validated by our expert consultants.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Features */}
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Premium Features
              </CardTitle>
              <CardDescription>
                What you get with the premium branded report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                Best Value
              </Badge>
            </div>
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl">Premium Report Package</CardTitle>
              <div className="text-4xl font-bold text-primary">$99</div>
              <CardDescription>One-time payment • Delivery within 48 hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Custom branded PDF report
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Expert consultant validation
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  All download formats (PDF, CSV, JSON, PNG)
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  ISO 9001:2015 compliance review
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Implementation recommendations
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <strong>For:</strong> {industry}
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {email}
                </div>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full h-12 text-lg gap-2"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Crown className="h-5 w-5" />
                    Get Premium Report
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe • 30-day money-back guarantee
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What's Included */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included in Your Premium Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium">Branded PDF</h4>
                <p className="text-sm text-muted-foreground">Professional report with your company branding</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-medium">Data Export</h4>
                <p className="text-sm text-muted-foreground">CSV and JSON formats for further analysis</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
                  <Image className="h-6 w-6 text-warning" />
                </div>
                <h4 className="font-medium">Visual Diagram</h4>
                <p className="text-sm text-muted-foreground">High-quality process flow diagrams</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <UserCheck className="h-6 w-6 text-success" />
                </div>
                <h4 className="font-medium">Expert Review</h4>
                <p className="text-sm text-muted-foreground">Professional validation and recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;