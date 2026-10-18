/**
 * AWN Enterprise Platform — CRM ↔ Customer Portal Invoice Adapter
 *
 * Micro-Phase 2E.4: Explicit Demo-Only Company Identity Alignment & Read-Only Invoice Integration
 *
 * CRITICAL SAFETY & COMPLIANCE RULES:
 * 1. This adapter and its mapping are STRICTLY FOR FRONTEND DEMONSTRATION PURPOSES ONLY.
 * 2. This does NOT provide production-grade tenant isolation or backend-enforced authorization.
 * 3. CRM Company IDs ('crm-comp-*') and Customer Portal Company IDs ('cmp-*') are kept distinct.
 * 4. Company identity is NEVER inferred from name similarity, substrings, or email domains.
 *    In current seed data, crm-comp-1 (CR: 1010456789) and cmp-1 (CR: 1010482910) differ in legal identifiers.
 * 5. An explicit project assignment is established ONLY where designated for testing cross-module invoice integration.
 * 6. CRM companies without an explicit mapping (crm-comp-2, crm-comp-3) are strictly UNMAPPED.
 *    Their invoices are NEVER leaked or displayed under any customer company.
 * 7. CRM invoice records are NEVER copied, merged, or duplicated into 'awn_customer_invoices_v1'.
 */

import type { CrmInvoiceRecord, CrmInvoiceStatus } from '../../schemas/crmSchema';
import type { CustomerInvoiceItem, CustomerInvoiceStatus } from './CustomerInvoicesPage';
import { crmApi, CRM_STORAGE_KEYS } from '../../api/api';
import { getCustomerCompanyById } from './customerMockData';

export type InvoiceOriginSource = 'customer' | 'crm';

export interface DemoCompanyMappingEntry {
    crmCompanyId: string;
    customerCompanyId: string | null;
    status: 'mapped' | 'unmapped';
    crmCompanyNameEn: string;
    customerCompanyNameEn: string | null;
    reason: string;
}

/**
 * EXPLICIT DEMO-ONLY CRM ↔ CUSTOMER COMPANY MAPPING REGISTRY
 *
 * Maintained centrally and typed. All non-explicitly-assigned companies MUST have customerCompanyId: null.
 */
export const DEMO_COMPANY_MAPPINGS: Record<string, DemoCompanyMappingEntry> = {
    'crm-comp-1': {
        crmCompanyId: 'crm-comp-1',
        customerCompanyId: 'cmp-1',
        status: 'mapped',
        crmCompanyNameEn: 'Al-Wataniya Logistics Co.',
        customerCompanyNameEn: 'Al-Wataniya Logistics Co.',
        reason: 'Explicit demo-only project assignment for Micro-Phase 2E.4 cross-module invoice integration testing.',
    },
    'crm-comp-2': {
        crmCompanyId: 'crm-comp-2',
        customerCompanyId: null,
        status: 'unmapped',
        crmCompanyNameEn: 'Dar Al-Omran Contracting CJSC',
        customerCompanyNameEn: null,
        reason: 'Unmapped: Dar Al-Omran Contracting CJSC has no counterpart in canonical Customer Portal seed data.',
    },
    'crm-comp-3': {
        crmCompanyId: 'crm-comp-3',
        customerCompanyId: null,
        status: 'unmapped',
        crmCompanyNameEn: 'Afaq Digital Cloud Solutions',
        customerCompanyNameEn: null,
        reason: 'Unmapped: Afaq Digital Cloud Solutions has no counterpart in canonical Customer Portal seed data.',
    },
};

/**
 * Composite display model that wraps customer and CRM invoices without schema mutation.
 * Uses source-aware UI composite identity: `customer:${id}` or `crm:${id}` to guarantee zero ID collision.
 */
export interface UnifiedCustomerInvoiceItem extends CustomerInvoiceItem {
    source: InvoiceOriginSource;
    compositeId: string;
    isReadOnly: boolean;
    crmInvoiceType?: 'proforma' | 'final_tax';
    originalCrmInvoice?: CrmInvoiceRecord;
}

/**
 * Resolves the mapped Customer Portal company ID for a given CRM company ID.
 * Returns null if the company is unmapped.
 */
export function getMappedCustomerCompanyId(crmCompanyId: string): string | null {
    const entry = DEMO_COMPANY_MAPPINGS[crmCompanyId];
    return entry && entry.status === 'mapped' ? entry.customerCompanyId : null;
}

/**
 * Checks whether a CRM company has an active explicit mapping.
 */
export function isCrmCompanyMapped(crmCompanyId: string): boolean {
    return getMappedCustomerCompanyId(crmCompanyId) !== null;
}

/**
 * Returns the mapping registry entry for a CRM company.
 */
export function getMappingForCrmCompany(crmCompanyId: string): DemoCompanyMappingEntry | undefined {
    return DEMO_COMPANY_MAPPINGS[crmCompanyId];
}

/**
 * Normalizes CRM invoice status into Customer Portal invoice status.
 */
