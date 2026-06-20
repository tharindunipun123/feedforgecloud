import { jsPDF } from 'jspdf';
import { formatBillingDate, formatCurrency } from '@/lib/billing/helpers';
import { BRAND_NAME } from '@/data/constants';

export function generateInvoicePDF(invoice, user) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND_NAME, 20, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('EC2 Hosting Platform', 20, y + 7);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 20, y, { align: 'right' });

  y += 25;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, y);
  doc.text(`Status: ${(invoice.status || '').toUpperCase()}`, pageWidth - 20, y, { align: 'right' });
  y += 7;
  doc.text(`Issue Date: ${formatBillingDate(invoice.issueDate)}`, 20, y);
  doc.text(`Due Date: ${formatBillingDate(invoice.dueDate)}`, pageWidth - 20, y, { align: 'right' });
  y += 7;

  if (invoice.paidDate) {
    doc.text(`Paid Date: ${formatBillingDate(invoice.paidDate)}`, 20, y);
    y += 7;
  }

  if (invoice.billingPeriodStart) {
    doc.text(
      `Billing Period: ${formatBillingDate(invoice.billingPeriodStart)} - ${formatBillingDate(invoice.billingPeriodEnd)}`,
      20,
      y
    );
    y += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(user?.name || 'Customer', 20, y);
  y += 5;
  doc.text(user?.email || '', 20, y);
  y += 15;

  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 22, y);
  doc.text('Amount', pageWidth - 22, y, { align: 'right' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  const lineItems = invoice.lineItems || [];
  for (const item of lineItems) {
    const desc = item.name || item.description || 'Service';
    const amount = formatCurrency(item.amount || item.price || 0);
    doc.text(desc, 22, y);
    doc.text(amount, pageWidth - 22, y, { align: 'right' });
    y += 8;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  }

  y += 10;
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  doc.text('Subtotal:', pageWidth - 70, y);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 22, y, { align: 'right' });
  y += 7;
  doc.text('Tax:', pageWidth - 70, y);
  doc.text(formatCurrency(invoice.tax), pageWidth - 22, y, { align: 'right' });
  y += 7;
  doc.text('Discount:', pageWidth - 70, y);
  doc.text(formatCurrency(invoice.discount), pageWidth - 22, y, { align: 'right' });
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 70, y);
  doc.text(formatCurrency(invoice.total), pageWidth - 22, y, { align: 'right' });

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Thank you for choosing ${BRAND_NAME}. For support, visit our Help Center or open a support ticket.`,
    20,
    y
  );

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
