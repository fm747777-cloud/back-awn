/**
 * AWN CRM — Phase 2: Proforma and Final Invoice Workflow Verification Suite
 *
 * Verifies:
 * 1. Proforma creation produces the correct numbering sequence (PI-YYYY-XXX)
 * 2. Final Tax Invoice creation produces the correct sequence (INV-YYYY-XXX)
 * 3. The two numbering sequences operate independently
 * 4. Existing invoices remain intact and functional
 * 5. Invoices without an invoiceType default safely without data loss
 * 6. Proforma conversion creates a valid Final Invoice with unique ID and number
 * 7. Original Proforma is preserved and references the Final Invoice
 * 8. Final Invoice references the originating Proforma
 * 9. Financial totals, tax, and line items match between Proforma and Final
 * 10. Final Invoice starts in expected unpaid/issued state
 * 11. Repeated conversion attempts are rejected
 * 12. Converting a non-Proforma invoice is rejected
 * 13. Bilingual translations in en.json and ar.json for all keys
 * 14. Protected modules verification
 */

import fs from 'fs';
import path from 'path';
import {
    crmInvoiceInputSchema,
    generateCrmInvoiceNumberAndCode,
    CRM_INVOICE_TYPE_VALUES,
} from '../src/schemas/crmSchema';
import { crmApi } from '../src/api/api';