export function normalizeCrmInvoiceStatus(crmStatus: CrmInvoiceStatus): CustomerInvoiceStatus {
    switch (crmStatus) {
        case 'paid':
            return 'paid';
        case 'partially_paid':
            return 'partially_paid';
        case 'issued':
            return 'issued';
        case 'overdue':
            return 'overdue';
        case 'cancelled':
            return 'cancelled';
        case 'draft':
        default:
            return 'draft';
    }
}

/**
 * Adapts a single CRM invoice record into a read-only UnifiedCustomerInvoiceItem.
 * Ensures compositeId is prefixed with 'crm:' and isReadOnly is true.
 */
export function adaptCrmInvoiceToCustomerDisplay(
    crmInvoice: CrmInvoiceRecord,
    customerCompanyId: string
): UnifiedCustomerInvoiceItem {
    const canonicalCompany = getCustomerCompanyById(customerCompanyId);
    const companyNameEn = canonicalCompany ? canonicalCompany.nameEn : (crmInvoice.companyNameEn || '');
    const companyNameAr = canonicalCompany ? canonicalCompany.nameAr : (crmInvoice.companyNameAr || '');

    return {
        id: crmInvoice.id,
        compositeId: `crm:${crmInvoice.id}`,
        source: 'crm',
        isReadOnly: true,
        invoiceNumber: crmInvoice.invoiceNumber || crmInvoice.code,
        titleEn: crmInvoice.titleEn,
        titleAr: crmInvoice.titleAr || crmInvoice.titleEn,
        companyId: customerCompanyId,
        companyNameEn,
        companyNameAr,
        linkedContractId: crmInvoice.contractId,
        linkedContractNumber: crmInvoice.contractNumber || crmInvoice.contractCode,
        issueDate: crmInvoice.issueDate,
        dueDate: crmInvoice.dueDate,
        subtotal: crmInvoice.subtotal,
        discount: crmInvoice.discountTotal || crmInvoice.discountAmount || 0,
        taxAmount: crmInvoice.taxAmount || crmInvoice.vatAmount || 0,
        total: crmInvoice.totalAmount,
        paidAmount: crmInvoice.paidAmount,
        balanceDue: crmInvoice.balanceDue !== undefined ? crmInvoice.balanceDue : crmInvoice.remainingAmount,
        status: normalizeCrmInvoiceStatus(crmInvoice.invoiceStatus),
        notes: crmInvoice.notes,
        createdAt: crmInvoice.createdAt,
        crmInvoiceType: crmInvoice.invoiceType,
        originalCrmInvoice: crmInvoice,
    };
}

/**
 * Filters and adapts CRM invoices for display in the Customer Portal.
 * ONLY includes invoices whose CRM company has an explicit mapping.
 * Unmapped CRM invoices are safely and strictly excluded.
 */
export function filterAndAdaptCrmInvoices(
    crmInvoices: CrmInvoiceRecord[],
    targetCustomerCompanyId?: string
): UnifiedCustomerInvoiceItem[] {
    const results: UnifiedCustomerInvoiceItem[] = [];

    for (const inv of crmInvoices) {
        if (!inv.companyId) continue;
        const mappedCustomerId = getMappedCustomerCompanyId(inv.companyId);

        // If company is unmapped, strictly do not expose to customer portal
        if (!mappedCustomerId) continue;

        // If a specific customer company filter is active, ensure it matches
        if (targetCustomerCompanyId && targetCustomerCompanyId !== 'all' && mappedCustomerId !== targetCustomerCompanyId) {
            continue;
        }

        results.push(adaptCrmInvoiceToCustomerDisplay(inv, mappedCustomerId));
    }

    return results;
}

/**
 * Returns all CRM invoices that remain unmapped to any Customer Portal company.
 * Used for demo audit and verification checks.
 */
export function getUnmappedCrmInvoices(crmInvoices: CrmInvoiceRecord[]): CrmInvoiceRecord[] {
    return crmInvoices.filter((inv) => !isCrmCompanyMapped(inv.companyId));
}

/**
 * Asynchronously loads CRM invoices via crmApi and returns filtered/adapted items.
 * Does not mutate customer storage keys.
 */
export async function loadMappedCrmInvoices(
    targetCustomerCompanyId?: string
): Promise<UnifiedCustomerInvoiceItem[]> {
    try {
        const response = await crmApi.invoices.getAll();
        const records = response?.data || [];
        return filterAndAdaptCrmInvoices(records, targetCustomerCompanyId);
    } catch {
        // Fallback: inspect localStorage directly
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const raw = localStorage.getItem(CRM_STORAGE_KEYS.INVOICES);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        return filterAndAdaptCrmInvoices(parsed, targetCustomerCompanyId);
                    }
                }
            } catch {
                // ignore
            }
        }
        return [];
    }
}

/**
 * Synchronous client-side reader for initial state hydration from localStorage if available.
 */
export function loadMappedCrmInvoicesSync(
    targetCustomerCompanyId?: string
): UnifiedCustomerInvoiceItem[] {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const raw = localStorage.getItem(CRM_STORAGE_KEYS.INVOICES);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return filterAndAdaptCrmInvoices(parsed, targetCustomerCompanyId);
                }
            }
        } catch {
            // ignore
        }
    }
    return [];
}
