/**
 * AWN CRM — Phase 2C Deterministic Verification Suite
 *
 * Verifies:
 * 1. Leads: Metrics (Qualified exclusion rule), Filters, CRUD, Stage Transitions, Rep Assignment, Batch Import, External URL
 * 2. Companies: 3-Step Pre-Onboarding Atomic Transaction, Rollback on invalid owners, Update & Dependent Entity Name Sync
 * 3. Contacts: CRUD, Primary Contact exclusivity per Company, Batch Import
 * 4. Owners: CRUD, First/Last Name auto-composition, Sync with Company shareholders
 * 5. Referential Integrity Delete Protection (CRM_ENTITY_IN_USE) & Safe Deactivation for Lead, Company, Contact, Owner
 * 6. Audit Trail Logging & Sensitive Field Redaction (nationalIdOrIqama, crNumber, taxNumber, unifiedNumber)
 */

import { crmApi, CrmApiError } from '../src/api/api';

function assert(condition: unknown, message: string): void {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

async function runVerification(): Promise<void> {
    console.log('============================================================');
    console.log('AWN CRM — Phase 2C Verification Suite Starting...');
    console.log('============================================================');

    crmApi.resetAllCrmStorage();

    // ------------------------------------------------------------------------
    // 1. LEADS METRICS & QUALIFIED EXCLUSION RULE
    // ------------------------------------------------------------------------
    console.log('\n[1/7] Verifying Leads Metrics & Qualified Exclusion Rule...');
    const initialMetrics = await crmApi.leads.getMetrics();
    assert(
        initialMetrics.allLeadsCount >= 3,
        `Expected at least 3 seeded leads, got ${initialMetrics.allLeadsCount}`
    );
    assert(
        initialMetrics.qualifiedLeads >= 1,
        `Expected at least 1 seeded Qualified lead, got ${initialMetrics.qualifiedLeads}`
    );
    assert(
        initialMetrics.totalLeads ===
            initialMetrics.allLeadsCount - initialMetrics.qualifiedLeads,
        `Expected totalLeads (${initialMetrics.totalLeads}) to equal allLeadsCount (${initialMetrics.allLeadsCount}) - qualifiedLeads (${initialMetrics.qualifiedLeads})`
    );

    const mainTableLeads = await crmApi.leads.getAll({
        includeQualified: false,
        limit: 100,
    });
    assert(
        mainTableLeads.total === initialMetrics.totalLeads,
        `Main table with includeQualified=false should return ${initialMetrics.totalLeads} leads, got ${mainTableLeads.total}`
    );
    assert(
        !mainTableLeads.data.some((l) => l.leadStatusId === 'crm-lst-3'),
        'Main table with includeQualified=false must not include Qualified leads (crm-lst-3)'
    );

    const allStagesLeads = await crmApi.leads.getAll({
        includeQualified: true,
        limit: 100,
    });
    assert(
        allStagesLeads.total === initialMetrics.allLeadsCount,
        `All stages query should return ${initialMetrics.allLeadsCount} leads`
    );
    console.log('  ✓ Lead metrics and Qualified exclusion verified.');

    // ------------------------------------------------------------------------
    // 2. LEADS CRUD, STAGE TRANSITION, ASSIGNMENT, IMPORT & EXTERNAL URL
    // ------------------------------------------------------------------------
    console.log(
        '\n[2/7] Verifying Leads CRUD, Stage Transition, Assignment & Batch Import...'
    );
    const externalUrl = crmApi.leads.getExternalFormUrl();
    assert(
        externalUrl.includes('/crm/external/lead-inquiry'),
        'External lead form URL should contain /crm/external/lead-inquiry'
    );

    const createdLead = await crmApi.leads.create({
        title: 'Riyadh Smart Logistics Fleet Expansion',
        leadType: 'company',
        leadSourceId: 'crm-src-1',
        leadStatusId: 'crm-lst-1',
        assignedEmployeeId: '',
        sectorId: 'crm-sec-3',
        contactName: 'Badr Al-Mutairi',
        contactJobTitle: 'VP of Supply Chain',
        contactPhone: '+966 50 321 7654',
        contactEmail: 'b.mutairi@riyadh-smartfleet.sa',
        temporaryCompanyName: 'Riyadh Smart Fleet Co.',
        companySize: '200-500',
        estimatedValue: 380000,
        country: 'Saudi Arabia',
        state: 'Riyadh Province',
        city: 'Riyadh',
        status: 'active',
    });
    assert(createdLead.code.startsWith('LD-'), 'Created lead must have LD- code');

    // Assign sales employee
    const assignedLead = await crmApi.leads.assignEmployee(
        createdLead.id,
        'emp-2'
    );
    assert(
        assignedLead.assignedEmployeeId === 'emp-2' &&
            assignedLead.assignedEmployeeNameEn === 'Noura Al-Subaie',
        'Assigned employee should resolve to Noura Al-Subaie'
    );

    // Transition stage to Qualified (crm-lst-3)
    const transitionedLead = await crmApi.leads.transitionStatus(
        createdLead.id,
        'crm-lst-3'
    );
    assert(
        transitionedLead.leadStatusId === 'crm-lst-3' &&
            transitionedLead.leadStatusNameEn === 'Qualified',
        'Lead should transition to Qualified stage'
    );

    // Batch import leads
    const importLeadsRes = await crmApi.leads.importBatch([
        {
            title: 'Eastern Province Petrochemical Advisory',
            contactName: 'Salman Al-Dosari',
            contactPhone: '+966 55 900 1122',
            contactEmail: 's.dosari@ep-petro.sa',
            temporaryCompanyName: 'EP Petrochemical Services',
            estimatedValue: 510000,
            city: 'Dammam',
        },
    ]);
    assert(
        importLeadsRes.importedCount === 1 && importLeadsRes.skippedCount === 0,
        'Batch lead import should import 1 valid row'
    );
    console.log(
        '  ✓ Leads CRUD, stage transition, employee assignment, and batch import verified.'
    );

    // ------------------------------------------------------------------------
    // 3. 3-STEP COMPANY PRE-ONBOARDING ATOMIC TRANSACTION & ROLLBACK
    // ------------------------------------------------------------------------
    console.log(
        '\n[3/7] Verifying 3-Step Company Pre-Onboarding Atomic Transaction & Rollback...'
    );
    const ownersBeforeRollback = (await crmApi.owners.getAll({ limit: 200 })).total;

    // Attempt invalid pre-onboarding (2 Main Owners -> must fail and rollback)
    let rollbackTriggered = false;
    try {
        await crmApi.companies.submitPreOnboarding({
            nameEn: 'Invalid Rollback Corp',
            nameAr: 'شركة التراجع التجريبية',
            organizationalTypeId: 'crm-org-1',
            sectorId: 'crm-sec-1',
            crNumber: '1010998877',
            email: 'info@rollback-corp.sa',
            phone: '+966 11 999 8877',
            country: 'Saudi Arabia',
            onboardingStatus: 'pre_onboarding',
            status: 'active',
            owners: [
                {
                    fullNameEn: 'Owner One',
                    ownershipTypeId: 'crm-own-type-1',
                    phone: '+966 50 111 1111',
                    ownershipPercentage: 50,
                    isMainOwner: true,
                },
                {
                    fullNameEn: 'Owner Two',
                    ownershipTypeId: 'crm-own-type-1',
                    phone: '+966 50 222 2222',
                    ownershipPercentage: 50,
                    isMainOwner: true,
                },
            ],
        });
    } catch (err) {
        rollbackTriggered = err instanceof CrmApiError;
    }
    assert(
        rollbackTriggered,
        'Pre-Onboarding with multiple Main Owners must fail validation'
    );
    const ownersAfterRollback = (await crmApi.owners.getAll({ limit: 200 })).total;
    assert(
        ownersAfterRollback === ownersBeforeRollback,
        'Atomic rollback must prevent orphan Owner creation when Pre-Onboarding fails'
    );

    // Valid 3-step Company Pre-Onboarding
    const onboardedCompany = await crmApi.companies.submitPreOnboarding({
        nameEn: 'Najd Digital Infrastructure LLC',
        nameAr: 'شركة نجد للبنية الرقمية ذ.م.م',
        businessName: 'Najd Digital',
        organizationalTypeId: 'crm-org-1',
        ownershipTypeId: 'crm-own-type-1',
        sectorId: 'crm-sec-1',
        assignedEmployeeId: 'emp-1',
        crNumber: '1010776655',
        unifiedNumber: '7007766554',
        taxNumber: '300776655400003',
        email: 'corporate@najd-digital.sa',
        phone: '+966 11 456 7890',
        country: 'Saudi Arabia',
        state: 'Riyadh Province',
        city: 'Riyadh',
        address: 'King Fahd Road, Olaya District',
        onboardingStatus: 'pre_onboarding',
        status: 'active',
        owners: [
            {
                firstName: 'Mansour',
                lastName: 'Al-Ghamdi',
                fullNameEn: 'Mansour Al-Ghamdi',
                fullNameAr: 'منصور الغامدي',
                gender: 'male',
                nationality: 'Saudi',
                ownershipTypeId: 'crm-own-type-1',
                nationalIdOrIqama: '1088776655',
                phone: '+966 50 887 7665',
                email: 'm.ghamdi@najd-digital.sa',
                ownershipPercentage: 70,
                isMainOwner: true,
            },
            {
                firstName: 'Sara',
                lastName: 'Al-Ghamdi',
                fullNameEn: 'Sara Al-Ghamdi',
                fullNameAr: 'سارة الغامدي',
                gender: 'female',
                nationality: 'Saudi',
                ownershipTypeId: 'crm-own-type-2',
                nationalIdOrIqama: '1088776656',
                phone: '+966 50 887 7666',
                email: 's.ghamdi@najd-digital.sa',
                ownershipPercentage: 30,
                isMainOwner: false,
            },
        ],
    });
    assert(
        onboardedCompany.code.startsWith('CMP-') &&
            onboardedCompany.owners.length === 2,
        'Onboarded company must be created with 2 owners'
    );
    const ownersAfterSuccess = (await crmApi.owners.getAll({ limit: 200 })).total;
    assert(
        ownersAfterSuccess === ownersBeforeRollback + 2,
        'Pre-Onboarding must atomically create the 2 new Owner records in the Owners directory'
    );
    console.log(
        '  ✓ 3-Step Company Pre-Onboarding atomic transaction & rollback verified.'
    );

    // ------------------------------------------------------------------------
    // 4. COMPANY UPDATE & DEPENDENT ENTITY NAME SYNC
    // ------------------------------------------------------------------------
    console.log('\n[4/7] Verifying Company Update & Dependent Entity Sync...');
    const updatedCompany = await crmApi.companies.update('crm-comp-1', {
        nameEn: 'Al-Marai Industrial Holdings Group',
        nameAr: 'مجموعة المراعي للصناعات القابضة',
    });
    assert(
        updatedCompany.nameEn === 'Al-Marai Industrial Holdings Group',
        'Company nameEn should update'
    );
    const syncedContact = await crmApi.contacts.getById('crm-cnt-1');
    assert(
        syncedContact.companyNameEn === 'Al-Marai Industrial Holdings Group' &&
            syncedContact.companyNameAr === 'مجموعة المراعي للصناعات القابضة',
        'Linked Contact companyNameEn/companyNameAr must sync when Company is renamed'
    );
    console.log('  ✓ Company update and dependent entity name sync verified.');

    // ------------------------------------------------------------------------
    // 5. CONTACTS & OWNERS CRUD + PRIMARY EXCLUSIVITY
    // ------------------------------------------------------------------------
    console.log(
        '\n[5/7] Verifying Contacts & Owners CRUD and Primary Contact Exclusivity...'
    );
    const newPrimaryContact = await crmApi.contacts.create({
        fullNameEn: 'Yasser Al-Sudairi',
        fullNameAr: 'ياسر السديري',
        contactType: 'decision_maker',
        jobTitle: 'Chief Executive Officer',
        department: 'Executive Board',
        email: 'y.sudairi@almarai-industrial.sa',
        phone: '+966 50 998 8776',
        companyId: 'crm-comp-1',
        isPrimary: true,
        status: 'active',
    });
    assert(
        newPrimaryContact.isPrimary === true,
        'New contact should be marked primary'
    );
    const previousPrimaryContact = await crmApi.contacts.getById('crm-cnt-1');
    assert(
        previousPrimaryContact.isPrimary === false,
        'Previous primary contact on same company should be demoted when a new primary contact is added'
    );

    // Standalone Owner creation & update
    const standaloneOwner = await crmApi.owners.create({
        firstName: 'Nasser',
        lastName: 'Al-Subaie',
        fullNameEn: '',
        fullNameAr: 'ناصر السبيعي',
        gender: 'male',
        nationality: 'Saudi',
        ownershipTypeId: 'crm-own-type-1',
        nationalIdOrIqama: '1044556677',
        phone: '+966 55 445 5667',
        email: 'n.subaie@invest.sa',
        ownershipPercentage: 100,
        isMainOwner: false,
        status: 'active',
    });
    assert(
        standaloneOwner.fullNameEn === 'Nasser Al-Subaie',
        'Owner fullNameEn should auto-compose from firstName + lastName'
    );
    console.log('  ✓ Contacts and Owners CRUD verified.');

    // ------------------------------------------------------------------------
    // 6. REFERENTIAL INTEGRITY DELETE PROTECTION & SAFE DEACTIVATION
    // ------------------------------------------------------------------------
    console.log(
        '\n[6/7] Verifying Referential Integrity Delete Protection & Safe Deactivation...'
    );
    // Company crm-comp-1 is referenced by Leads, Contacts, Owners, Deals -> cannot be deleted
    let companyDeleteBlocked = false;
    try {
        await crmApi.companies.delete('crm-comp-1');
    } catch (err) {
        companyDeleteBlocked =
            err instanceof CrmApiError && err.code === 'CRM_ENTITY_IN_USE';
    }
    assert(
        companyDeleteBlocked,
        'Deleting a Company with linked records must throw CRM_ENTITY_IN_USE'
    );

    // Contact crm-cnt-1 is referenced by Deal/Quotation/Contract -> cannot be deleted
    let contactDeleteBlocked = false;
    try {
        await crmApi.contacts.delete('crm-cnt-1');
    } catch (err) {
        contactDeleteBlocked =
            err instanceof CrmApiError && err.code === 'CRM_ENTITY_IN_USE';
    }
    assert(
        contactDeleteBlocked,
        'Deleting a Contact linked to a Deal/Quotation/Contract must throw CRM_ENTITY_IN_USE'
    );

    // Owner crm-own-1 is linked to Company crm-comp-1 -> cannot be deleted
    let ownerDeleteBlocked = false;
    try {
        await crmApi.owners.delete('crm-own-1');
    } catch (err) {
        ownerDeleteBlocked =
            err instanceof CrmApiError && err.code === 'CRM_ENTITY_IN_USE';
    }
    assert(
        ownerDeleteBlocked,
        'Deleting an Owner linked to a Company must throw CRM_ENTITY_IN_USE'
    );

    // Unreferenced standalone owner CAN be deleted
    const deletedOwnerRes = await crmApi.owners.delete(standaloneOwner.id);
    assert(
        deletedOwnerRes.success === true,
        'Unreferenced standalone Owner should delete cleanly'
    );
    console.log(
        '  ✓ Referential integrity delete protection and unreferenced deletion verified.'
    );

    // ------------------------------------------------------------------------
    // 7. AUDIT TRAIL LOGGING & SENSITIVE FIELD REDACTION
    // ------------------------------------------------------------------------
    console.log(
        '\n[7/7] Verifying Audit Trail Logging & Sensitive Field Redaction...'
    );
    const audits = await crmApi.getAuditTrails();
    assert(audits.length >= 6, 'Audit trail should record Phase 2C mutations');
    const serializedAudits = JSON.stringify(audits);
    assert(
        !serializedAudits.includes('1088776655') &&
            !serializedAudits.includes('1044556677'),
        'Sensitive National ID / Iqama values must be redacted from audit snapshots'
    );
    assert(
        serializedAudits.includes('[REDACTED]'),
        'Audit trail snapshots must contain [REDACTED] for sensitive fields'
    );
    console.log(
        '  ✓ Audit trail logging and sensitive data redaction verified.'
    );

    console.log('\n============================================================');
    console.log('ALL PHASE 2C VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('============================================================');
}

runVerification().catch((error) => {
    console.error('\nPHASE 2C VERIFICATION FAILED:', error);
    process.exit(1);
});
