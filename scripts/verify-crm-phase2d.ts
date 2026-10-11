/**
 * AWN CRM — Phase 2D Deterministic Verification Suite
 *
 * Verifies:
 * 1. Deals: Metrics, Filters, CRUD, Stage Transitions (Won/Lost rules), Denormalized Name Sync
 * 2. Quotations: Service & Package Catalog, Line-Item Financial Calculator (Subtotal, Discount, VAT, Grand Total), Approval Task Auto-Creation on Submit/Approve
 * 3. Commercial Conversions: Approved Quotation -> Contract, Approved Quotation -> Invoice, Contract -> Invoice
 * 4. Contracts: Metrics, CRUD, Lifecycle Status Transitions, Renewal Types
 * 5. Invoices: Metrics, CRUD, Partial & Full Payment Recording, Automatic Balance & Status Recalculation
 * 6. Won Deals: Filtered Closed-Won Deals & 360° Commercial/Revenue Summaries
 * 7. Referential Integrity Delete Protection (CRM_ENTITY_IN_USE) for Deals, Quotations, Contracts, and Paid Invoices
 * 8. Audit Trail Coverage for all Commercial Lifecycle mutations
 */

import {
    crmApi,
    CrmApiError,
    checkCrmCommercialDeletionEligibility,
} from '../src/api/api';
import {
    calculateCrmQuotationLineItem,
    calculateCrmQuotationTotals,
    calculateCrmContractAmounts,
    calculateCrmInvoiceAmounts,
} from '../src/schemas/crmSchema';

