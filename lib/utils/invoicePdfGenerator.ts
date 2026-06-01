// my-leather-platform/lib/utils/invoicePdfGenerator.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IInvoice } from '@/types/invoice';
import { format } from 'date-fns';

// Extend jsPDF to include autoTable (necessary for TypeScript)
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface GeneratePdfOptions {
  invoice: IInvoice;
}

const getHeaderLogoDataUrl = (): string | null => {
  try {
    // Dynamically import fs and path only in server context to avoid webpack bundling errors
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(process.cwd(), 'public', 'new_logo.png');
    const file = fs.readFileSync(logoPath);
    return `data:image/png;base64,${file.toString('base64')}`;
  } catch {
    return null;
  }
};

const normalizeDetailValue = (value: string): string => {
  return value
    .replace(/\b1-2weeks\b/gi, '1-2 weeks')
    .replace(/\b2-3months\b/gi, '2-3 months')
    .replace(/\b1month\b/gi, '1 month')
    .trim();
};

export const generateInvoicePdf = ({ invoice }: GeneratePdfOptions): Buffer => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  let y = 18;

  const darkBrown: [number, number, number] = [78, 49, 34];
  const mediumBrown: [number, number, number] = [121, 79, 56];
  const warmGray: [number, number, number] = [90, 90, 90];
  const logoDataUrl = getHeaderLogoDataUrl();

  // Header left: logo lockup.
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, 10, 66, 16);
  } else {
    doc.setTextColor(...darkBrown);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text(invoice.vendorName.toUpperCase(), margin, y);
  }

  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...warmGray);
  doc.setFontSize(9.5);
  doc.text('Where Grain Meets Greatness.', margin + 18, 30);

  // Header right: contact details.
  const rightX = pageWidth - margin;
  let rightY = 18;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8.6);
  doc.text('sales@puregrainexports.com', rightX, rightY, { align: 'right' });
  rightY += 4.1;
  doc.text('+92 300 1234567', rightX, rightY, { align: 'right' });
  rightY += 4.1;
  doc.text('www.puregrainexports.com', rightX, rightY, { align: 'right' });

  // Decorative strip below header.
  y = 36;
  doc.setFillColor(...darkBrown);
  doc.rect(0, y, pageWidth, 6.6, 'F');
  doc.setFillColor(...mediumBrown);
  doc.rect(0, y + 0.6, pageWidth, 0.9, 'F');

  y += 14;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${format(invoice.issueDate, 'MMM dd, yyyy')}`, margin, y);
  doc.text(`Invoice No:  ${invoice.invoiceNumber}`, pageWidth - margin, y, { align: 'right' });
  y += 6;
  doc.setTextColor(...warmGray);
  doc.text(`Due Date:  ${format(invoice.dueDate, 'MMM dd, yyyy')}`, pageWidth - margin, y, { align: 'right' });
  doc.setDrawColor(214, 196, 178);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 2.5, pageWidth - margin, y + 2.5);
  doc.setTextColor(0, 0, 0);

  y += 10;
  const detailsLines = (invoice.customerAddress || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const detailRows = detailsLines.map((line) => {
    const [label, ...rest] = line.split(':');
    if (!rest.length) {
      return line;
    }
    return `${label.trim()}: ${normalizeDetailValue(rest.join(':'))}`;
  });

  // Recipient block + opening paragraph.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(invoice.customerName || 'N/A', margin, y);
  y += 5.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.8);
  doc.text(invoice.companyName || 'N/A', margin, y);
  y += 5.2;
  doc.text(invoice.customerCountry || 'N/A', margin, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(`Dear ${invoice.customerName || 'Customer'},`, margin, y);

  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const intro =
    'Please find below the invoice for your recent order with Pure Grain Exports. This invoice covers the supply of premium quality leather goods as per your specifications and the agreed terms.';
  const introLines = doc.splitTextToSize(intro, pageWidth - margin * 2);
  doc.text(introLines, margin, y);
  y += introLines.length * 5 + 6;

  // Build structured request summary values from details.
  const summaryMap: Record<string, string> = {};
  detailRows.forEach((line) => {
    const [rawKey, ...rest] = line.split(':');
    if (!rest.length) return;
    const key = rawKey.trim().toLowerCase();
    const value = normalizeDetailValue(rest.join(':').trim());
    summaryMap[key] = value;
  });

  const quoteRequestValue =
    summaryMap['quote request for'] ||
    summaryMap['quote request'] ||
    (invoice.items[0]?.itemName || 'N/A');
  const dimensionsValue = summaryMap['dimensions'] || summaryMap['thickness'] || 'N/A';
  const timelineValue = summaryMap['required timeline'] || summaryMap['timeline'] || 'N/A';
  const materialValue = summaryMap['material used'] || summaryMap['leather type'] || 'N/A';
  const colorValue = summaryMap['requested color'] || summaryMap['color'] || 'N/A';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.2);
  doc.setTextColor(65, 40, 26);
  doc.text('REQUEST SUMMARY', margin, y);
  doc.setDrawColor(194, 156, 126);
  doc.setLineWidth(0.35);
  doc.line(margin, y + 1.7, pageWidth - margin, y + 1.7);
  y += 7;

  doc.setTextColor(0, 0, 0);
  const leftLabelX = margin;
  const leftValueX = margin + 36;
  const rightLabelX = pageWidth / 2 - 8;
  const rightValueX = rightLabelX + 26;

  const summaryRows = [
    {
      left: { label: 'Quote Request:', value: quoteRequestValue },
      right: { label: 'Material:', value: materialValue },
    },
    {
      left: { label: 'Dimensions:', value: dimensionsValue },
      right: { label: 'Color:', value: colorValue },
    },
    {
      left: { label: 'Timeline:', value: timelineValue },
      right: { label: '', value: '' },
    },
  ];

  doc.setFontSize(10.5);
  summaryRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.text(row.left.label, leftLabelX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row.left.value || 'N/A', leftValueX, y);

    if (row.right.label) {
      doc.setFont('helvetica', 'bold');
      doc.text(row.right.label, rightLabelX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(row.right.value || 'N/A', rightValueX, y);
    }

    y += 5.2;
  });

  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.2);
  doc.setTextColor(65, 40, 26);
  doc.text('LINE ITEMS', margin, y);
  doc.setDrawColor(194, 156, 126);
  doc.setLineWidth(0.35);
  doc.line(margin, y + 1.7, pageWidth - margin, y + 1.7);
  y += 4;

  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: y,
    head: [['Item Description', 'Qty', 'Unit', 'Unit Price', 'Total']],
    body: invoice.items.map((item) => [
      `${item.itemName}`,
      item.quantity.toLocaleString(),
      item.quantityUnit,
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.totalPrice.toFixed(2)}`,
    ]),
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 10,
      cellPadding: 3.2,
      textColor: [35, 35, 35],
      lineColor: [214, 214, 214],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [78, 49, 34],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineColor: [198, 176, 159],
      lineWidth: 0.35,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 74 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 34 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 9;

  const totalsX = pageWidth - margin;
  const totalsLabelX = totalsX - 44;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', totalsLabelX, y);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, totalsX, y, { align: 'right' });
  y += 5.3;
  if (invoice.taxAmount && invoice.taxAmount > 0) {
    doc.text(`Tax (${((invoice.taxRate || 0) * 100).toFixed(0)}%)`, totalsLabelX, y);
    doc.text(`$${invoice.taxAmount.toFixed(2)}`, totalsX, y, { align: 'right' });
    y += 5.3;
  }
  if (invoice.shippingCost && invoice.shippingCost > 0) {
    doc.text('Shipping', totalsLabelX, y);
    doc.text(`$${invoice.shippingCost.toFixed(2)}`, totalsX, y, { align: 'right' });
    y += 5.3;
  }
  const totalBarX = totalsX - 84;
  const totalBarY = y - 1.3;
  const totalBarH = 8;
  doc.setFillColor(...darkBrown);
  doc.rect(totalBarX, totalBarY, 84, totalBarH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Total Due', totalBarX + 4, totalBarY + 5.6);
  doc.text(`$${invoice.totalAmount.toFixed(2)} USD`, totalsX - 1.5, totalBarY + 5.6, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  y = totalBarY + totalBarH + 12;
  const instructions = invoice.paymentInstructions || 'Please pay the total amount by the due date.';
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 2;
  const leftColW = pageWidth / 2 - margin - 8;
  const rightColW = pageWidth - margin - rightColX;

  let paymentY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.2);
  doc.setTextColor(65, 40, 26);
  doc.text('PAYMENT TERMS', leftColX, paymentY);
  doc.setDrawColor(194, 156, 126);
  doc.setLineWidth(0.35);
  doc.line(leftColX, paymentY + 1.7, leftColX + leftColW, paymentY + 1.7);
  paymentY += 6;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.2);
  const wrappedInstructions = doc.splitTextToSize(instructions, leftColW);
  doc.text(wrappedInstructions, leftColX, paymentY);
  const paymentEndY = paymentY + wrappedInstructions.length * 4.8;

  const bankLines: string[] = invoice.paymentTerms === 'lc'
    ? [
        `Issuing Bank: ${invoice.lcBankName || 'N/A'}`,
        `Contact Person: ${invoice.lcContactPerson || 'N/A'}`,
        `Contact Email: ${invoice.lcContactEmail || 'N/A'}`,
      ]
    : [
        `Account Title: ${invoice.vendorBankDetails.accountTitle || 'N/A'}`,
        `Bank Name: ${invoice.vendorBankDetails.bankName}`,
        `Account Number: ${invoice.vendorBankDetails.accountNumber}`,
        `IBAN: ${invoice.vendorBankDetails.iban || 'N/A'}`,
      ];

  let bankY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.2);
  doc.setTextColor(65, 40, 26);
  doc.text('BANK DETAILS', rightColX, bankY);
  doc.setDrawColor(194, 156, 126);
  doc.setLineWidth(0.35);
  doc.line(rightColX, bankY + 1.7, rightColX + rightColW, bankY + 1.7);
  bankY += 6;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.2);

  // Measure label text width so long labels (e.g., Account Number) never collide with values.
  doc.setFont('helvetica', 'bold');
  const maxBankLabelTextWidth = bankLines.reduce((max, line) => {
    const label = `${line.split(':')[0] || ''}:`;
    return Math.max(max, doc.getTextWidth(label));
  }, 0);
  const bankLabelWidth = Math.min(Math.max(maxBankLabelTextWidth + 3, 31), rightColW - 20);
  const bankValueX = rightColX + bankLabelWidth;
  const bankValueWidth = Math.max(20, rightColW - bankLabelWidth - 1);

  bankLines.forEach((line) => {
    const [label, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, rightColX, bankY);
    doc.setFont('helvetica', 'normal');
    const wrappedValue = doc.splitTextToSize(value || 'N/A', bankValueWidth);
    doc.text(wrappedValue, bankValueX, bankY);
    bankY += Math.max(1, wrappedValue.length) * 4.8 + 0.8;
  });

  y = Math.max(paymentEndY, bankY) + 13;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('Sincerely,', margin, y);
  y += 7;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(...darkBrown);
  doc.text('Pure Grain Exports', margin, y);
  y += 2.2;
  doc.setDrawColor(120, 83, 58);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 0.7, margin + 44, y + 0.7);
  y += 5.8;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.3);
  doc.text('Authorized Signatory', margin, y);

  if (invoice.notes) {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const wrappedNotes = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(wrappedNotes, margin, y);
  }

  // Footer strip matching the template look.
  doc.setFillColor(...darkBrown);
  doc.rect(0, pageHeight - 11, pageWidth, 11, 'F');
  doc.setFillColor(...mediumBrown);
  doc.rect(0, pageHeight - 10.5, pageWidth, 0.7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Premium Leather Exports  |  Karachi, Pakistan  |  www.puregrainexports.com', pageWidth / 2, pageHeight - 4, { align: 'center' });

  // FIX: Properly convert ArrayBuffer to Node.js Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
};

