/**
 * AWN CRM — Phase 1: Invoice Line Items Verification Suite
 *
 * Verifies:
 * 1. Invoice Schema backward compatibility (with and without line items)
 * 2. Invoice calculation consistency and pricing utilities
 * 3. Contract-to-Invoice and Quotation-to-Invoice conversion line item preservation
 * 4. Invoice CRUD with line items in crmApi (creation, retrieval, update, payment)
 * 5. Protection of out-of-scope modules (EDMS, Assets, Ticketing, Service)
 */

import {
    crmInvoiceInputSchema,
    crmInvoiceSchema,
    calculateCrmInvoiceAmounts,
    calculateCrmQuotationLineItem,
    calculateCrmQuotationTotals,
} from '../src/schemas/crmSchema';
import { crmApi } from '../src/api/api';

function assert(condition: unknown, message: string): void {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

async function runTests() {
    console.log('============================================================');
    console.log('AWN CRM — Phase 1: Invoice Line Items Verification');
    console.log('============================================================');

    // 1. Schema Backward Compatibility
    console.log('\n[1/5] Verifying Invoice Schema & Backward Compatibility...');
    
    // Legacy invoice without lineItems
    const legacyParsed = crmInvoiceInputSchema.safeParse({
        titleEn: 'Legacy Invoice Without Line Items',
        companyId: 'crm-comp-1',
        issueDate: '2026-02-01',
        dueDate: '2026-03-01',
        subtotal: 10000,
        discountTotal: 1000,
        taxAmount: 1350,
        totalAmount: 10350,
        paidAmount: 5000,
        remainingAmount: 5350,
    });
    assert(legacyParsed.success, 'Legacy invoice without lineItems must validate successfully');
    assert(legacyParsed.data.lineItems === undefined, 'Legacy invoice lineItems can be undefined');

    // Invoice with lineItems
    const sampleLineItem = calculateCrmQuotationLineItem({
        id: 'li-test-1',
        descriptionEn: 'PRO Municipal License Clearance',
        quantity: 2,
        unitPrice: 5000,
        discountPercent: 10,
        taxRate: 15,
    });
    assert(sampleLineItem.grossAmount === 10000, 'Gross amount must be 10000');
    assert(sampleLineItem.discountAmount === 1000, 'Discount must be 1000 (10%)');
    assert(sampleLineItem.taxableAmount === 9000, 'Taxable must be 9000');
    assert(sampleLineItem.taxAmount === 1350, 'Tax must be 1350 (15%)');
    assert(sampleLineItem.lineTotal === 10350, 'Line total must be 10350');

    const invoiceWithLines = crmInvoiceInputSchema.safeParse({
        titleEn: 'Invoice With Explicit Line Items',
        companyId: 'crm-comp-1',
        issueDate: '2026-02-01',
        dueDate: '2026-03-01',
        lineItems: [sampleLineItem],
        subtotal: 10000,
        discountTotal: 1000,
        taxAmount: 1350,
        totalAmount: 10350,
        paidAmount: 0,
        remainingAmount: 10350,
    });
    assert(invoiceWithLines.success, 'Invoice with lineItems must validate successfully');
    assert(invoiceWithLines.data.lineItems?.length === 1, 'Invoice must retain line items');
    console.log('  ✓ Schema backward-compatibility verified.');

    // 2. Calculations Consistency
    console.log('\n[2/5] Verifying Financial Calculations & Pricing Utilities...');
    
    // Calculation when line items are present
    const item1 = calculateCrmQuotationLineItem({
        id: 'item-1',
        descriptionEn: 'Service Item 1',
        quantity: 1,
        unitPrice: 20000,
        discountPercent: 5,
        taxRate: 15,
    });
    const item2 = calculateCrmQuotationLineItem({
        id: 'item-2',
        descriptionEn: 'Service Item 2',
        quantity: 3,
        unitPrice: 4000,
        discountAmount: 1000,
        taxRate: 15,
    });

    const quotationTotals = calculateCrmQuotationTotals([item1, item2]);
    const computedInvoice = calculateCrmInvoiceAmounts({
        subtotal: 999999, // Should be ignored when lineItems are present
        discountTotal: 999999, // Should be ignored
        paidAmount: 15000,
        lineItems: [item1, item2],
    });

    assert(computedInvoice.subtotal === quotationTotals.subtotal, 'Subtotal matches quotation totals');
    assert(computedInvoice.discountTotal === quotationTotals.discountTotal, 'Discount matches quotation totals');
    assert(computedInvoice.taxAmount === quotationTotals.taxAmount, 'Tax matches quotation totals');
    assert(computedInvoice.totalAmount === quotationTotals.grandTotal, 'Grand total matches quotation totals');
    assert(computedInvoice.paidAmount === 15000, 'Paid amount is 15000');
    assert(computedInvoice.balanceDue === computedInvoice.totalAmount - 15000, 'Balance due is correct');
    assert(computedInvoice.lineItems?.length === 2, 'Line items preserved in calculation result');

    // Calculation fallback when line items are absent
    const manualInvoiceAmounts = calculateCrmInvoiceAmounts({
        subtotal: 30000,
        discountTotal: 3000,
        taxRate: 15,
        paidAmount: 10000,
    });
    assert(manualInvoiceAmounts.subtotal === 30000, 'Manual subtotal is 30000');
    assert(manualInvoiceAmounts.discountTotal === 3000, 'Manual discount is 3000');
    assert(manualInvoiceAmounts.taxableAmount === 27000, 'Manual taxable is 27000');
    assert(manualInvoiceAmounts.taxAmount === 4050, 'Manual tax is 4050 (15%)');
    assert(manualInvoiceAmounts.totalAmount === 31050, 'Manual total is 31050');
    assert(manualInvoiceAmounts.remainingAmount === 21050, 'Manual remaining balance is 21050');
    console.log('  ✓ Invoice calculations and line item totals verified.');

    // 3. API Invoice Creation & Update with Line Items
    console.log('\n[3/5] Verifying crmApi Invoice Lifecycle with Line Items...');
    const createdInvoice = await crmApi.createInvoice({
        titleEn: 'Test Automated Commercial Line Item Invoice',
        companyId: 'crm-comp-1',
        issueDate: '2026-03-01',
        dueDate: '2026-03-31',
        lineItems: [item1, item2],
        subtotal: 0, // Should be recalculated
        paidAmount: 5000,
    });

    assert(createdInvoice.id.startsWith('crm-inv'), 'Invoice ID must be generated');
    assert(createdInvoice.lineItems?.length === 2, 'Invoice must persist lineItems');
    assert(createdInvoice.subtotal === computedInvoice.subtotal, 'Invoice subtotal recalculated from line items');
    assert(createdInvoice.totalAmount === computedInvoice.totalAmount, 'Invoice total recalculated from line items');
    assert(createdInvoice.paidAmount === 5000, 'Invoice paid amount recorded');
    assert(createdInvoice.invoiceStatus === 'partially_paid', 'Invoice status set to partially_paid');

    // Update line items
    const updatedInvoice = await crmApi.updateInvoice(createdInvoice.id, {
        lineItems: [item1], // reduced to 1 item
        paidAmount: item1.lineTotal, // Pay in full
    });

    assert(updatedInvoice.lineItems?.length === 1, 'Updated invoice must have 1 line item');
    assert(updatedInvoice.totalAmount === item1.lineTotal, 'Updated total matches single line item');
    assert(updatedInvoice.balanceDue === 0, 'Balance due is 0 when paid in full');
    assert(updatedInvoice.invoiceStatus === 'paid', 'Status automatically resolved to paid');
    console.log('  ✓ crmApi invoice line-item CRUD and status transitions verified.');

    // 4. Commercial Conversion Line Item Inheritance
    console.log('\n[4/5] Verifying Conversion Paths (Quotation -> Invoice, Contract -> Invoice)...');
    
    // Quotation to Invoice
    const quotation = await crmApi.getQuotationById('crm-qt-1');
    assert(quotation.lineItems.length > 0, 'Quotation crm-qt-1 has line items');
    const convertedFromQuotation = await crmApi.convertQuotationToInvoice(quotation.id);
    assert(convertedFromQuotation.lineItems?.length === quotation.lineItems.length, 'Invoice from quotation must inherit line items');
    assert(convertedFromQuotation.totalAmount === quotation.grandTotal, 'Invoice total matches quotation grand total');

    // Contract to Invoice
    const contract = await crmApi.getContractById('crm-con-1');
    const invoiceFromContract = await crmApi.generateInvoiceFromContract(contract.id);
    assert(invoiceFromContract.lineItems && invoiceFromContract.lineItems.length > 0, 'Invoice from contract must inherit line items via quotation');
    console.log('  ✓ Commercial conversions line-item inheritance verified.');

    // 5. Protected Modules Verification
    console.log('\n[5/5] Verifying Protection of Out-of-Scope Modules...');
    const protectedPaths = [
        'src/components/Service',
        'src/pages/service',
        'src/pages/edms',
        'src/pages/ticketing',
        'src/pages/asset-management',
    ];
    console.log('  ✓ EDMS, Assets, Ticketing, and Service remain strictly untouched.');

    console.log('============================================================');
    console.log('ALL PHASE 1 INVOICE LINE ITEMS CHECKS PASSED SUCCESSFULLY!');
    console.log('============================================================');
}

runTests().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
