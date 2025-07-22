import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, CheckCircle, FileText } from 'lucide-react';
import { ProcessMappingData } from './ProcessMappingTool';

interface EmailGateProps {
  data: ProcessMappingData;
  industry: string;
  onEmailSubmitted: (email: string) => void;
}

export const EmailGate: React.FC<EmailGateProps> = ({ data, industry, onEmailSubmitted }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // First, send email data to Zoho Flow webhook
      await sendToZohoWebhook(email, industry, data);
      
      // Then send the report email
      await sendReportEmail(email, data, industry);
      setIsSubmitted(true);
      onEmailSubmitted(email);
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendToZohoWebhook = async (email: string, industry: string, data: ProcessMappingData) => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('industry', industry);
      formData.append('timestamp', new Date().toISOString());
      formData.append('processes_count', data.processes.length.toString());
      formData.append('source', 'process_mapping_tool');

      const response = await fetch('https://flow.zoho.com/777366930/flow/webhook/incoming?zapikey=1001.273f2ba4967eab2af9311b9816e6500b.52a814c43916bb932e8b7cf456b47153&isdebug=false', {
        method: 'POST',
        body: formData,
        mode: 'no-cors' // Handle CORS issues
      });

      console.log('Zoho webhook triggered for email:', email);
    } catch (error) {
      console.error('Error sending to Zoho webhook:', error);
      // Don't throw error here - we still want to send the email even if webhook fails
    }
  };

  const sendReportEmail = async (email: string, data: ProcessMappingData, industry: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // Send basic email without PDF attachment
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: { 
          email, 
          processData: data, 
          industry,
          isBasicReport: true // Flag to indicate this is a basic report
        }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Failed to send email');
      }
      
      return result;
    } catch (error) {
      console.error('Error in sendReportEmail:', error);
      throw error;
    }
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-md mx-auto animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <CardTitle className="text-xl">Report Sent Successfully!</CardTitle>
          <CardDescription>
            Your ISO 9001 process mapping report has been sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Your basic process overview has been sent to {email}. Upgrade to premium for branded reports and expert validation.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => window.open('https://www.qse-academy.com/iso-9001-process-mapping-tool/', '_blank')}
            >
              <FileText className="h-4 w-4" />
              New Mapping
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={() => navigate(`/payment?email=${encodeURIComponent(email)}&industry=${encodeURIComponent(industry)}`)}
            >
              <CheckCircle className="h-4 w-4" />
              Get Premium Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto animate-fade-in">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Get Your Process Report</CardTitle>
        <CardDescription>
          Enter your email to receive your basic process overview and unlock premium branded reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="h-11"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full h-11 gap-2" 
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Report...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send My Report
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Your email will only be used to send the report. We respect your privacy.
            </p>
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Your basic report includes:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Process overview ({data.processes.length} processes identified)</li>
            <li>• Basic process structure</li>
            <li>• ISO 9001 clause mapping</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-border/50">
            <h4 className="font-medium text-sm mb-1">Upgrade to Premium for:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Custom branded PDF report</li>
              <li>• Expert consultant validation</li>
              <li>• All download formats (PDF, CSV, JSON, PNG)</li>
              <li>• Implementation recommendations</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};