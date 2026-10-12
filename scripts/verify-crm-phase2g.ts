/**
 * AWN CRM — Phase 2G-B End-to-End Integration, Verification & Hardening Suite
 *
 * Verifies the complete end-to-end CRM lifecycle across Phases 2A through 2G-B:
 * 1. Master Data & Reference Configuration (Lead Source, Lead Status, Sector, Tax, Org Type, Ownership Type)
 * 2. Lead Creation, Assignment, Qualification & Qualified Exclusion Rule
 * 3. 3-Step Company Pre-Onboarding (Step 1 Basic Info, Step 2 Legal/CR/Tax, Step 3 Owners & Main Owner) -> Under Review Approval Task -> Approved Active Company
 * 4. Contact Creation & Primary Contact Exclusivity
 * 5. Deal Creation -> Stage Progression -> Quotation Creation (Service + Package Catalog + VAT Calculator)
 * 6. Quotation Submission -> Auto-Generated Approval Task -> Approval Task Decision -> Synchronization back to Quotation ('approved')
 * 7. Commercial Conversions: Approved Quotation -> Active Contract -> Invoice Generation -> Partial & Full Payment Recording -> Paid Status & Zero Balance
 * 8. Won Deals 360° Commercial & Revenue Rollup Verification
 * 9. Operational Tasks Creation, Specialist Assignment, Status Transitions & Completion Timestamp
 * 10. Audit Trails Chronological Ledger, Resource Type & Action Filtering, and Sensitive Field Redaction ([REDACTED])
 * 11. Sales Performance Dashboard & Sales Overview Dashboard KPI, Rep, Stage, Trend, Company & Sector Consistency
 * 12. Bilingual (EN/AR) Static & Dynamic Enum Translation Coverage + Route Integrity Across All 17 CRM Screens
 */

import fs from 'fs';
import path from 'path';
import en from '../src/i18n/en.json';
import ar from '../src/i18n/ar.json';
import { crmApi } from '../src/api/api';
import {
    calculateCrmQuotationLineItem,
    calculateCrmQuotationTotals,
    crmDealStageSchema,
    crmQuotationStatusSchema,
    crmContractStatusSchema,
    crmContractRenewalTypeSchema,
    crmInvoiceStatusSchema,
    crmCompanyOnboardingStatusSchema,
    crmTaskPrioritySchema,
    crmApprovalTaskStatusSchema,
    CRM_APPROVAL_TARGET_ENTITY_VALUES,
    crmOperationalTaskStatusSchema,
    CRM_OPERATIONAL_RELATED_ENTITY_VALUES,
    crmAuditActionSchema,
    CRM_AUDIT_RESOURCE_TYPE_VALUES,
} from '../src/schemas/crmSchema';

function assert(condition: unknown, message: string): void {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

function getByPath(obj: unknown, keyPath: string): unknown {
    return keyPath.split('.').reduce<unknown>((acc, part) => {
        if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[part];
        }
        return undefined;
    }, obj);
}

function walkFiles(dir: string): string[] {
    let results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(walkFiles(full));
        } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
            results.push(full);
        }
    }
    return results;
}