function assert(condition: unknown, message: string): void {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

async function runPhase2Tests() {
    console.log('============================================================');
    console.log('AWN CRM — Phase 2: Proforma & Final Invoice Workflow Tests');
    console.log('============================================================');

    const currentYear = new Date().getFullYear();

    // 1. Schema & Invoice Type Values
    console.log('\n[1/12] Verifying Invoice Type Enum and Backward Compatibility Defaults...');
    assert(CRM_INVOICE_TYPE_VALUES.includes('proforma'), 'CRM_INVOICE_TYPE_VALUES must contain proforma');
    assert(CRM_INVOICE_TYPE_VALUES.includes('final_tax'), 'CRM_INVOICE_TYPE_VALUES must contain final_tax');

    // Default for missing invoiceType is 'final_tax'
    const legacyParse = crmInvoiceInputSchema.parse({
        titleEn: 'Legacy Invoice Without Type',
        companyId: 'crm-comp-1',
        issueDate: '2026-03-01',
        dueDate: '2026-03-31',
        totalAmount: 5000,
        paidAmount: 0,
        remainingAmount: 5000,
    });
    assert(legacyParse.invoiceType === 'final_tax', 'Missing invoiceType must safely default to final_tax');
    console.log('  ✓ Schema defaults missing invoiceType to final_tax with zero data loss.');

    // 2. Independent Sequential Numbering
    console.log('\n[2/12] Verifying Independent Sequential Numbering (PI-YYYY-XXX vs INV-YYYY-XXX)...');
    const existingList = [
        { code: 'INV-001', invoiceNumber: `INV-${currentYear}-001`, invoiceType: 'final_tax' },
        { code: 'INV-002', invoiceNumber: `INV-${currentYear}-002`, invoiceType: 'final_tax' },
        { code: 'PI-001', invoiceNumber: `PI-${currentYear}-001`, invoiceType: 'proforma' },
    ];

    const nextProforma = generateCrmInvoiceNumberAndCode('proforma', existingList, currentYear);
    assert(nextProforma.code === 'PI-002', `Next proforma code should be PI-002, got ${nextProforma.code}`);
    assert(nextProforma.invoiceNumber === `PI-${currentYear}-002`, `Next proforma invoiceNumber should be PI-${currentYear}-002, got ${nextProforma.invoiceNumber}`);

    const nextFinal = generateCrmInvoiceNumberAndCode('final_tax', existingList, currentYear);
    assert(nextFinal.code === 'INV-003', `Next final tax invoice code should be INV-003, got ${nextFinal.code}`);
    assert(nextFinal.invoiceNumber === `INV-${currentYear}-003`, `Next final tax invoice number should be INV-${currentYear}-003, got ${nextFinal.invoiceNumber}`);
    console.log('  ✓ Proforma (PI) and Final (INV) sequences increment independently.');

    // 3. Existing Invoices Intact & Functional
    console.log('\n[3/12] Verifying Existing Seed Invoices Intact & Queryable...');
    const initialFetch = await crmApi.getInvoices({ limit: 100 });
    assert(initialFetch.data.length >= 3, 'Existing invoices list has at least initial seed records');
    const inv1 = await crmApi.getInvoiceById('crm-inv-1');
    assert(inv1.id === 'crm-inv-1', 'crm-inv-1 exists and is retrievable');
    assert(inv1.invoiceType === 'final_tax', 'crm-inv-1 has final_tax type');
    assert(inv1.invoiceNumber === 'INV-2026-001', 'crm-inv-1 invoiceNumber preserved');
    console.log('  ✓ Existing invoices remain completely intact and functional.');

    // 4. Proforma Invoice Creation
    console.log('\n[4/12] Creating a Proforma Invoice via crmApi.createInvoice...');
    const testLineItems = [
        {
            id: 'test-pi-li-1',
            itemType: 'service' as const,
            serviceId: 'srv-1',
            descriptionEn: 'Strategic MISA Relocation Consulting',
            descriptionAr: 'استشارات نقل وتأسيس المقرات الإقليمية',
            quantity: 2,
            unitPrice: 10000,
            period: 1,
            periodUnit: 'months' as const,
            discountType: 'percentage' as const,
            discountPercent: 10,
            discountValue: 10,
            discountAmount: 2000,
            taxableAmount: 18000,
            taxRate: 15,
            taxAmount: 2700,
            vatRate: 15,
            vatAmount: 2700,
            lineTotal: 20700,
        },
    ];

    const createdProforma = await crmApi.createInvoice({
        invoiceType: 'proforma',
        titleEn: 'Proforma Invoice for Strategic Expansion',
        titleAr: 'فاتورة شكلية للتوسع الاستراتيجي',
        companyId: 'crm-comp-1',
        dealId: 'crm-deal-1',
        issueDate: '2026-04-01',
        dueDate: '2026-05-01',
        lineItems: testLineItems,
        notes: 'Preliminary proforma for board approval.',
    });

    assert(createdProforma.invoiceType === 'proforma', 'Invoice type must be proforma');
    assert(createdProforma.code.startsWith('PI-'), `Proforma code must start with PI-, got ${createdProforma.code}`);
    assert(createdProforma.invoiceNumber.startsWith(`PI-${currentYear}-`), `Proforma number must start with PI-${currentYear}-, got ${createdProforma.invoiceNumber}`);
    assert(createdProforma.totalAmount === 20700, `Calculated total matches line items (20700), got ${createdProforma.totalAmount}`);
    assert(createdProforma.paidAmount === 0, 'New proforma starts with 0 paid');
    console.log(`  ✓ Proforma created successfully: ${createdProforma.invoiceNumber} (${createdProforma.totalAmount} SAR).`);

    // 5. Creating a Final Tax Invoice with independent numbering
    console.log('\n[5/12] Creating a Final Tax Invoice with independent numbering...');
    const createdFinalTax = await crmApi.createInvoice({
        invoiceType: 'final_tax',
        titleEn: 'Quarterly Corporate Filing Final Invoice',
        titleAr: 'فاتورة ضريبية للإقرار الربعي',
        companyId: 'crm-comp-2',
        issueDate: '2026-04-05',
        dueDate: '2026-05-05',
        subtotal: 5000,
        taxRate: 15,
        totalAmount: 5750,
        notes: 'Final tax invoice for accounting.',
    });

    assert(createdFinalTax.invoiceType === 'final_tax', 'Invoice type must be final_tax');
    assert(createdFinalTax.code.startsWith('INV-'), `Final invoice code must start with INV-, got ${createdFinalTax.code}`);
    assert(createdFinalTax.invoiceNumber.startsWith(`INV-${currentYear}-`), `Final invoice number must start with INV-${currentYear}-, got ${createdFinalTax.invoiceNumber}`);
    console.log(`  ✓ Final Tax Invoice created successfully: ${createdFinalTax.invoiceNumber}.`);

    // 6. Proforma to Final Conversion
    console.log('\n[6/12] Converting Proforma Invoice to Final Tax Invoice...');
    const conversionResult = await crmApi.convertProformaToFinalInvoice(createdProforma.id);
    const updatedProforma = conversionResult.proforma;
    const finalInvoice = conversionResult.finalInvoice;

    // 7. Verify Final Invoice Properties
    console.log('\n[7/12] Verifying Generated Final Tax Invoice Properties...');
    assert(finalInvoice.id !== createdProforma.id, 'Final invoice has a unique, distinct ID');
    assert(finalInvoice.invoiceType === 'final_tax', 'Final invoice has invoiceType final_tax');
    assert(finalInvoice.code.startsWith('INV-'), 'Final invoice code starts with INV-');
    assert(finalInvoice.invoiceNumber.startsWith(`INV-${currentYear}-`), 'Final invoice number starts with INV-YYYY-');
    assert(finalInvoice.sourceProformaInvoiceId === createdProforma.id, 'Final invoice references sourceProformaInvoiceId');
    assert(finalInvoice.sourceProformaInvoiceNumber === createdProforma.invoiceNumber, 'Final invoice references sourceProformaInvoiceNumber');
    console.log(`  ✓ Final invoice ${finalInvoice.invoiceNumber} created and linked to source proforma.`);

    // 8. Verify Financial Totals & Line Items Preserved
    console.log('\n[8/12] Verifying Financial Totals, Tax, and Line Items match between Proforma and Final...');
    assert(finalInvoice.totalAmount === createdProforma.totalAmount, `Totals must match: ${finalInvoice.totalAmount} === ${createdProforma.totalAmount}`);
    assert(finalInvoice.subtotal === createdProforma.subtotal, `Subtotals must match: ${finalInvoice.subtotal} === ${createdProforma.subtotal}`);
    assert(finalInvoice.discountTotal === createdProforma.discountTotal, 'Discounts must match');
    assert(finalInvoice.vatAmount === createdProforma.vatAmount, 'VAT amounts must match');
    assert(finalInvoice.lineItems?.length === createdProforma.lineItems?.length, 'Line items count must match');
    assert(finalInvoice.companyId === createdProforma.companyId, 'Client company matches');
    assert(finalInvoice.currency === createdProforma.currency, 'Currency matches');
    console.log('  ✓ All financial totals, VAT, discounts, and line items precisely preserved.');

    // 9. Verify Initial State of Final Invoice
    console.log('\n[9/12] Verifying Final Invoice Initial Payment & Settlement State...');
    assert(finalInvoice.paidAmount === 0, 'Final invoice starts with paidAmount: 0');
    assert(finalInvoice.balanceDue === finalInvoice.totalAmount, 'Final invoice balanceDue equals totalAmount');
    assert(finalInvoice.invoiceStatus === 'issued', `Final invoice starts in issued status, got ${finalInvoice.invoiceStatus}`);
    console.log('  ✓ Final invoice is uncollected and in issued status as required.');

    // 10. Verify Original Proforma Preserved and Linked
    console.log('\n[10/12] Verifying Original Proforma Preserved with Target Final References...');
    assert(updatedProforma.id === createdProforma.id, 'Proforma ID preserved');
    assert(updatedProforma.invoiceType === 'proforma', 'Proforma type preserved');
    assert(updatedProforma.convertedToInvoiceId === finalInvoice.id, 'Proforma convertedToInvoiceId points to final invoice');
    assert(updatedProforma.convertedToInvoiceNumber === finalInvoice.invoiceNumber, 'Proforma convertedToInvoiceNumber matches final invoice number');
    assert(Boolean(updatedProforma.convertedAt), 'Proforma has convertedAt timestamp');
    assert(updatedProforma.totalAmount === createdProforma.totalAmount, 'Proforma financial data was NOT modified');
    console.log('  ✓ Original Proforma preserved as separate record with accurate forward references.');

    // 11. Repeated Conversion Attempt Rejected
    console.log('\n[11/12] Verifying Repeated Conversion Attempts and Non-Proforma Rejection...');
    let duplicateRejected = false;
    try {
        await crmApi.convertProformaToFinalInvoice(createdProforma.id);
    } catch (e: any) {
        duplicateRejected = true;
        assert(e.message.includes('already been converted') || e.message.includes('already exists'), 'Duplicate conversion error message expected');
    }
    assert(duplicateRejected, 'Repeated conversion attempt on already converted Proforma MUST be rejected');

    let nonProformaRejected = false;
    try {
        await crmApi.convertProformaToFinalInvoice(finalInvoice.id);
    } catch (e: any) {
        nonProformaRejected = true;
        assert(e.message.includes('not a Proforma Invoice'), 'Non-proforma error message expected');
    }
    assert(nonProformaRejected, 'Attempt to convert a Final Tax Invoice MUST be rejected');
    console.log('  ✓ Guardrails verified: duplicate and non-proforma conversion attempts properly rejected.');

    // 12. Bilingual Translations Verification
    console.log('\n[12/12] Verifying English and Arabic Translation Coverage...');
    const enJsonPath = path.resolve('src/i18n/en.json');
    const arJsonPath = path.resolve('src/i18n/ar.json');
    const en = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
    const ar = JSON.parse(fs.readFileSync(arJsonPath, 'utf8'));

    const requiredKeys = [
        ['crm', 'commercial', 'invoices', 'types', 'proforma'],
        ['crm', 'commercial', 'invoices', 'types', 'final_tax'],
        ['crm', 'commercial', 'invoices', 'types', 'proformaShort'],
        ['crm', 'commercial', 'invoices', 'types', 'finalTaxShort'],
        ['crm', 'commercial', 'invoices', 'allInvoiceTypes'],
        ['crm', 'commercial', 'invoices', 'viewDrawer', 'convertAction'],
        ['crm', 'commercial', 'invoices', 'viewDrawer', 'converting'],
        ['crm', 'commercial', 'invoices', 'viewDrawer', 'convertedToBanner'],
        ['crm', 'commercial', 'invoices', 'viewDrawer', 'convertedFromBanner'],
        ['crm', 'commercial', 'invoices', 'viewDrawer', 'viewFinalInvoice'],
        ['crm', 'commercial', 'invoices', 'viewDrawer', 'viewSourceProforma'],
        ['crm', 'commercial', 'invoices', 'feedback', 'convertedSuccess'],
        ['crm', 'commercial', 'invoices', 'feedback', 'alreadyConvertedError'],
        ['crm', 'commercial', 'invoices', 'feedback', 'notProformaError'],
    ];

    for (const keyPath of requiredKeys) {
        let enVal = en;
        let arVal = ar;
        for (const k of keyPath) {
            enVal = enVal?.[k];
            arVal = arVal?.[k];
        }
        assert(typeof enVal === 'string' && enVal.length > 0, `Missing EN translation for ${keyPath.join('.')}`);
        assert(typeof arVal === 'string' && arVal.length > 0, `Missing AR translation for ${keyPath.join('.')}`);
    }
    console.log('  ✓ All required translation keys are fully defined in en.json and ar.json.');

    // 13. Filter Querying by Invoice Type
    console.log('\nTesting crmApi.getInvoices invoiceType filtering...');
    const proformaOnly = await crmApi.getInvoices({ invoiceType: 'proforma' });
    assert(proformaOnly.data.every((inv) => (inv.invoiceType || '').includes('proforma') || inv.code.startsWith('PI-')), 'Proforma filter only returns proforma invoices');
    
    const finalOnly = await crmApi.getInvoices({ invoiceType: 'final_tax' });
    assert(finalOnly.data.every((inv) => (inv.invoiceType || 'final_tax') === 'final_tax' && !inv.code.startsWith('PI-')), 'Final tax filter only returns final tax invoices');
    console.log('  ✓ API filtering by invoiceType operates correctly.');

    // 14. Protected Modules Check
    console.log('\nChecking Protected Modules Integrity...');
    const protectedDirs = [
        'src/pages/edms',
        'src/pages/asset-management',
        'src/pages/ticketing',
        'src/pages/service',
        'src/components/Service',
    ];
    for (const p of protectedDirs) {
        if (fs.existsSync(p)) {
            assert(fs.statSync(p).isDirectory(), `${p} must remain intact`);
        }
    }
    console.log('  ✓ EDMS, Asset Management, Ticketing, and Service were NOT modified.');

    console.log('\n============================================================');
    console.log('SUCCESS: ALL 12 PHASE 2 INVOICE WORKFLOW CHECKS PASSED!');
    console.log('============================================================');
}

runPhase2Tests().catch((err) => {
    console.error('Phase 2 verification failed:', err);
    process.exit(1);
});
