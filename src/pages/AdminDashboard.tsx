import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Eye,
  Download,
  Mail,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Report {
  id: string;
  email: string;
  industry: string;
  process_data: any;
  pdf_report: string | null;
  payment_status: string;
  payment_session_id: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            Loading reports...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-light rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage premium report orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {reports.filter(r => r.payment_status === 'paid').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {reports.filter(r => r.payment_status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ${(reports.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + r.amount, 0) / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Premium Report Orders</CardTitle>
              <CardDescription>
                View and manage all premium report orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reports found
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="pt-4">
                        <div className="grid md:grid-cols-6 gap-4 items-center">
                          <div>
                            <div className="font-medium">{report.email}</div>
                            <div className="text-sm text-muted-foreground">
                              {report.industry}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">${(report.amount / 100).toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              Amount
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(report.payment_status)}
                          </div>
                          <div>
                            <div className="text-sm">
                              {formatDate(report.created_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono text-muted-foreground">
                              {report.id.substring(0, 8)}...
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(report.email);
                                toast('Email copied to clipboard');
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Details Modal */}
          {selectedReport && (
            <Card className="fixed inset-4 bg-background z-50 overflow-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Report Details</CardTitle>
                    <CardDescription>
                      Report ID: {selectedReport.id}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedReport(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Email:</strong> {selectedReport.email}</div>
                      <div><strong>Industry:</strong> {selectedReport.industry}</div>
                      <div><strong>Status:</strong> {getStatusBadge(selectedReport.payment_status)}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Amount:</strong> ${(selectedReport.amount / 100).toFixed(2)}</div>
                      <div><strong>Created:</strong> {formatDate(selectedReport.created_at)}</div>
                      <div><strong>Updated:</strong> {formatDate(selectedReport.updated_at)}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Process Data</h4>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedReport.process_data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;