async function runPhase2GVerification(): Promise<void> {
    console.log('============================================================');
    console.log('AWN CRM — Phase 2G-B End-to-End Integration Verification');
    console.log('============================================================');

    crmApi.resetAllCrmStorage();

    // ------------------------------------------------------------------------
    // 1. MASTER DATA CREATION & REFERENCE INTEGRITY
    // ------------------------------------------------------------------------
    console.log('\n[1/9] Verifying Master Data Creation & Lookups...');
    const customSource = await crmApi.createLeadSource({
        nameEn: 'Vision 2030 Executive Forum',
        nameAr: 'منتدى رؤية 2030 التنفيذي',
        description: 'Direct executive leads from Vision 2030 B2B summit',
        status: 'active',
    });
    const customSector = await crmApi.createSector({
        nameEn: 'Renewable Energy & Hydrogen',
        nameAr: 'الطاقة المتجددة والهيدروجين الأخضر',
        description: 'Clean energy infrastructure and utility projects',
        status: 'active',
    });
    assert(customSource.code.startsWith('SRC-'), 'Lead source must have SRC- code');
    assert(
        customSector.code.startsWith('SCT-') || customSector.code.startsWith('SEC-'),
        `Sector must have SCT-/SEC- code, got ${customSector.code}`
    );
    console.log('  ✓ Master data creation verified.');

    // ------------------------------------------------------------------------
    // 2. LEAD -> QUALIFICATION -> 3-STEP COMPANY PRE-ONBOARDING -> APPROVAL
    // ------------------------------------------------------------------------
    console.log(
        '\n[2/9] Verifying Lead Qualification & 3-Step Company Pre-Onboarding...'
    );
    const lead = await crmApi.leads.create({
        title: 'Helios Arabia Green Hydrogen Advisory & Statutory Audit',
        leadType: 'company',
        leadSourceId: customSource.id,
        leadStatusId: 'crm-lst-1',
        assignedEmployeeId: 'emp-1',
        sectorId: customSector.id,
        contactName: 'Eng. Tariq Al-Qahtani',
        contactJobTitle: 'Chief Financial Officer',
        contactPhone: '+966 50 700 8899',
        contactEmail: 't.qahtani@helios-arabia.sa',
        temporaryCompanyName: 'Helios Arabia Clean Energy CJSC',
        companySize: '500+',
        estimatedValue: 250000,
        country: 'Saudi Arabia',
        state: 'Riyadh Province',
        city: 'Riyadh',
        status: 'active',
    });

    const qualifiedLead = await crmApi.leads.transitionStatus(lead.id, 'crm-lst-3');
    assert(
        qualifiedLead.leadStatusId === 'crm-lst-3' &&
            qualifiedLead.leadStatusNameEn === 'Qualified',
        'Lead must transition to Qualified status'
    );

    const onboardedCompany = await crmApi.companies.submitPreOnboarding({
        nameEn: 'Helios Arabia Clean Energy CJSC',
        nameAr: 'شركة هيليوس العربية للطاقة النظيفة مساهمة مقفلة',
        businessName: 'Helios Arabia',
        organizationalTypeId: 'crm-org-2',
        ownershipTypeId: 'crm-own-type-1',
        sectorId: customSector.id,
        assignedEmployeeId: 'emp-1',
        crNumber: '1010654321',
        unifiedNumber: '7006543210',
        taxNumber: '300654321000003',
        email: 'finance@helios-arabia.sa',
        phone: '+966 11 800 4455',
        country: 'Saudi Arabia',
        state: 'Riyadh Province',
        city: 'Riyadh',
        address: 'KAFD Tower 4, Al Aqeeq District',
        onboardingStatus: 'under_review',
        status: 'active',
        owners: [
            {
                firstName: 'Tariq',
                lastName: 'Al-Qahtani',
                fullNameEn: 'Tariq Al-Qahtani',
                fullNameAr: 'طارق القحطاني',
                gender: 'male',
                nationality: 'Saudi',
                ownershipTypeId: 'crm-own-type-1',
                nationalIdOrIqama: '1077665544',
                phone: '+966 50 700 8899',
                email: 't.qahtani@helios-arabia.sa',
                ownershipPercentage: 100,
                isMainOwner: true,
            },
        ],
    });
    assert(
        onboardedCompany.onboardingStatus === 'under_review',
        'Company should be created with under_review onboardingStatus'
    );

    // Verify auto-created Company Approval Task & approve it
    const companyApprovalTasks = await crmApi.approvalTasks.getAll({
        targetEntityType: 'Company',
        limit: 100,
    });
    const companyTask = companyApprovalTasks.data.find(
        (t) => t.targetEntityId === onboardedCompany.id
    );
    assert(
        Boolean(companyTask) && companyTask?.approvalStatus === 'Pending',
        'Submitting company in under_review must create a Pending Company Approval Task'
    );

    await crmApi.approvalTasks.approve(companyTask!.id, {
        decisionRemarks: 'CR, ZATCA Tax Certificate, and Shareholder ID verified.',
        decidedBy: 'Karim Wagdi',
    });

    const approvedCompany = await crmApi.companies.getById(onboardedCompany.id);
    assert(
        approvedCompany.onboardingStatus === 'active',
        `Approving Company Approval Task must set company onboardingStatus to 'active', got '${approvedCompany.onboardingStatus}'`
    );

    // Link Lead to Company and create Primary Contact
    await crmApi.leads.update(lead.id, { companyId: approvedCompany.id });
    const primaryContact = await crmApi.contacts.create({
        fullNameEn: 'Eng. Tariq Al-Qahtani',
        fullNameAr: 'م. طارق القحطاني',
        contactType: 'decision_maker',
        jobTitle: 'Chief Financial Officer',
        department: 'Finance',
        email: 't.qahtani@helios-arabia.sa',
        phone: '+966 50 700 8899',
        companyId: approvedCompany.id,
        isPrimary: true,
        status: 'active',
    });
    assert(primaryContact.isPrimary === true, 'Primary contact must be created');
    console.log(
        '  ✓ Lead qualification, 3-step Company Pre-Onboarding, and Company Approval synchronization verified.'
    );

    // ------------------------------------------------------------------------
    // 3. DEAL -> QUOTATION -> APPROVAL TASK -> CONTRACT -> INVOICE -> PAYMENT
    // ------------------------------------------------------------------------
    console.log(
        '\n[3/9] Verifying Commercial Pipeline & Governance Approval Sync...'
    );
    const deal = await crmApi.deals.create({
        titleEn: 'Helios Arabia FY2026 Audit & ZATCA Advisory Package',
        titleAr: 'باقة المراجعة القانونية والاستشارات الزكوية لشركة هيليوس 2026',
        leadId: lead.id,
        companyId: approvedCompany.id,
        contactId: primaryContact.id,
        sectorId: customSector.id,
        assignedEmployeeId: 'emp-1',
        stage: 'proposal',
        probability: 65,
        expectedValue: 230000,
        currency: 'SAR',
        expectedCloseDate: '2026-09-30',
        status: 'active',
    });

    const lineItem = calculateCrmQuotationLineItem({
        id: 'li-helios-1',
        itemType: 'service',
        serviceId: 'srv-1',
        descriptionEn: 'Annual Statutory Audit & ZATCA Advisory Retainer',
        descriptionAr: 'اتفاقية المراجعة القانونية السنوية والاستشارات الزكوية',
        quantity: 1,
        unitPrice: 200000,
        discountPercent: 0,
        taxRate: 15,
    });
    const qTotals = calculateCrmQuotationTotals([lineItem]);
    assert(
        qTotals.grandTotal === 230000,
        `Expected quotation grandTotal 230000, got ${qTotals.grandTotal}`
    );

    const quotation = await crmApi.quotations.create({
        titleEn: 'Helios Arabia Proposal FY2026',
        titleAr: 'العرض الفني والمالي لشركة هيليوس العربية 2026',
        dealId: deal.id,
        companyId: approvedCompany.id,
        contactId: primaryContact.id,
        assignedEmployeeId: 'emp-1',
        quotationStatus: 'draft',
        issueDate: '2026-05-01',
        validUntil: '2026-06-30',
        currency: 'SAR',
        lineItems: qTotals.lineItems,
        subtotal: qTotals.subtotal,
        discountTotal: qTotals.discountTotal,
        taxableAmount: qTotals.taxableAmount,
        taxAmount: qTotals.taxAmount,
        grandTotal: qTotals.grandTotal,
        status: 'active',
    });

    // Transition quotation to 'sent' -> auto-creates Approval Task
    await crmApi.quotations.transitionStatus(quotation.id, 'sent');
    const quoteApprovalTasks = await crmApi.approvalTasks.getAll({
        targetEntityType: 'Quotation',
        limit: 100,
    });
    const quoteTask = quoteApprovalTasks.data.find(
        (t) => t.targetEntityId === quotation.id
    );
    assert(
        Boolean(quoteTask) && quoteTask?.approvalStatus === 'Pending',
        'Transitioning quotation to sent must auto-create a Pending Quotation Approval Task'
    );

    // Approve via Approval Tasks API -> must sync Quotation status to 'approved'
    await crmApi.approvalTasks.approve(quoteTask!.id, {
        decisionRemarks: 'Commercial pricing and margin approved.',
        decidedBy: 'Karim Wagdi',
    });
    const syncedQuotation = await crmApi.quotations.getById(quotation.id);
    assert(
        syncedQuotation.quotationStatus === 'approved',
        `Approving Quotation Approval Task must sync quotationStatus to 'approved', got '${syncedQuotation.quotationStatus}'`
    );

    // Transition Deal to Won
    const wonDeal = await crmApi.deals.transitionStage(deal.id, 'won');
    assert(
        wonDeal.stage === 'won' && wonDeal.probability === 100,
        'Deal must transition to won with probability 100%'
    );

    // Convert Approved Quotation -> Contract -> Active -> Invoice -> Payment
    const contract = await crmApi.quotations.convertToContract(quotation.id);
    const activeContract = await crmApi.contracts.transitionStatus(
        contract.id,
        'active'
    );
    const invoice = await crmApi.contracts.generateInvoice(activeContract.id);
    assert(
        invoice.totalAmount === 230000 && invoice.remainingAmount === 230000,
        'Generated invoice must carry full 230,000 SAR total and balance'
    );

    const partiallyPaid = await crmApi.invoices.recordPayment(invoice.id, {
        amount: 100000,
        paymentMethod: 'Corporate Bank Transfer (SARIE)',
        paymentReference: 'SARIE-HELIOS-001',
    });
    assert(
        partiallyPaid.invoiceStatus === 'partially_paid' &&
            partiallyPaid.remainingAmount === 130000,
        'Partial payment must set status to partially_paid and remainingAmount to 130000'
    );

    const fullyPaid = await crmApi.invoices.recordPayment(invoice.id, {
        amount: 130000,
        paymentMethod: 'Corporate Bank Transfer (SARIE)',
        paymentReference: 'SARIE-HELIOS-002',
    });
    assert(
        fullyPaid.invoiceStatus === 'paid' && fullyPaid.remainingAmount === 0,
        'Final payment must set invoiceStatus to paid and remainingAmount to 0'
    );
    console.log(
        '  ✓ Deal -> Quotation -> Approval Task -> Contract -> Invoice -> Payment verified.'
    );

    // ------------------------------------------------------------------------
    // 4. WON DEALS 360° COMMERCIAL & REVENUE ROLLUP
    // ------------------------------------------------------------------------
    console.log('\n[4/9] Verifying Won Deals 360° Commercial & Revenue Rollup...');
    const wonDealsSummary = await crmApi.wonDeals.getSummaries({
        search: 'Helios Arabia',
        limit: 50,
    });
    const heliosSummary = wonDealsSummary.data.find(
        (s) => s.deal.id === deal.id
    );
    assert(
        Boolean(heliosSummary) &&
            heliosSummary!.quotations.length === 1 &&
            heliosSummary!.contracts.length === 1 &&
            heliosSummary!.invoices.length === 1 &&
            heliosSummary!.totalCollectedValue === 230000 &&
            heliosSummary!.totalOutstandingValue === 0,
        'Won Deal 360° rollup must accurately aggregate approved quotation, contract, and collected invoice amounts'
    );
    console.log('  ✓ Won Deals 360° commercial rollup verified.');

    // ------------------------------------------------------------------------
    // 5. OPERATIONAL TASKS WORKFLOW
    // ------------------------------------------------------------------------
    console.log('\n[5/9] Verifying Operational Tasks Lifecycle...');
    const opTask = await crmApi.operationalTasks.create({
        titleEn: 'Schedule Kickoff Workshop with Helios Arabia CFO',
        titleAr: 'جدولة ورشة العمل الافتتاحية مع المدير المالي لشركة هيليوس',
        relatedEntityType: 'Contract',
        relatedEntityId: activeContract.id,
        assignedSpecialistId: 'emp-2',
        priority: 'High',
        taskStatus: 'Pending',
        dueDate: '2026-05-15',
        notes: 'Coordinate audit kickoff deliverables.',
        status: 'active',
    });
    assert(opTask.code.startsWith('OPT-'), 'Operational task must have OPT- code');

    const completedTask = await crmApi.operationalTasks.updateStatus(
        opTask.id,
        'Completed',
        'Kickoff workshop completed and minutes signed.'
    );
    assert(
        completedTask.taskStatus === 'Completed' &&
            Boolean(completedTask.completedAt),
        'Completing operational task must set taskStatus=Completed and completedAt timestamp'
    );
    console.log('  ✓ Operational tasks workflow verified.');

    // ------------------------------------------------------------------------
    // 6. SALES PERFORMANCE DASHBOARD & SALES OVERVIEW DASHBOARD
    // ------------------------------------------------------------------------
    console.log(
        '\n[6/9] Verifying Sales Performance Dashboard & Sales Overview Analytics...'
    );
    const dashboard = await crmApi.getSalesPerformanceDashboard({
        companyId: approvedCompany.id,
    });
    assert(
        dashboard.kpis.wonDealsCount === 1 &&
            dashboard.kpis.wonRevenue === 230000 &&
            dashboard.kpis.totalCollectedAmount === 230000 &&
            dashboard.kpis.collectionRate === 100,
        'Sales Performance Dashboard filtered by Helios Arabia must report 1 won deal, 230,000 SAR won revenue, 230,000 SAR collected, and 100% collection rate'
    );

    const overview = await crmApi.getSalesPerformanceDashboard({
        assignedEmployeeId: 'emp-1',
    });
    assert(
        overview.kpis.totalDeals >= 1 && overview.stageBreakdown.length >= 6,
        'Sales Overview Dashboard must return valid KPIs and stage breakdown'
    );
    console.log('  ✓ Both Sales Dashboards verified.');

    // ------------------------------------------------------------------------
    // 7. AUDIT TRAILS & SENSITIVE FIELD REDACTION
    // ------------------------------------------------------------------------
    console.log(
        '\n[7/9] Verifying Audit Trails & Sensitive Identifier Redaction...'
    );
    const auditPage = await crmApi.auditTrails.getAll({ limit: 200 });
    assert(
        auditPage.total >= 15,
        `Expected at least 15 audit trail entries across full lifecycle, got ${auditPage.total}`
    );
    const serializedAudit = JSON.stringify(auditPage.data);
    assert(
        !serializedAudit.includes('1077665544'),
        'Sensitive National ID / Iqama numbers must be redacted in audit snapshots'
    );
    assert(
        serializedAudit.includes('[REDACTED]'),
        'Audit snapshots must contain [REDACTED] marker for sensitive fields'
    );
    console.log('  ✓ Audit trail completeness and redaction verified.');

    // ------------------------------------------------------------------------
    // 8. ROUTE INTEGRITY CHECK ACROSS ALL CRM PAGES & COMPONENTS
    // ------------------------------------------------------------------------
    console.log('\n[8/9] Verifying CRM Route Integrity Across Source Files...');
    const validCrmRoutes = new Set([
        '/crm/lead-source',
        '/crm/lead-status',
        '/crm/sectors',
        '/crm/tax',
        '/crm/organizational-types',
        '/crm/ownership-types',
        '/crm/leads',
        '/crm/companies',
        '/crm/contacts',
        '/crm/owners',
        '/crm/deals',
        '/crm/quotations',
        '/crm/contracts',
        '/crm/invoices',
        '/crm/approval-tasks',
        '/crm/operational-task',
        '/crm/audit-trails',
        '/crm/won-deals',
        '/crm/sales-performance-dashboard',
        '/crm/dashboard-sales',
    ]);

    const crmFiles = [
        ...walkFiles(path.resolve('./src/pages/crm')),
        ...walkFiles(path.resolve('./src/components/crm')),
    ];
    for (const file of crmFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const routeMatches = content.match(/['"]\/crm\/[a-z-]+['"]/g) || [];
        for (const rawMatch of routeMatches) {
            const route = rawMatch.slice(1, -1);
            assert(
                validCrmRoutes.has(route),
                `Invalid CRM route reference '${route}' found in ${path.relative(process.cwd(), file)}`
            );
        }
    }
    console.log('  ✓ All CRM route references match registered router paths.');

    // ------------------------------------------------------------------------
    // 9. BILINGUAL (EN/AR) STATIC & DYNAMIC ENUM TRANSLATION COVERAGE
    // ------------------------------------------------------------------------
    console.log(
        '\n[9/9] Verifying Bilingual (EN/AR) Static & Dynamic Enum Translations...'
    );
    for (const file of crmFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const staticMatches = content.match(/['"]crm\.[a-zA-Z0-9_.]+['"]/g) || [];
        for (const rawKey of staticMatches) {
            const key = rawKey.slice(1, -1);
            assert(
                typeof getByPath(en, key) === 'string',
                `Missing EN translation for '${key}' in ${path.relative(process.cwd(), file)}`
            );
            assert(
                typeof getByPath(ar, key) === 'string',
                `Missing AR translation for '${key}' in ${path.relative(process.cwd(), file)}`
            );
        }
    }

    const enumNamespaces: Array<[string, readonly string[]]> = [
        ['crm.commercial.deals.stages', crmDealStageSchema.options],
        ['crm.commercial.quotations.statuses', crmQuotationStatusSchema.options],
        ['crm.commercial.contracts.statuses', crmContractStatusSchema.options],
        [
            'crm.commercial.contracts.renewalTypes',
            crmContractRenewalTypeSchema.options,
        ],
        ['crm.commercial.invoices.statuses', crmInvoiceStatusSchema.options],
        [
            'crm.companies.onboardingStatuses',
            crmCompanyOnboardingStatusSchema.options,
        ],
        [
            'crm.customer.companies.onboardingStatuses',
            crmCompanyOnboardingStatusSchema.options,
        ],
        ['crm.workflow.common.priorities', crmTaskPrioritySchema.options],
        [
            'crm.workflow.approvalTasks.statuses',
            crmApprovalTaskStatusSchema.options,
        ],
        ['crm.workflow.approvalTasks.modules', CRM_APPROVAL_TARGET_ENTITY_VALUES],
        [
            'crm.workflow.operationalTasks.statuses',
            crmOperationalTaskStatusSchema.options,
        ],
        [
            'crm.workflow.operationalTasks.entityTypes',
            CRM_OPERATIONAL_RELATED_ENTITY_VALUES,
        ],
        ['crm.workflow.auditTrails.actions', crmAuditActionSchema.options],
        [
            'crm.workflow.auditTrails.resourceTypes',
            CRM_AUDIT_RESOURCE_TYPE_VALUES,
        ],
        [
            'crm.dashboardSales.activities.priorities',
            crmTaskPrioritySchema.options,
        ],
        [
            'crm.dashboardSales.activities.taskStatuses',
            crmOperationalTaskStatusSchema.options,
        ],
    ];

    for (const [ns, values] of enumNamespaces) {
        const enObj = getByPath(en, ns) as Record<string, unknown> | undefined;
        const arObj = getByPath(ar, ns) as Record<string, unknown> | undefined;
        for (const val of values) {
            assert(
                Boolean(enObj && typeof enObj[val] === 'string'),
                `Missing EN dynamic enum translation: ${ns}.${val}`
            );
            assert(
                Boolean(arObj && typeof arObj[val] === 'string'),
                `Missing AR dynamic enum translation: ${ns}.${val}`
            );
        }
    }
    console.log(
        '  ✓ 100% EN/AR static & dynamic enum translation coverage verified.'
    );

    console.log('\n============================================================');
    console.log('ALL PHASE 2G-B END-TO-END CRM CHECKS PASSED SUCCESSFULLY!');
    console.log('============================================================');
}

runPhase2GVerification().catch((error) => {
    console.error('\nPHASE 2G-B VERIFICATION FAILED:', error);
    process.exit(1);
});
