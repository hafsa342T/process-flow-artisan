import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, CheckCircle, Download, FileText } from 'lucide-react';
import { ProcessMappingData } from './ProcessMappingTool';

interface EmailGateProps {
  data: ProcessMappingData;
  industry: string;
  onEmailSubmitted: (email: string) => void;
}

export const EmailGate: React.FC<EmailGateProps> = ({ data, industry, onEmailSubmitted }) => {
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
      // This would call your Supabase Edge Function to send the email
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

  const sendReportEmail = async (email: string, data: ProcessMappingData, industry: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // First generate the PDF report
      const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-pdf-report', {
        body: { processData: data, industry, userEmail: email }
      });
      
      if (pdfError) {
        console.error('PDF generation error:', pdfError);
        throw new Error('Failed to generate PDF report');
      }
      
      // Then send the email with the PDF attached
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: { 
          email, 
          processData: data, 
          industry,
          pdfReport: pdfData.pdf // Pass the generated PDF as base64
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
              Check your email for the complete process documentation, including downloadable formats.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => window.location.reload()}
            >
              <FileText className="h-4 w-4" />
              New Mapping
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={() => onEmailSubmitted(email)}
            >
              <Download className="h-4 w-4" />
              View Results
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
          Enter your email to receive and download your complete ISO 9001 process mapping report
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
          <h4 className="font-medium text-sm mb-2">Your report includes:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Complete process documentation ({data.processes.length} processes)</li>
            <li>• Process interaction diagrams</li>
            <li>• ISO 9001 clause mapping</li>
            <li>• Risk assessment summary</li>
            <li>• KPI recommendations</li>
            <li>• Downloadable formats (PDF, CSV, JSON)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};