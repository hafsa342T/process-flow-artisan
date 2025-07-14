import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Building2, 
  FileText, 
  Send,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientDetailsFormProps {
  email: string;
  industry: string;
  onSubmitSuccess: () => void;
}

export const ClientDetailsForm: React.FC<ClientDetailsFormProps> = ({
  email,
  industry,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState({
    businessName: '',
    products: '',
    processNotes: '',
    additionalRequirements: '',
    logo: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file must be smaller than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setFormData(prev => ({ ...prev, logo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }));
    setLogoPreview(null);
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

      // Convert logo to base64 if present
      let logoBase64 = null;
      if (formData.logo) {
        const reader = new FileReader();
        logoBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(formData.logo!);
        });
      }

      // Send comprehensive data to support
      const { error } = await supabase.functions.invoke('send-client-details', {
        body: {
          clientEmail: email,
          industry,
          businessName: formData.businessName,
          products: formData.products,
          processNotes: formData.processNotes,
          additionalRequirements: formData.additionalRequirements,
          logo: logoBase64,
          processData,
          submittedAt: new Date().toISOString()
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Details submitted successfully! Your consultant will start working on your report.');
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting client details:', error);
      toast.error(`Failed to submit details: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Complete Your Order Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please provide your business details so our consultant can customize your premium report
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-sm font-medium">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Enter your company/business name"
              required
              className="h-10"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Company Logo (Optional)</Label>
            {!logoPreview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload your logo to be included in the branded report
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    Choose File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, or SVG • Max 5MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center gap-3">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-12 h-12 object-contain rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{formData.logo?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(formData.logo?.size! / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Products/Services */}
          <div className="space-y-2">
            <Label htmlFor="products" className="text-sm font-medium">
              Products/Services <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="products"
              value={formData.products}
              onChange={(e) => handleInputChange('products', e.target.value)}
              placeholder="Describe the main products or services your business provides..."
              required
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Process Notes */}
          <div className="space-y-2">
            <Label htmlFor="processNotes" className="text-sm font-medium">
              Your Current Processes
            </Label>
            <Textarea
              id="processNotes"
              value={formData.processNotes}
              onChange={(e) => handleInputChange('processNotes', e.target.value)}
              placeholder="Briefly describe your current business processes, workflow, or any specific requirements..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Additional Requirements */}
          <div className="space-y-2">
            <Label htmlFor="additionalRequirements" className="text-sm font-medium">
              Additional Requirements Beyond Benchmark Report
            </Label>
            <Textarea
              id="additionalRequirements"
              value={formData.additionalRequirements}
              onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
              placeholder="Any specific customizations, additional processes, or special requirements for your report..."
              rows={3}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Current Order Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Order Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Industry:</span>
                <div className="font-medium">{industry}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <div className="font-medium">{email}</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.businessName || !formData.products}
            className="w-full h-12 text-base gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Submitting Details...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Details & Start Report Creation
              </>
            )}
          </Button>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="space-y-1">
                <li>• Our consultant will review your details and process mapping</li>
                <li>• Your custom branded report will be prepared within 48 hours</li>
                <li>• You'll receive the completed report via email</li>
              </ul>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};