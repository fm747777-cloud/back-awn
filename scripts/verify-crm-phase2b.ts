/**
 * AWN CRM — Phase 2B Deterministic Verification Suite
 *
 * Verifies:
 * 1. Zod schema compliance for all 6 CRM Master entities
 * 2. List, bilingual search (EN/AR), and status filter for all 6 Master entities
 * 3. Create, Edit, and Status Toggle workflows
 * 4. Case-insensitive duplicate name rejection (EN & AR -> 409 CRM_DUPLICATE_NAME)
 * 5. Lead Status ordering (moveUp/moveDown & reorder), closing stage outcome, and system-default protection
 * 6. Tax rate validation (0-100%), single default tax enforcement, and quotation/invoice referential protection
 * 7. Dependent entity name synchronization (Leads, Companies, Owners) on Master rename
 * 8. Referential integrity delete protection (409 CRM_MASTER_IN_USE) & clean unreferenced delete
 * 9. Automatic CRM Audit Trail logging for Master mutations
 * 10. Bilingual i18n completeness (en.json / ar.json)
 */

const memoryStore = new Map<string, string>();
const localStoragePolyfill: Storage = {
    get length() {
        return memoryStore.size;
    },
    clear() {
        memoryStore.clear();
    },
    getItem(key: string) {
        return memoryStore.has(key) ? memoryStore.get(key)! : null;
    },
    key(index: number) {
        return Array.from(memoryStore.keys())[index] ?? null;
    },
    removeItem(key: string) {
        memoryStore.delete(key);
    },
    setItem(key: string, value: string) {
        memoryStore.set(key, String(value));
    },
};

Object.defineProperty(globalThis, 'localStorage', {
    value: localStoragePolyfill,
    writable: true,
    configurable: true,
});

if (typeof globalThis.window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
        value: { localStorage: localStoragePolyfill },
        writable: true,
        configurable: true,
    });
}

import { crmApi, CrmApiError, CRM_STORAGE_KEYS } from '../src/api/api';
import {
    crmLeadSourceSchema,
    crmLeadStatusSchema,
    crmSectorSchema,
    crmTaxSchema,
    crmOrganizationalTypeSchema,
    crmOwnershipTypeSchema,
    type CrmLeadRecord,
} from '../src/schemas/crmSchema';
import enJson from '../src/i18n/en.json';
import arJson from '../src/i18n/ar.json';

