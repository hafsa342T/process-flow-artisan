import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Building, FileText, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientDetailsFormProps {
  email: string;
  industry: string;
  onSubmit: () => void;
}

const ClientDetailsForm = ({ email, industry, onSubmit }: ClientDetailsFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    industry: industry,
    products: '',
    processNotes: '',
    additionalRequests: '',
    logoFile: null as File | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a logo file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setFormData(prev => ({ ...prev, logoFile: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get process data from localStorage
      const processDataStr = localStorage.getItem('processData');
      if (!processDataStr) {
        throw new Error('No process data found');
      }
      const processData = JSON.parse(processDataStr);

      // Convert logo file to base64 if present
      let logoBase64 = null;
      if (formData.logoFile) {
        const reader = new FileReader();
        logoBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(formData.logoFile!);
        });
      }

      // Send email with client details and process data
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'client-details',
          email,
          clientDetails: {
            businessName: formData.businessName,
            industry: formData.industry,
            products: formData.products,
            processNotes: formData.processNotes,
            additionalRequests: formData.additionalRequests,
            logo: logoBase64
          },
          processData,
          to: 'support@qse-academy.com',
          cc: 'support@qse-academy.com'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Send confirmation email to client
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'client-confirmation',
          email,
          clientName: formData.businessName,
          to: email,
          cc: 'support@qse-academy.com'
        }
      });

      toast({
        title: "Details submitted successfully!",
        description: "Your consultant will start working on your report shortly."
      });

      onSubmit();
    } catch (error) {
      console.error('Error submitting client details:', error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Client Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please provide your business details so our consultant can customize your report
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Your Company Name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select 
                value={formData.industry} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="products">Products/Services *</Label>
            <Input
              id="products"
              value={formData.products}
              onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
              placeholder="What products or services does your company provide?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Label 
                htmlFor="logo" 
                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted"
              >
                <Upload className="h-4 w-4" />
                Upload Logo
              </Label>
              {formData.logoFile && (
                <Badge variant="secondary">{formData.logoFile.name}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Upload your company logo (max 5MB, PNG/JPG)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processNotes">Process Notes</Label>
            <Textarea
              id="processNotes"
              value={formData.processNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, processNotes: e.target.value }))}
              placeholder="Brief description of your key business processes..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalRequests">Additional Requirements</Label>
            <Textarea
              id="additionalRequests"
              value={formData.additionalRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalRequests: e.target.value }))}
              placeholder="Any specific requirements beyond the benchmark report? (optional)"
              rows={3}
            />
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">What happens next?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your details will be sent to our expert consultant team who will customize your ISO 9001 
                  process map with your branding and provide professional recommendations.
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Details & Start Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientDetailsForm;