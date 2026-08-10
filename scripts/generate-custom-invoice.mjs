import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAND_NAME = 'Feed Forge';

const invoice = {
  invoiceNumber: 'INV-202606-284751',
  status: 'paid',
  issueDate: new Date('2026-06-27'),
  dueDate: new Date('2026-06-27'),
  paidDate: new Date('2026-06-27'),
  billingPeriodStart: new Date('2026-06-27'),
  billingPeriodEnd: new Date('2027-06-27'),
  nextRenewalDate: new Date('2027-06-27'),
  subtotal: 190,
  tax: 13.5,
  discount: 0,
  total: 203.5,
  currency: 'USD',
  lineItems: [
    {
      name: 'EC2 Hosting Subscription — Annual Plan',
      amount: 190,
    },
  ],
};

const customer = {
  name: 'Gayathri CCTV',
  email: 'gayathricctv@gmail.com',
};

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
}

const doc = new jsPDF();
const pageWidth = doc.internal.pageSize.getWidth();
let y = 20;

doc.setFontSize(22);
doc.setFont('helvetica', 'bold');
doc.text(BRAND_NAME, 20, y);

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.text('EC2 Hosting Platform · feedforge.cloud', 20, y + 7);

doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.text('INVOICE', pageWidth - 20, y, { align: 'right' });

y += 25;
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');

doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, y);
doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 20, y, { align: 'right' });
y += 7;
doc.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 20, y);
doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - 20, y, { align: 'right' });
y += 7;
doc.text(`Paid Date: ${formatDate(invoice.paidDate)}`, 20, y);
y += 7;
doc.text(
  `Billing Period: ${formatDate(invoice.billingPeriodStart)} – ${formatDate(invoice.billingPeriodEnd)}`,
  20,
  y
);
y += 7;
doc.text(`Next Renewal Date: ${formatDate(invoice.nextRenewalDate)}`, 20, y);
y += 12;

doc.setFont('helvetica', 'bold');
doc.text('Bill To:', 20, y);
y += 7;
doc.setFont('helvetica', 'normal');
doc.text(customer.name, 20, y);
y += 5;
doc.text(customer.email, 20, y);
y += 15;

doc.setFillColor(240, 240, 240);
doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
doc.setFont('helvetica', 'bold');
doc.text('Description', 22, y);
doc.text('Amount', pageWidth - 22, y, { align: 'right' });
y += 10;

doc.setFont('helvetica', 'normal');
for (const item of invoice.lineItems) {
  doc.text(item.name, 22, y);
  doc.text(formatCurrency(item.amount), pageWidth - 22, y, { align: 'right' });
  y += 8;
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
  `Thank you for choosing ${BRAND_NAME}. Your subscription renews on ${formatDate(invoice.nextRenewalDate)}.`,
  20,
  y
);
y += 6;
doc.text('For support, visit feedforge.cloud/help or open a support ticket from your dashboard.', 20, y);

const outDir = path.join(__dirname, '..', 'generated-invoices');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${invoice.invoiceNumber}.pdf`);
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outPath, pdfBuffer);

console.log(`Invoice saved: ${outPath}`);
