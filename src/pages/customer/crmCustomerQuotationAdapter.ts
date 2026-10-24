/**
 * AWN Enterprise Platform — CRM ↔ Customer Portal Quotation Adapter
 *
 * Micro-Phase 2G.1: Explicit Demo-Only Company Identity Alignment & Read-Only Quotation Integration
 *
 * CRITICAL SAFETY & COMPLIANCE RULES:
 * 1. This adapter and its mapping are STRICTLY FOR FRONTEND DEMONSTRATION PURPOSES ONLY.
 * 2. This does NOT provide production-grade tenant isolation or backend-enforced authorization.
 * 3. CRM Company IDs ('crm-comp-*') and Customer Portal Company IDs ('cmp-*') are kept distinct.
 * 4. Company identity is NEVER inferred from name similarity, substrings, or email domains.
 * 5. An explicit project assignment is established ONLY where designated for testing cross-module quotation integration.
 * 6. CRM companies without an explicit mapping (crm-comp-2, crm-comp-3) are strictly UNMAPPED.
 *    Their quotations are NEVER leaked or displayed under any customer company.
 * 7. CRM quotation records are NEVER copied, merged, or duplicated into 'awn_customer_quotations_v1'.
 * 8. All projected records are read-only (`isReadOnly: true`) and cannot mutate source records.
 */

import type { CrmQuotationRecord, CrmQuotationStatus, CrmQuotationLineItem } from '../../schemas/crmSchema';
import type { CustomerQuotationItem, CustomerQuotationStatus } from './CustomerQuotationsPage';
import { crmApi } from '../../api/api';
import { getCustomerCompanyById } from './customerMockData';
import {
    DEMO_COMPANY_MAPPINGS,
    getMappedCustomerCompanyId,
    isCrmCompanyMapped,
    getMappingForCrmCompany,
    type DemoCompanyMappingEntry,
} from './crmCustomerInvoiceAdapter';

export {
    DEMO_COMPANY_MAPPINGS,
    getMappedCustomerCompanyId,
    isCrmCompanyMapped,
    getMappingForCrmCompany,
    type DemoCompanyMappingEntry,
};

export type QuotationOriginSource = 'customer' | 'crm';

/**
 * Composite display model that wraps customer and CRM quotations without schema mutation.
 * Uses source-aware UI composite identity: `customer:${id}` or `crm:${id}` to guarantee zero ID collision.
 */
export interface UnifiedCustomerQuotationItem extends CustomerQuotationItem {
    source: QuotationOriginSource;
    compositeId: string;
    isReadOnly: boolean;
    currency?: string;
    lineItems?: CrmQuotationLineItem[];
    termsAndConditions?: string;
    originalCrmQuotation?: CrmQuotationRecord;
    originalCrmStatus?: CrmQuotationStatus;
}

/**
 * Maps CRM Quotation status into Customer Portal Quotation status explicitly.
 *
 * CRM statuses:
 * - 'draft'              -> 'draft'
 * - 'sent'               -> 'sent'
 * - 'accepted'           -> 'accepted'
 * - 'approved'           -> 'accepted'
 * - 'rejected'           -> 'rejected'
 * - 'expired'            -> 'expired'
 */
export function normalizeCrmQuotationStatus(crmStatus: CrmQuotationStatus): CustomerQuotationStatus {
    switch (crmStatus) {
        case 'accepted':
        case 'approved':
            return 'accepted';
        case 'sent':
            return 'sent';
        case 'rejected':
            return 'rejected';
        case 'expired':
            return 'expired';
        case 'draft':
        default:
            return 'draft';
    }
}

/**
 * Adapts a single CRM quotation record into a read-only UnifiedCustomerQuotationItem.
 * Ensures compositeId is prefixed with 'crm:' and isReadOnly is true.
 * Does not mutate the source crmQuotation object.
 */
