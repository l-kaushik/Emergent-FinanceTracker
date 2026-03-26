import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Mail, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Reports({ user }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const generateReport = async (deliveryMethod) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/reports/generate`,
        { month, year, delivery_method: deliveryMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (deliveryMethod === 'pdf') {
        const pdfData = response.data.pdf_data;
        const blob = new Blob([Uint8Array.from(atob(pdfData), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${year}-${month}.pdf`;
        a.click();
        toast.success('PDF report downloaded successfully');
      } else if (deliveryMethod === 'email') {
        toast.success(response.data.message);
      } else if (deliveryMethod === 'in-app') {
        setReportHtml(response.data.html_content);
        toast.success('Report generated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Reports</h1>
        <p className="text-slate-600 mt-1">Generate and view your financial reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>Select month and year for your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="month">Month</Label>
                <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                  <SelectTrigger data-testid="report-month-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                  <SelectTrigger data-testid="report-year-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={() => generateReport('in-app')}
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800"
                  data-testid="generate-report-view-button"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Report
                </Button>
                <Button
                  onClick={() => generateReport('pdf')}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                  data-testid="generate-report-pdf-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => generateReport('email')}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                  data-testid="generate-report-email-button"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          {reportHtml ? (
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>
                  {months.find(m => m.value === month)?.label} {year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-white rounded-lg p-6 border border-slate-200 overflow-auto max-h-[600px]"
                  dangerouslySetInnerHTML={{ __html: reportHtml }}
                  data-testid="report-preview"
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Report Generated</h3>
                <p className="text-slate-600">Select a month and year, then generate a report to view it here</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