interface GenerateReportOptions {
  data: any[];
  title: string;
  headers: string[];
  columns: string[];
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
}

export const generateReportPdf = ({ 
  data, 
  title, 
  headers, 
  columns,
  companyName = process.env.YOUR_COMPANY_NAME || 'PureGrain Leather',
  companyAddress = process.env.YOUR_COMPANY_ADDRESS || '123 Leather Lane, Rawhide City, LTH 12345',
  companyEmail = process.env.ADMIN_EMAIL || 'admin@puregrain.com',
  companyPhone = process.env.YOUR_COMPANY_PHONE || '+1 (555) 123-4567',
}: GenerateReportOptions): Buffer => {
  const doc = new jsPDF();
  
  const startX = 15;
  let startY = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Company Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, startX, startY);
  startY += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, startX, startY);
  startY += 5;
  doc.text(`Email: ${companyEmail}`, startX, startY);
  startY += 5;
  doc.text(`Phone: ${companyPhone}`, startX, startY);
  startY += 10;

  // Report Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, startX, startY);
  startY += 8;

  // Report Metadata
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const reportDate = format(new Date(), 'MMM dd, yyyy \'at\' hh:mm a');
  doc.text(`Generated on: ${reportDate}`, startX, startY);
  startY += 5;
  doc.text(`Total Records: ${data.length}`, startX, startY);
  startY += 10;

  // Table
  const tableRows = data.map(row => columns.map(col => {
    if (row[col] instanceof Date) {
      return format(row[col], 'MMM dd, yyyy HH:mm');
    }
    return String(row[col] || 'N/A');
  }));

  autoTable(doc, {
    startY: startY,
    head: [headers],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [60, 60, 60],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { 
      fontSize: 8, 
      cellPadding: 3, 
      valign: 'middle',
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    // Dynamic column widths based on content
    columnStyles: headers.reduce((acc, _, index) => {
      // Set appropriate widths for common columns
      const widthMap: { [key: number]: number } = {
        0: 20,  // ID
        1: 25,  // Status
        2: 35,  // Customer Name
        3: 35,  // Company
        4: 40,  // Email
        5: 25,  // Country
        6: 40,  // Item Name
        7: 20,  // Quantity
        8: 20,  // Unit
        9: 30,  // Proposed Price
        10: 30, // Total Price
        11: 40, // Payment Method
        12: 30, // Tracking Number
        13: 35, // Request Date
      };
      acc[index] = { cellWidth: widthMap[index] || 'auto' };
      return acc;
    }, {} as { [key: number]: { cellWidth: number | 'auto' } }),
    margin: { top: startY, left: startX, right: startX },
    didDrawPage: (data) => {
      // Add footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Page ${i} of ${pageCount} - ${companyName}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          reportDate,
          pageWidth - startX,
          pageHeight - 10,
          { align: 'right' }
        );
      }
    },
  });

  // FIX: Properly convert ArrayBuffer to Node.js Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
};
