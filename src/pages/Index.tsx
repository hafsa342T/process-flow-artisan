import { useEffect, useState } from 'react';
import { ProcessMappingTool } from '@/components/ProcessMappingTool';
import PaymentSuccess from '@/pages/PaymentSuccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  UserCheck, 
  Clock, 
  FileText, 
  Download,
  Zap,
  Shield,
  CheckCircle,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  ExternalLink
} from 'lucide-react';

const Index = () => {
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showTool, setShowTool] = useState(false);

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

  if (showTool) {
    return <ProcessMappingTool />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* QSE Academy Header */}
      <header className="py-4 text-center">
        <h1 className="text-2xl font-bold text-primary">QSE Academy</h1>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            ISO 9001 Process Mapping Tool
          </h1>
          <p className="text-xl mb-8 text-muted-foreground max-w-3xl mx-auto">
            Generate comprehensive ISO 9001:2015 compliant process maps instantly. 
            Created by quality management experts for quality managers, consultants, and auditors.
          </p>
          <Button 
            size="lg" 
            className="mb-8"
            onClick={() => setShowTool(true)}
          >
            Start Mapping Now
          </Button>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Zap className="w-4 h-4 mr-2" />
              Free Version Available
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Shield className="w-4 h-4 mr-2" />
              No Registration Required
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Instant Results
            </Badge>
          </div>
        </div>
      </section>

      {/* Who Should Use This Tool */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Who Should Use This Tool</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">Quality Managers</h3>
                <p className="text-muted-foreground text-justify">
                  Streamline your quality management system implementation with automated process mapping. 
                  Save hours of manual documentation while ensuring ISO 9001:2015 compliance across all organizational processes.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">ISO Consultants</h3>
                <p className="text-muted-foreground text-justify">
                  Deliver professional process maps to clients instantly. Enhance your consulting services with 
                  standardized, comprehensive documentation that meets international quality standards and accelerates certification timelines.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">Internal Auditors</h3>
                <p className="text-muted-foreground text-justify">
                  Prepare comprehensive audit documentation with visual process maps that clearly demonstrate 
                  compliance requirements, risk assessments, and control measures for effective internal audit procedures.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">How Process Mapping Works</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Input Your Organization Details</h3>
                  <p className="text-muted-foreground">
                    Provide basic information about your organization, industry, and specific quality management requirements.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI Generates Your Process Map</h3>
                  <p className="text-muted-foreground">
                    Our advanced system creates a comprehensive process map tailored to your industry and ISO 9001:2015 requirements.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Download & Implement</h3>
                  <p className="text-muted-foreground">
                    Export your complete process map in multiple formats and begin implementing your quality management system.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold">5 Minutes</div>
                    <div className="text-sm text-muted-foreground">Average completion time</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold">25+ Processes</div>
                    <div className="text-sm text-muted-foreground">Comprehensive coverage</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Download className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold">Multiple Formats</div>
                    <div className="text-sm text-muted-foreground">PDF, PNG, and interactive views</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding ISO 9001 */}
      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Understanding ISO 9001:2015</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground text-justify mb-4">
              ISO 9001:2015 is the international standard that specifies requirements for a quality management system (QMS). 
              Organizations use this standard to demonstrate their ability to consistently provide products and services that 
              meet customer and regulatory requirements. The 2015 version emphasizes risk-based thinking, leadership engagement, 
              and process approach to quality management.
            </p>
            <p className="text-muted-foreground text-justify mb-4">
              Process mapping is fundamental to ISO 9001:2015 implementation as it provides visual representation of how work flows 
              through an organization. The standard requires organizations to determine the processes needed for their QMS, their 
              sequence, interaction, and the criteria and methods needed to ensure effective operation and control of these processes.
            </p>
            <p className="text-muted-foreground text-justify">
              For authoritative guidance on ISO 9001:2015 requirements, refer to the{" "}
              <a 
                href="https://www.iso.org/iso-9001-quality-management.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                official ISO documentation
                <ExternalLink className="w-4 h-4" />
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* Why Process Mapping Matters */}
      <section className="py-6 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Process Mapping Matters</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Operational Benefits
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="text-justify">• Identifies inefficiencies and bottlenecks in current workflows</li>
                <li className="text-justify">• Ensures consistent execution of critical business processes</li>
                <li className="text-justify">• Facilitates employee training and knowledge transfer</li>
                <li className="text-justify">• Supports continuous improvement initiatives</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Compliance & Growth
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="text-justify">• Demonstrates compliance with ISO 9001:2015 requirements</li>
                <li className="text-justify">• Reduces audit preparation time by up to 60%</li>
                <li className="text-justify">• Provides foundation for digital transformation initiatives</li>
                <li className="text-justify">• Supports scalable business growth and expansion</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Development */}
      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Professional Development</h2>
          <div className="max-w-2xl mx-auto">
            <p className="text-muted-foreground mb-6 text-justify">
              Enhance your quality management expertise with comprehensive ISO 9001:2015 training and certification programs. 
              Professional development in quality management systems opens doors to career advancement and organizational leadership opportunities.
            </p>
            <Button variant="outline" asChild>
              <a 
                href="https://www.qse-academy.com/iso9001version2015/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Explore ISO 9001:2015 Training
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Quality Management?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join thousands of quality professionals who trust our comprehensive audit and assessment tools.
          </p>
          <Button 
            variant="secondary" 
            size="lg" 
            asChild
          >
            <a 
              href="https://www.qse-academy.com/audit-tool/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Award className="w-5 h-5" />
              Explore All QSE Tools
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