export function adaptCrmQuotationToCustomerDisplay(
    crmQuotation: CrmQuotationRecord,
    customerCompanyId: string
): UnifiedCustomerQuotationItem {
    const canonicalCompany = getCustomerCompanyById(customerCompanyId);
    const companyNameEn = canonicalCompany ? canonicalCompany.nameEn : (crmQuotation.companyNameEn || '');
    const companyNameAr = canonicalCompany ? canonicalCompany.nameAr : (crmQuotation.companyNameAr || '');

    const subtotal = Number(crmQuotation.subtotal || 0);
    const discount = Number(crmQuotation.discountTotal ?? crmQuotation.totalDiscount ?? 0);
    const taxAmount = Number(crmQuotation.taxAmount ?? crmQuotation.totalTax ?? crmQuotation.totalVat ?? 0);
    const total = Number(crmQuotation.grandTotal || 0);

    return {
        id: crmQuotation.id,
        compositeId: `crm:${crmQuotation.id}`,
        source: 'crm',
        isReadOnly: true,
        quotationNumber: crmQuotation.code,
        titleEn: crmQuotation.titleEn,
        titleAr: crmQuotation.titleAr || crmQuotation.titleEn,
        companyId: customerCompanyId,
        companyNameEn,
        companyNameAr,
        issueDate: crmQuotation.issueDate,
        expiryDate: crmQuotation.validUntil,
        subtotal,
        discount,
        taxAmount,
        total,
        status: normalizeCrmQuotationStatus(crmQuotation.quotationStatus),
        notes: crmQuotation.notes,
        createdAt: crmQuotation.createdAt,
        currency: crmQuotation.currency || 'SAR',
        lineItems: crmQuotation.lineItems ? [...crmQuotation.lineItems] : undefined,
        termsAndConditions: crmQuotation.termsAndConditions,
        originalCrmQuotation: { ...crmQuotation },
        originalCrmStatus: crmQuotation.quotationStatus,
    };
}

/**
 * Filters and adapts CRM quotations for display in the Customer Portal.
 * ONLY includes quotations whose CRM company has an explicit mapping.
 * Unmapped CRM quotations are safely and strictly excluded.
 */
export function filterAndAdaptCrmQuotations(
    crmQuotations: CrmQuotationRecord[],
    targetCustomerCompanyId?: string
): UnifiedCustomerQuotationItem[] {
    const results: UnifiedCustomerQuotationItem[] = [];

    for (const q of crmQuotations) {
        if (!q.companyId) continue;
        const mappedCustomerId = getMappedCustomerCompanyId(q.companyId);

        // If company is unmapped, strictly do not expose to customer portal
        if (!mappedCustomerId) continue;

        // If a specific customer company filter is active, ensure it matches
        if (targetCustomerCompanyId && targetCustomerCompanyId !== 'all' && mappedCustomerId !== targetCustomerCompanyId) {
            continue;
        }

        results.push(adaptCrmQuotationToCustomerDisplay(q, mappedCustomerId));
    }

    return results;
}

/**
 * Returns all CRM quotations that remain unmapped to any Customer Portal company.
 * Used for demo audit and verification checks.
 */
export function getUnmappedCrmQuotations(crmQuotations: CrmQuotationRecord[]): CrmQuotationRecord[] {
    return crmQuotations.filter((q) => !isCrmCompanyMapped(q.companyId));
}

/**
 * Asynchronously loads CRM quotations via crmApi and returns filtered/adapted items.
 * Does not mutate customer storage keys.
 */
export async function loadMappedCrmQuotations(
    targetCustomerCompanyId?: string
): Promise<UnifiedCustomerQuotationItem[]> {
    try {
        const response = await crmApi.quotations.getAll();
        const records = response?.data || [];
        return filterAndAdaptCrmQuotations(records, targetCustomerCompanyId);
    } catch {
        return [];
    }
}

/**
 * Synchronous client-side reader for initial state hydration.
 */
export function loadMappedCrmQuotationsSync(
    _targetCustomerCompanyId?: string
): UnifiedCustomerQuotationItem[] {
    return [];
}