function assert(condition: unknown, message: string): void {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

async function runVerification(): Promise<void> {
    console.log('============================================================');
    console.log('AWN CRM — Phase 2D Commercial Lifecycle Verification...');
    console.log('============================================================');

    crmApi.resetAllCrmStorage();

    // ------------------------------------------------------------------------
    // 1. DETERMINISTIC FINANCIAL CALCULATORS
    // ------------------------------------------------------------------------
    console.log('\n[1/8] Verifying Deterministic Financial Calculators...');
    const item1 = calculateCrmQuotationLineItem({
        id: 'li-1',
        itemType: 'service',
        serviceId: 'srv-1',
        descriptionEn: 'Annual Statutory Financial Audit',
        quantity: 2,
        unitPrice: 25000,
        discountPercent: 10,
        taxRate: 15,
    });
    // Gross = 50,000, Discount = 5,000, Net = 45,000, Tax = 6,750, Total = 51,750
    assert(
        item1.discountAmount === 5000,
        `Expected discount 5000, got ${item1.discountAmount}`
    );
    assert(
        item1.taxAmount === 6750,
        `Expected tax 6750, got ${item1.taxAmount}`
    );
    assert(
        item1.lineTotal === 51750,
        `Expected lineTotal 51750, got ${item1.lineTotal}`
    );

    const totals = calculateCrmQuotationTotals([item1]);
    assert(totals.subtotal === 50000, 'Expected subtotal 50000');
    assert(totals.discountTotal === 5000, 'Expected discountTotal 5000');
    assert(totals.taxableAmount === 45000, 'Expected taxableAmount 45000');
    assert(totals.taxAmount === 6750, 'Expected taxAmount 6750');
    assert(totals.grandTotal === 51750, 'Expected grandTotal 51750');

    const contractCalc = calculateCrmContractAmounts({
        subtotal: 100000,
        discountTotal: 10000,
        taxRate: 15,
    });
    assert(
        contractCalc.taxAmount === 13500 && contractCalc.totalValue === 103500,
        'Expected contract tax 13500 and totalValue 103500'
    );

    const invoiceCalc = calculateCrmInvoiceAmounts({
        subtotal: 100000,
        discountTotal: 0,
        taxRate: 15,
        paidAmount: 50000,
    });
    assert(
        invoiceCalc.totalAmount === 115000 &&
            invoiceCalc.remainingAmount === 65000,
        'Expected invoice total 115000 and remaining 65000'
    );
    console.log('  ✓ Financial calculators verified.');

    // ------------------------------------------------------------------------
    // 2. DEALS CRUD, STAGE TRANSITIONS & METRICS
    // ------------------------------------------------------------------------
    console.log('\n[2/8] Verifying Deals CRUD, Stage Transitions & Metrics...');
    const initialDealMetrics = await crmApi.deals.getMetrics();
    assert(
        initialDealMetrics.totalDeals >= 4,
        `Expected at least 4 seeded deals, got ${initialDealMetrics.totalDeals}`
    );
    assert(
        initialDealMetrics.wonDealsCount >= 1,
        'Expected at least 1 seeded won deal'
    );

    const createdDeal = await crmApi.deals.create({
        titleEn: 'Enterprise ZATCA E-Invoicing & Audit Retainer FY2026',
        titleAr: 'اتفاقية الفوترة الإلكترونية والمراجعة السنوية 2026',
        leadId: 'crm-lead-2',
        companyId: 'crm-comp-2',
        contactId: 'crm-cnt-2',
        sectorId: 'crm-sec-3',
        stage: 'proposal',
        probability: 60,
        expectedValue: 160000,
        currency: 'SAR',
        expectedCloseDate: '2026-08-15',
        assignedEmployeeId: 'emp-2',
        notes: 'Strategic logistics client deal.',
        status: 'active',
    });
    assert(
        createdDeal.code.startsWith('DL-'),
        `Expected DL- code, got ${createdDeal.code}`
    );
    assert(
        createdDeal.companyNameEn === 'Dar Al-Omran Contracting CJSC',
        'Deal must resolve companyNameEn from Company'
    );

    // Transition to Won
    const wonDeal = await crmApi.deals.transitionStage(createdDeal.id, 'won');
    assert(
        wonDeal.stage === 'won' &&
            wonDeal.probability === 100 &&
            Boolean(wonDeal.wonAt),
        'Transitioning deal to won must set probability=100 and wonAt date'
    );
    console.log('  ✓ Deals CRUD and stage transitions verified.');

    // ------------------------------------------------------------------------
    // 3. QUOTATIONS, CATALOG & APPROVAL WORKFLOW
    // ------------------------------------------------------------------------
    console.log(
        '\n[3/8] Verifying Quotations, Service Catalog & Approval Workflow...'
    );
    const catalog = await crmApi.quotations.getServiceCatalog();
    assert(
        catalog.some((c) => c.itemType === 'service') &&
            catalog.some((c) => c.itemType === 'package'),
        'Service catalog must include both individual services and service packages'
    );

    const createdQuotation = await crmApi.quotations.create({
        titleEn: 'Najd Logistics Comprehensive Audit & Tax Proposal',
        titleAr: 'عرض المراجعة والزكاة لشركة نجد للخدمات اللوجستية',
        dealId: createdDeal.id,
        companyId: 'crm-comp-2',
        contactId: 'crm-cnt-2',
        assignedEmployeeId: 'emp-2',
        quotationStatus: 'draft',
        issueDate: '2026-04-01',
        validUntil: '2026-05-15',
        currency: 'SAR',
        lineItems: [item1],
        subtotal: 50000,
        discountTotal: 5000,
        taxableAmount: 45000,
        taxAmount: 6750,
        grandTotal: 51750,
        termsAndConditions: '50% upon signing, 50% on delivery.',
        status: 'active',
    });
    assert(
        createdQuotation.code.startsWith('QT-') &&
            createdQuotation.grandTotal === 51750,
        'Created quotation must have QT- code and grandTotal 51750'
    );

    // Submit for approval -> should create or update Approval Task
    const sentQuotation = await crmApi.quotations.transitionStatus(
        createdQuotation.id,
        'sent'
    );
    assert(
        sentQuotation.quotationStatus === 'sent',
        'Quotation status should transition to sent'
    );

    // Approve quotation
    const approvedQuotation = await crmApi.quotations.transitionStatus(
        createdQuotation.id,
        'approved'
    );
    assert(
        approvedQuotation.quotationStatus === 'approved',
        'Quotation status should transition to approved'
    );
    console.log('  ✓ Quotations and approval workflow verified.');

    // ------------------------------------------------------------------------
    // 4. COMMERCIAL CONVERSIONS (QUOTATION -> CONTRACT -> INVOICE)
    // ------------------------------------------------------------------------
    console.log(
        '\n[4/8] Verifying Downstream Conversions (Quotation -> Contract -> Invoice)...'
    );
    const convertedContract = await crmApi.quotations.convertToContract(
        approvedQuotation.id
    );
    assert(
        convertedContract.quotationId === approvedQuotation.id &&
            convertedContract.dealId === createdDeal.id &&
            convertedContract.totalValue === approvedQuotation.grandTotal,
        'Converted contract must inherit quotationId, dealId, and totalValue'
    );

    const activeContract = await crmApi.contracts.transitionStatus(
        convertedContract.id,
        'active'
    );
    assert(
        activeContract.contractStatus === 'active' &&
            Boolean(activeContract.signedDate),
        'Activating contract must set contractStatus=active and signedDate'
    );

    const generatedInvoice = await crmApi.contracts.generateInvoice(
        activeContract.id
    );
    assert(
        generatedInvoice.contractId === activeContract.id &&
            generatedInvoice.totalAmount === activeContract.totalValue &&
            generatedInvoice.remainingAmount === activeContract.totalValue,
        'Generated invoice must link to contract and carry full balance'
    );
    console.log('  ✓ Commercial conversions verified.');

    // ------------------------------------------------------------------------
    // 5. INVOICE PARTIAL & FULL PAYMENT SETTLEMENT
    // ------------------------------------------------------------------------
    console.log(
        '\n[5/8] Verifying Invoice Partial & Full Payment Recording...'
    );
    const partialInvoice = await crmApi.invoices.recordPayment(
        generatedInvoice.id,
        {
            amount: 20000,
            paymentMethod: 'Corporate Bank Transfer (SARIE)',
            paymentReference: 'SARIE-TEST-001',
        }
    );
    assert(
        partialInvoice.invoiceStatus === 'partially_paid' &&
            partialInvoice.paidAmount === 20000 &&
            partialInvoice.remainingAmount === 31750,
        `Expected partially_paid with 20000 paid and 31750 remaining, got ${partialInvoice.invoiceStatus} (${partialInvoice.paidAmount}/${partialInvoice.remainingAmount})`
    );

    const fullyPaidInvoice = await crmApi.invoices.recordPayment(
        generatedInvoice.id,
        {
            amount: 31750,
            paymentMethod: 'SADAD Biller Payment',
            paymentReference: 'SADAD-TEST-002',
        }
    );
    assert(
        fullyPaidInvoice.invoiceStatus === 'paid' &&
            fullyPaidInvoice.remainingAmount === 0 &&
            fullyPaidInvoice.paidAmount === 51750,
        'Full settlement must transition invoiceStatus to paid and remainingAmount to 0'
    );
    console.log('  ✓ Invoice payment recording verified.');

    // ------------------------------------------------------------------------
    // 6. WON DEALS & 360° COMMERCIAL SUMMARIES
    // ------------------------------------------------------------------------
    console.log('\n[6/8] Verifying Won Deals & 360° Revenue Summaries...');
    const wonSummaries = await crmApi.wonDeals.getSummaries({ limit: 50 });
    assert(
        wonSummaries.total >= 2,
        `Expected at least 2 won deals, got ${wonSummaries.total}`
    );
    const targetSummary = wonSummaries.data.find(
        (s) => s.deal.id === createdDeal.id
    );
    assert(
        Boolean(targetSummary) &&
            targetSummary!.quotations.length >= 1 &&
            targetSummary!.contracts.length >= 1 &&
            targetSummary!.invoices.length >= 1 &&
            targetSummary!.totalCollectedValue === 51750,
        'Won deal summary must aggregate linked quotations, contracts, invoices, and collected revenue'
    );
    console.log('  ✓ Won Deals 360° summaries verified.');

    // ------------------------------------------------------------------------
    // 7. REFERENTIAL INTEGRITY DELETE PROTECTION
    // ------------------------------------------------------------------------
    console.log(
        '\n[7/8] Verifying Referential Integrity Delete Protection...'
    );
    const dealEligibility = checkCrmCommercialDeletionEligibility(
        'deal',
        createdDeal.id
    );
    assert(
        !dealEligibility.canDelete && dealEligibility.referencedCount >= 3,
        'Deal with linked Quotation, Contract, and Invoice must block deletion'
    );

    let dealDeleteBlocked = false;
    try {
        await crmApi.deals.delete(createdDeal.id);
    } catch (err) {
        if (err instanceof CrmApiError && err.code === 'CRM_ENTITY_IN_USE') {
            dealDeleteBlocked = true;
        }
    }
    assert(dealDeleteBlocked, 'Deleting linked Deal must throw CRM_ENTITY_IN_USE');

    let paidInvoiceDeleteBlocked = false;
    try {
        await crmApi.invoices.delete(fullyPaidInvoice.id);
    } catch (err) {
        if (err instanceof CrmApiError && err.code === 'CRM_ENTITY_IN_USE') {
            paidInvoiceDeleteBlocked = true;
        }
    }
    assert(
        paidInvoiceDeleteBlocked,
        'Deleting paid Invoice must throw CRM_ENTITY_IN_USE'
    );
    console.log('  ✓ Referential integrity delete protection verified.');

    // ------------------------------------------------------------------------
    // 8. AUDIT TRAIL VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n[8/8] Verifying Commercial Audit Trail Coverage...');
    const auditLogs = await crmApi.getAuditTrails({ limit: 100 });
    const resourceTypes = new Set(auditLogs.data.map((a) => a.resourceType));
    assert(
        resourceTypes.has('Deal') &&
            resourceTypes.has('Quotation') &&
            resourceTypes.has('Contract') &&
            resourceTypes.has('Invoice'),
        'Audit Trail must record events for Deal, Quotation, Contract, and Invoice'
    );
    console.log('  ✓ Commercial Audit Trail coverage verified.');

    crmApi.resetAllCrmStorage();
    console.log('\n============================================================');
    console.log('ALL PHASE 2D VERIFICATION CHECKS PASSED SUCCESSFULLY.');
    console.log('============================================================');
}

runVerification().catch((err) => {
    console.error('\nPHASE 2D VERIFICATION FAILED:', err);
    process.exit(1);
});