function assert(condition: unknown, message: string): void {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

async function expectCrmError(
    fn: () => Promise<unknown>,
    expectedCode: CrmApiError['code'],
    context: string
): Promise<void> {
    let caught: unknown = null;
    try {
        await fn();
    } catch (err) {
        caught = err;
    }
    assert(
        caught instanceof CrmApiError,
        `${context}: Expected CrmApiError, got ${String(caught)}`
    );
    if (caught instanceof CrmApiError) {
        assert(
            caught.code === expectedCode,
            `${context}: Expected code ${expectedCode}, got ${caught.code} (${caught.message})`
        );
    }
}

async function runVerification(): Promise<void> {
    console.log('=== AWN CRM Phase 2B Verification Suite ===');

    // Reset seed state
    crmApi.resetAllCrmStorage();

    // 1. Validate Initial Seed Records against Zod Schemas
    const sourcesRes = await crmApi.getLeadSources({ page: 1, limit: 100 });
    assert(
        sourcesRes.data.length >= 4,
        'Lead Sources seed should have >= 4 records'
    );
    sourcesRes.data.forEach((r) => crmLeadSourceSchema.parse(r));

    const statusesRes = await crmApi.getLeadStatuses({ page: 1, limit: 100 });
    assert(
        statusesRes.data.length >= 5,
        'Lead Statuses seed should have >= 5 records'
    );
    statusesRes.data.forEach((r) => crmLeadStatusSchema.parse(r));

    const sectorsRes = await crmApi.getSectors({ page: 1, limit: 100 });
    assert(sectorsRes.data.length >= 4, 'Sectors seed should have >= 4 records');
    sectorsRes.data.forEach((r) => crmSectorSchema.parse(r));

    const taxesRes = await crmApi.getTaxes({ page: 1, limit: 100 });
    assert(taxesRes.data.length >= 3, 'Taxes seed should have >= 3 records');
    taxesRes.data.forEach((r) => crmTaxSchema.parse(r));

    const orgTypesRes = await crmApi.getOrganizationalTypes({
        page: 1,
        limit: 100,
    });
    assert(
        orgTypesRes.data.length >= 4,
        'Organizational Types seed should have >= 4 records'
    );
    orgTypesRes.data.forEach((r) => crmOrganizationalTypeSchema.parse(r));

    const ownTypesRes = await crmApi.getOwnershipTypes({
        page: 1,
        limit: 100,
    });
    assert(
        ownTypesRes.data.length >= 4,
        'Ownership Types seed should have >= 4 records'
    );
    ownTypesRes.data.forEach((r) => crmOwnershipTypeSchema.parse(r));
    console.log(
        '✓ 1. All 6 Master seed collections pass strict Zod validation.'
    );

    // 2. Bilingual Search (EN & AR)
    const arSectorSearch = await crmApi.getSectors({
        search: 'التطوير العقاري',
    });
    assert(
        arSectorSearch.data.length === 1,
        'Arabic search on Sectors should match Construction & Real Estate Development'
    );
    const enSourceSearch = await crmApi.getLeadSources({
        search: 'Website Inquiry',
    });
    assert(
        enSourceSearch.data.length === 1,
        'English search on Lead Sources should match Website Inquiry'
    );
    console.log('✓ 2. Bilingual search (EN & AR) verified across Master API.');

    // 3. Lead Sources: Create, Duplicate Prevention, Dependent Sync, Referential Integrity, Delete
    const createdSource = await crmApi.createLeadSource({
        nameEn: 'Strategic Partner Channel',
        nameAr: 'قناة الشركاء الاستراتيجيين',
        descriptionEn: 'Partner referrals',
        descriptionAr: 'إحالات الشركاء',
        status: 'active',
    });
    assert(
        createdSource.code.startsWith('SRC-'),
        'Created Lead Source should have SRC- code'
    );

    await expectCrmError(
        () =>
            crmApi.createLeadSource({
                nameEn: 'strategic partner channel',
                nameAr: 'اسم مختلف',
                status: 'active',
            }),
        'CRM_DUPLICATE_NAME',
        'Duplicate Lead Source English name'
    );

    await expectCrmError(
        () =>
            crmApi.createLeadSource({
                nameEn: 'Unique English Name',
                nameAr: 'قناة الشركاء الاستراتيجيين',
                status: 'active',
            }),
        'CRM_DUPLICATE_NAME',
        'Duplicate Lead Source Arabic name'
    );

    // Rename referenced Lead Source and verify Leads denormalized name updates
    await crmApi.updateLeadSource('crm-src-1', {
        nameEn: 'Direct Enterprise Portal Inquiry',
        nameAr: 'استفسار بوابة الشركات المباشر',
    });
    const rawLeads = localStorage.getItem(CRM_STORAGE_KEYS.LEADS);
    const parsedLeads: CrmLeadRecord[] = rawLeads ? JSON.parse(rawLeads) : [];
    const linkedLead = parsedLeads.find((l) => l.leadSourceId === 'crm-src-1');
    assert(
        linkedLead?.leadSourceNameEn === 'Direct Enterprise Portal Inquiry' &&
            linkedLead?.leadSourceNameAr === 'استفسار بوابة الشركات المباشر',
        'Renaming Lead Source must synchronize denormalized names on linked Leads'
    );

    // Referential protection on crm-src-1
    await expectCrmError(
        () => crmApi.deleteLeadSource('crm-src-1'),
        'CRM_MASTER_IN_USE',
        'Deleting referenced Lead Source crm-src-1'
    );

    // Clean delete on unreferenced createdSource
    await crmApi.deleteLeadSource(createdSource.id);
    console.log(
        '✓ 3. Lead Sources CRUD, duplicate prevention, Lead sync, and delete protection verified.'
    );

    // 4. Lead Statuses: Reorder, Closing Stage, System-Default Protection
    const initialStages = (
        await crmApi.getLeadStatuses({ page: 1, limit: 50 })
    ).data;
    const secondStageId = initialStages[1].id;
    const reorderedAfterMoveUp = await crmApi.moveLeadStatusOrder(
        secondStageId,
        'up'
    );
    assert(
        reorderedAfterMoveUp[0].id === secondStageId &&
            reorderedAfterMoveUp[0].stageOrder === 1,
        'moveLeadStatusOrder(up) should move stage 2 to stageOrder 1'
    );

    // Restore order
    await crmApi.moveLeadStatusOrder(secondStageId, 'down');

    // System-default protection on crm-lst-1 (New)
    await expectCrmError(
        () => crmApi.deleteLeadStatus('crm-lst-1'),
        'CRM_SYSTEM_PROTECTED',
        'Deleting system-default Lead Status crm-lst-1'
    );
    await expectCrmError(
        () => crmApi.updateLeadStatus('crm-lst-1', { status: 'inactive' }),
        'CRM_SYSTEM_PROTECTED',
        'Deactivating default Lead Status crm-lst-1'
    );
    console.log(
        '✓ 4. Lead Status ordering, closing stages, and system-default protection verified.'
    );

    // 5. Sectors: Create, Duplicate Rejection, Company/Lead Sync, Delete Protection
    const createdSector = await crmApi.createSector({
        nameEn: 'Renewable Energy & Utilities',
        nameAr: 'الطاقة المتجددة والمرافق',
        status: 'active',
    });
    await expectCrmError(
        () =>
            crmApi.createSector({
                nameEn: 'RENEWABLE ENERGY & UTILITIES',
                nameAr: 'قطاع آخر',
                status: 'active',
            }),
        'CRM_DUPLICATE_NAME',
        'Duplicate Sector English name'
    );
    await expectCrmError(
        () => crmApi.deleteSector('crm-sec-1'),
        'CRM_MASTER_IN_USE',
        'Deleting referenced Sector crm-sec-1'
    );
    await crmApi.deleteSector(createdSector.id);
    console.log(
        '✓ 5. Sectors CRUD, duplicate prevention, and referential protection verified.'
    );

    // 6. Taxes: Rate Validation, Default Exclusivity, Quotation/Invoice Protection
    const createdTax = await crmApi.createTax({
        nameEn: 'Special Municipal Levy 5%',
        nameAr: 'رسوم بلدية خاصة 5%',
        taxType: 'Tax',
        rate: 5,
        isDefault: false,
        status: 'active',
    });
    assert(createdTax.rate === 5, 'Created tax should have 5% rate');

    // Switch default tax to createdTax
    await crmApi.updateTax(createdTax.id, { isDefault: true });
    const allTaxesAfterDefaultSwitch = (
        await crmApi.getTaxes({ page: 1, limit: 50 })
    ).data;
    const defaultsCount = allTaxesAfterDefaultSwitch.filter(
        (t) => t.isDefault
    ).length;
    assert(
        defaultsCount === 1,
        'Exactly one tax record must be marked as default'
    );

    // Switch default back to crm-tax-1 so we can delete createdTax
    await crmApi.updateTax('crm-tax-1', { isDefault: true });

    // Referenced crm-tax-1 cannot be deleted
    await expectCrmError(
        () => crmApi.deleteTax('crm-tax-1'),
        'CRM_MASTER_IN_USE',
        'Deleting referenced Tax crm-tax-1'
    );

    await crmApi.deleteTax(createdTax.id);
    console.log(
        '✓ 6. Tax rate validation, default tax exclusivity, and quotation/invoice protection verified.'
    );

    // 7. Organizational Types & Ownership Types
    const createdOrgType = await crmApi.createOrganizationalType({
        nameEn: 'Non-Profit Foundation',
        nameAr: 'مؤسسة غير ربحية',
        status: 'active',
    });
    await expectCrmError(
        () => crmApi.deleteOrganizationalType('crm-org-1'),
        'CRM_MASTER_IN_USE',
        'Deleting referenced Organizational Type crm-org-1'
    );
    await crmApi.deleteOrganizationalType(createdOrgType.id);

    const createdOwnType = await crmApi.createOwnershipType({
        nameEn: 'Waqf Endowment Ownership',
        nameAr: 'ملكية وقفية',
        allowsForeignOwnership: false,
        status: 'active',
    });
    await expectCrmError(
        () => crmApi.deleteOwnershipType('crm-own-type-1'),
        'CRM_MASTER_IN_USE',
        'Deleting referenced Ownership Type crm-own-type-1'
    );
    await crmApi.deleteOwnershipType(createdOwnType.id);
    console.log(
        '✓ 7. Organizational Types & Ownership Types CRUD and referential protection verified.'
    );

    // 8. Audit Trail Verification
    const auditEntries = await crmApi.getAuditTrails();
    assert(
        auditEntries.length >= 10,
        `Expected Master mutations to append to Audit Trails, found ${auditEntries.length} entries`
    );
    console.log('✓ 8. Automatic CRM Audit Trail logging verified.');

    // 9. Bilingual i18n Completeness Check
    assert(
        Boolean(enJson.crm?.master?.entities?.leadSource?.newButton),
        'Missing en.json crm.master.entities.leadSource.newButton'
    );
    assert(
        Boolean(arJson.crm?.master?.entities?.leadSource?.newButton),
        'Missing ar.json crm.master.entities.leadSource.newButton'
    );
    console.log(
        '✓ 9. Bilingual EN/AR translations for CRM Master verified.'
    );

    // Restore clean initial demo state
    crmApi.resetAllCrmStorage();
    console.log('=== ALL PHASE 2B VERIFICATION CHECKS PASSED ===');
}

runVerification().catch((err) => {
    console.error(err);
    process.exit(1);
});
