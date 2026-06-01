// my-leather-platform/app/admin/reports/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Download, FileText, BarChart, Loader2 } from 'lucide-react'; // FIX: Import Loader2
import axios from 'axios';
import { IQuoteRequest } from '@/types/quote';
import { format } from 'date-fns'; // FIX: Import format for processedData

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<string>('quotes');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (formatType: 'pdf' | 'csv') => { // Renamed 'format' to 'formatType' to avoid conflict
    setLoading(true);
    try {
      let endpoint = '';
      let fileName = '';
      let queryParams = new URLSearchParams();

      if (reportType === 'quotes') {
        endpoint = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/quote-requests`;
        fileName = `quote_requests_${quoteStatusFilter}_${formatType}.${formatType}`; // Use formatType here
        if (quoteStatusFilter !== 'all') {
          queryParams.append('status', quoteStatusFilter);
        }
        queryParams.append('limit', '10000');
      } else {
        toast.error("Report type not implemented yet.");
        setLoading(false);
        return;
      }

      const dataResponse = await axios.get(`${endpoint}?${queryParams.toString()}`);
      if (!dataResponse.data.success) {
        throw new Error(dataResponse.data.message || "Failed to fetch report data.");
      }
      const rawData: IQuoteRequest[] = dataResponse.data.data;

      let processedData: any[] = [];
      let headers: string[] = [];
      let columns: string[] = [];

      if (reportType === 'quotes') {
        headers = [
          'ID', 'Status', 'Customer Name', 'Company', 'Email', 'Country',
          'Item Name', 'Quantity', 'Unit', 'Proposed Price', 'Total Price',
          'Payment Method', 'Tracking Number', 'Request Date'
        ];
        columns = [
          '_id', 'status', 'customerName', 'companyName', 'customerEmail',
          'destinationCountry', 'itemName', 'quantity', 'quantityUnit',
          'proposedPricePerUnit', 'proposedTotalPrice', 'paymentMethod',
          'trackingNumber', 'createdAt'
        ];

        processedData = rawData.map((req, index) => ({
          _id: req.requestNumber || `#${index + 1}`,
          status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
          customerName: req.customerName || 'N/A',
          companyName: req.companyName || 'N/A',
          customerEmail: req.customerEmail || 'N/A',
          destinationCountry: req.destinationCountry || 'N/A',
          itemName: req.itemName || 'N/A',
          quantity: req.quantity?.toLocaleString() || 'N/A',
          quantityUnit: req.quantityUnit || 'N/A',
          proposedPricePerUnit: req.proposedPricePerUnit ? `$${req.proposedPricePerUnit.toFixed(2)}` : 'N/A',
          proposedTotalPrice: req.proposedTotalPrice ? `$${req.proposedTotalPrice.toFixed(2)}` : 'N/A',
          paymentMethod: req.paymentMethod ? req.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
          trackingNumber: req.trackingNumber || 'N/A',
          createdAt: format(new Date(req.createdAt), 'MMM dd, yyyy HH:mm')
        }));
      }

      let downloadBlob: Blob;
      if (formatType === 'pdf') { // Use formatType here
        const reportTitle = `Quote Requests Report - Status: ${quoteStatusFilter === 'all' ? 'ALL' : quoteStatusFilter.toUpperCase()}`;
        // The dynamic import should be correctly awaited here.
        const { generateReportPdf } = await import('@/lib/utils/invoicePdfGenerator');
        const pdfBuffer = generateReportPdf({
          data: processedData,
          title: reportTitle,
          headers: headers,
          columns: columns,
          companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'PureGrain Leather',
          companyAddress: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '123 Leather Lane, Rawhide City, LTH 12345',
          companyEmail: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'admin@puregrain.com',
          companyPhone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '+1 (555) 123-4567',
        });
        downloadBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      } else { // CSV
        const csvRows = [];
        csvRows.push(headers.join(','));
        for (const row of processedData) {
          const values = columns.map(col => {
            const value = row[col];
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvRows.push(values.join(','));
        }
        downloadBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      }

      const url = window.URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report (${formatType}) generated successfully!`); // Use formatType

    } catch (err: any) {
      console.error("Error generating report:", err.response?.data || err.message);
      toast.error(`Failed to generate report: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Reports
            </h1>
            <p className="text-muted-foreground text-lg">
              Generate professional reports from your data
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="rounded-lg border bg-card/90 backdrop-blur-sm shadow-sm">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <BarChart className="h-5 w-5" />
              Quote Request Reports
            </CardTitle>
            <CardDescription className="mt-2">
              Generate comprehensive PDF or CSV reports based on quote requests by status and format. Reports include company information, detailed data, and professional formatting.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="reportType" className="text-sm font-medium">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="reportType" className="w-full">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quotes">Quote Requests</SelectItem>
                    <SelectItem value="samples" disabled>Sample Requests (Coming Soon)</SelectItem>
                    <SelectItem value="customers" disabled>Customers (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {reportType === 'quotes' && (
                <div className="space-y-2">
                  <Label htmlFor="quoteStatusFilter" className="text-sm font-medium">Filter by Quote Status</Label>
                  <Select value={quoteStatusFilter} onValueChange={setQuoteStatusFilter}>
                    <SelectTrigger id="quoteStatusFilter" className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              <Button 
                onClick={() => handleGenerateReport('pdf')} 
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF Report
              </Button>
              <Button 
                onClick={() => handleGenerateReport('csv')} 
                disabled={loading}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Download className="mr-2 h-4 w-4" />
                Generate CSV Report
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Report Includes:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Company header with name, address, email, and phone</li>
                <li>Report metadata (generation date, total records)</li>
                <li>Complete quote request details (customer, company, item, pricing, payment, tracking)</li>
                <li>Professional formatting with page numbers and footers</li>
                <li>Properly formatted data with currency and date formatting</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}