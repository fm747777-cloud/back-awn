/**
 * AWN Enterprise Platform — CRM ↔ Customer Portal Deal Adapter
 *
 * Micro-Phase 2F.2: Explicit Demo-Only Company Identity Alignment & Read-Only Deal Integration
 *
 * CRITICAL SAFETY & COMPLIANCE RULES:
 * 1. This adapter and its mapping are STRICTLY FOR FRONTEND DEMONSTRATION PURPOSES ONLY.
 * 2. This does NOT provide production-grade tenant isolation or backend-enforced authorization.
 * 3. CRM Company IDs ('crm-comp-*') and Customer Portal Company IDs ('cmp-*') are kept distinct.
 * 4. Company identity is NEVER inferred from name similarity, substrings, or email domains.
 * 5. An explicit project assignment is established ONLY where designated for testing cross-module deal integration.
 * 6. CRM companies without an explicit mapping (crm-comp-2, crm-comp-3) are strictly UNMAPPED.
 *    Their deals are NEVER leaked or displayed under any customer company.
 * 7. CRM deal records are NEVER copied, merged, or duplicated into 'awn_customer_deals_v1'.
 * 8. All projected records are read-only (`isReadOnly: true`) and cannot mutate source records.
 */

import type { CrmDealRecord, CrmDealStage } from '../../schemas/crmSchema';
import type { CustomerDealItem, CustomerDealStage, CustomerDealStatus } from './CustomerDealsPage';
import { crmApi, CRM_STORAGE_KEYS } from '../../api/api';
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

export type DealOriginSource = 'customer' | 'crm';

/**
 * Composite display model that wraps customer and CRM deals without schema mutation.
 * Uses source-aware UI composite identity: `customer:${id}` or `crm:${id}` to guarantee zero ID collision.
 */
export interface UnifiedCustomerDealItem extends CustomerDealItem {
    source: DealOriginSource;
    compositeId: string;
    isReadOnly: boolean;
    originalCrmDeal?: CrmDealRecord;
}

/**
 * Maps CRM Deal stage into Customer Portal Deal stage explicitly.
 *
 * CRM stages:
 * - 'new', 'qualified' -> 'discovery'
 * - 'proposal'         -> 'proposal'
 * - 'negotiation'      -> 'negotiation'
 * - 'won'              -> 'closed_won'
 * - 'lost'             -> 'closed_lost'
 */
export function normalizeCrmDealStage(crmStage: CrmDealStage): CustomerDealStage {
    switch (crmStage) {
        case 'new':
        case 'qualified':
            return 'discovery';
        case 'proposal':
            return 'proposal';
        case 'negotiation':
            return 'negotiation';
        case 'won':
            return 'closed_won';
        case 'lost':
            return 'closed_lost';
        default:
            return 'discovery';
    }
}

/**
 * Maps CRM Deal stage into Customer Portal Deal status explicitly.
 *
 * CRM stages:
 * - 'won'              -> 'won'
 * - 'lost'             -> 'lost'
 * - 'new', 'qualified', 'proposal', 'negotiation' -> 'open'
 */
export function normalizeCrmDealStatus(crmStage: CrmDealStage): CustomerDealStatus {
    switch (crmStage) {
        case 'won':
            return 'won';
        case 'lost':
            return 'lost';
        case 'new':
        case 'qualified':
        case 'proposal':
        case 'negotiation':
        default:
            return 'open';
    }
}

/**
 * Adapts a single CRM deal record into a read-only UnifiedCustomerDealItem.
 * Ensures compositeId is prefixed with 'crm:' and isReadOnly is true.
 * Does not mutate the source crmDeal object.
 */
export function adaptCrmDealToCustomerDisplay(
    crmDeal: CrmDealRecord,
    customerCompanyId: string
): UnifiedCustomerDealItem {
    const canonicalCompany = getCustomerCompanyById(customerCompanyId);
    const companyNameEn = canonicalCompany ? canonicalCompany.nameEn : (crmDeal.companyNameEn || '');
    const companyNameAr = canonicalCompany ? canonicalCompany.nameAr : (crmDeal.companyNameAr || '');

    return {
        id: crmDeal.id,
        compositeId: `crm:${crmDeal.id}`,
        source: 'crm',
        isReadOnly: true,
        code: crmDeal.code,
        nameEn: crmDeal.titleEn,
        nameAr: crmDeal.titleAr || crmDeal.titleEn,
        companyId: customerCompanyId,
        companyNameEn,
        companyNameAr,
        value: Number(crmDeal.amount || crmDeal.expectedValue || 0),
        stage: normalizeCrmDealStage(crmDeal.stage),
        status: normalizeCrmDealStatus(crmDeal.stage),
        expectedCloseDate: crmDeal.expectedCloseDate,
        probability: crmDeal.probability !== undefined ? crmDeal.probability : 50,
        notes: crmDeal.notes,
        createdAt: crmDeal.createdAt,
        originalCrmDeal: { ...crmDeal },
    };
}

/**
 * Filters and adapts CRM deals for display in the Customer Portal.
 * ONLY includes deals whose CRM company has an explicit mapping.
 * Unmapped CRM deals are safely and strictly excluded.
 */
export function filterAndAdaptCrmDeals(
    crmDeals: CrmDealRecord[],
    targetCustomerCompanyId?: string
): UnifiedCustomerDealItem[] {
    const results: UnifiedCustomerDealItem[] = [];

    for (const deal of crmDeals) {
        if (!deal.companyId) continue;
        const mappedCustomerId = getMappedCustomerCompanyId(deal.companyId);

        // If company is unmapped, strictly do not expose to customer portal
        if (!mappedCustomerId) continue;

        // If a specific customer company filter is active, ensure it matches
        if (targetCustomerCompanyId && targetCustomerCompanyId !== 'all' && mappedCustomerId !== targetCustomerCompanyId) {
            continue;
        }

        results.push(adaptCrmDealToCustomerDisplay(deal, mappedCustomerId));
    }

    return results;
}

/**
 * Returns all CRM deals that remain unmapped to any Customer Portal company.
 * Used for demo audit and verification checks.
 */
export function getUnmappedCrmDeals(crmDeals: CrmDealRecord[]): CrmDealRecord[] {
    return crmDeals.filter((deal) => !isCrmCompanyMapped(deal.companyId));
}

/**
 * Asynchronously loads CRM deals via crmApi and returns filtered/adapted items.
 * Does not mutate customer storage keys.
 */
export async function loadMappedCrmDeals(
    targetCustomerCompanyId?: string
): Promise<UnifiedCustomerDealItem[]> {
    try {
        const response = await crmApi.deals.getAll();
        const records = response?.data || [];
        return filterAndAdaptCrmDeals(records, targetCustomerCompanyId);
    } catch {
        // Fallback: inspect localStorage directly
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const raw = localStorage.getItem(CRM_STORAGE_KEYS.DEALS);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        return filterAndAdaptCrmDeals(parsed, targetCustomerCompanyId);
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
export function loadMappedCrmDealsSync(
    targetCustomerCompanyId?: string
): UnifiedCustomerDealItem[] {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const raw = localStorage.getItem(CRM_STORAGE_KEYS.DEALS);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return filterAndAdaptCrmDeals(parsed, targetCustomerCompanyId);
                }
            }
        } catch {
            // ignore
        }
    }
    return [];
}
