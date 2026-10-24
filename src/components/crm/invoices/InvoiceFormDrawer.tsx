import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import {
    crmInvoiceInputSchema,
    calculateCrmInvoiceAmounts,
    calculateCrmQuotationLineItem,
    roundCrmCurrency,
    type CrmInvoiceInput,
    type CrmInvoiceRecord,
    type CrmCompanyRecord,
    type CrmDealRecord,
    type CrmQuotationRecord,
    type CrmContractRecord,
    type CrmQuotationLineItem,
    type CrmTaxRecord,
    type CrmContactRecord,
} from '../../../schemas/crmSchema';
import {
    crmApi,
    type CrmSalesEmployee,
    type CrmServiceCatalogItem,
} from '../../../api/api';

export interface InvoiceFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmInvoiceRecord | null;
    companies: CrmCompanyRecord[];
    deals: CrmDealRecord[];
    quotations: CrmQuotationRecord[];
    contracts: CrmContractRecord[];
    employees: CrmSalesEmployee[];
    catalogItems?: CrmServiceCatalogItem[];
    taxes?: CrmTaxRecord[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmInvoiceInput) => Promise<void> | void;
}

interface PartyDetailsState {
    businessName: string;
    crNumber: string;
    vatNumber: string;
    building: string;
    street: string;
    district: string;
    city: string;
    representative: string;
    pinCode: string;
    province: string;
    phone: string;
    email: string;
}

const createInitialPartyDetails = (): PartyDetailsState => ({
    businessName: '',
    crNumber: '',
    vatNumber: '',
    building: '',
    street: '',
    district: '',
    city: '',
    representative: '',
    pinCode: '',
    province: '',
    phone: '',
    email: '',
});

const DEFAULT_INVOICE_DATE_ISO = '2026-10-24';

export const InvoiceFormDrawer: React.FC<InvoiceFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    companies,
    deals: _deals,
    quotations,
    contracts,
    employees,
    catalogItems: _catalogItems = [],
    taxes = [],
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    void _deals;
    void _catalogItems;

    const defaultCompany =
        companies.find((c) => c.status === 'active') || companies[0];
    const defaultEmployeeId = employees[0]?.id || 'emp-1';

    const [loadedTaxes, setLoadedTaxes] = useState<CrmTaxRecord[]>(taxes);
    const [loadedContacts, setLoadedContacts] = useState<CrmContactRecord[]>(
        []
    );

    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;

        if (taxes && taxes.length > 0) {
            setLoadedTaxes(taxes);
        } else {
            crmApi
                .getTaxes({ limit: 100 })
                .then((res) => {
                    if (isMounted && res?.data && res.data.length > 0) {
                        setLoadedTaxes(res.data);
                    }
                })
                .catch(() => {});
        }

        crmApi.contacts
            .getAll({ limit: 200 })
            .then((res) => {
                if (isMounted && res?.data) {
                    setLoadedContacts(res.data);
                }
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, [isOpen, taxes]);

    const taxOptions = useMemo(() => {
        const activeTaxes = loadedTaxes.filter((t) => t.status === 'active');
        const list: Array<{ id?: string; label: string; rate: number }> = [
            {
                id: activeTaxes.find((t) => t.rate === 15)?.id,
                label: 'VAT 15%',
                rate: 15,
            },
        ];
        for (const tax of activeTaxes) {
            if (!list.some((existing) => existing.rate === tax.rate)) {
                list.push({
                    id: tax.id,
                    label: `${tax.nameEn} (${tax.rate}%)`,
                    rate: tax.rate,
                });
            }
        }
        if (!list.some((existing) => existing.rate === 0)) {
            list.push({
                id: activeTaxes.find((t) => t.rate === 0)?.id,
                label: 'VAT 0%',
                rate: 0,
            });
        }
        return list;
    }, [loadedTaxes]);

    // 1. Invoice Details
    const [contractId, setContractId] = useState<string>('');
    const [quotationId, setQuotationId] = useState<string>('');
    const [invoiceDate, setInvoiceDate] = useState<string>(
        DEFAULT_INVOICE_DATE_ISO
    );

    // 2. Customer Details
    const [customerName, setCustomerName] = useState<string>('');
    const [customerEmail, setCustomerEmail] = useState<string>('');
    const [customerPhone, setCustomerPhone] = useState<string>('');

    // 3. Subscription Details
    const [lineItems, setLineItems] = useState<CrmQuotationLineItem[]>([]);

    // 4. Additional Details
    const [discountAppliedInput, setDiscountAppliedInput] =
        useState<string>('0');
    const [discountAmountInput, setDiscountAmountInput] =
        useState<string>('0.00');
    const [taxAppliedRate, setTaxAppliedRate] = useState<number>(15);

    // 5. Party Details
    const [partyDetails, setPartyDetails] = useState<PartyDetailsState>(() =>
        createInitialPartyDetails()
    );

    // Internal record links
    const [companyId, setCompanyId] = useState<string>(
        defaultCompany?.id || ''
    );
    const [dealId, setDealId] = useState<string>('');
    const [contactId, setContactId] = useState<string>('');
    const [assignedEmployeeId, setAssignedEmployeeId] =
        useState<string>(defaultEmployeeId);

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (key: string) => {
        if (fieldErrors[key]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const populatePartyAndCustomerFromRecord = (params: {
        contract?: CrmContractRecord;
        quotation?: CrmQuotationRecord;
        company?: CrmCompanyRecord;
        contact?: CrmContactRecord;
    }) => {
        const { contract, quotation, company, contact } = params;

        const resolvedCustomerName =
            quotation?.customerName ||
            contract?.contactName ||
            quotation?.contactName ||
            contact?.fullNameEn ||
            company?.representativeName ||
            company?.nameEn ||
            contract?.companyNameEn ||
            quotation?.companyNameEn ||
            '';

        const resolvedCustomerEmail =
            quotation?.customerEmail ||
            contact?.email ||
            company?.email ||
            '';

        const resolvedCustomerPhone =
            quotation?.customerPhone ||
            contact?.phone ||
            company?.phone ||
            '';

        setCustomerName(resolvedCustomerName);
        setCustomerEmail(resolvedCustomerEmail);
        setCustomerPhone(resolvedCustomerPhone);

        setPartyDetails({
            businessName:
                company?.businessName ||
                company?.nameEn ||
                contract?.companyNameEn ||
                quotation?.companyNameEn ||
                '',
            crNumber: company?.crNumber || '',
            vatNumber: company?.taxNumber || '',
            building: company?.buildingNumber || '',
            street: company?.street || company?.address || '',
            district: company?.district || '',
            city: company?.city || '',
            representative:
                company?.representativeName ||
                contract?.contactName ||
                quotation?.contactName ||
                contact?.fullNameEn ||
                resolvedCustomerName,
            pinCode: company?.postalCode || company?.pinCode || '',
            province: company?.province || company?.state || '',
            phone:
                company?.phone ||
                contact?.phone ||
                resolvedCustomerPhone ||
                '',
            email:
                company?.email ||
                contact?.email ||
                resolvedCustomerEmail ||
                '',
        });
    };

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${defaultCompany?.id ?? ''}-${loadedContacts.length}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setFieldErrors({});
            if (mode === 'edit' && initialData) {
                const matchedContract = initialData.contractId
                    ? contracts.find((c) => c.id === initialData.contractId)
                    : undefined;
                const matchedQuotation = initialData.quotationId
                    ? quotations.find((q) => q.id === initialData.quotationId)
                    : matchedContract?.quotationId
                      ? quotations.find(
                            (q) => q.id === matchedContract.quotationId
                        )
                      : undefined;
                const matchedCompany = companies.find(
                    (c) => c.id === initialData.companyId
                );
                const matchedContact =
                    (initialData.contactId
                        ? loadedContacts.find(
                              (c) => c.id === initialData.contactId
                          )
                        : undefined) ||
                    loadedContacts.find(
                        (c) =>
                            c.companyId === initialData.companyId && c.isPrimary
                    ) ||
                    loadedContacts.find(
                        (c) => c.companyId === initialData.companyId
                    );

                setContractId(
                    initialData.contractId || matchedContract?.id || ''
                );
                setQuotationId(
                    initialData.quotationId || matchedQuotation?.id || ''
                );
                setInvoiceDate(
                    initialData.issueDate || DEFAULT_INVOICE_DATE_ISO
                );
                setCompanyId(initialData.companyId);
                setDealId(initialData.dealId || '');
                setContactId(initialData.contactId || '');
                setAssignedEmployeeId(
                    initialData.assignedEmployeeId || defaultEmployeeId
                );

                const loadedItems =
                    initialData.lineItems && initialData.lineItems.length > 0
                        ? initialData.lineItems
                        : [
                              calculateCrmQuotationLineItem({
                                  id: `inv-li-${initialData.id || '1'}`,
                                  itemType: 'custom',
                                  descriptionEn: initialData.titleEn,
                                  descriptionAr:
                                      initialData.titleAr || undefined,
                                  quantity: 1,
                                  unitPrice: initialData.subtotal,
                                  discountAmount: initialData.discountTotal,
                                  discountPercent:
                                      initialData.subtotal > 0
                                          ? (initialData.discountTotal /
                                                initialData.subtotal) *
                                            100
                                          : 0,
                                  taxRate: initialData.taxRate ?? 15,
                              }),
                          ];

                setLineItems(loadedItems);

                const sub = roundCrmCurrency(initialData.subtotal || 0);
                const discAmt = roundCrmCurrency(
                    initialData.discountTotal ?? initialData.discountAmount ?? 0
                );
                const discPct =
                    sub > 0 ? roundCrmCurrency((discAmt / sub) * 100) : 0;

                setDiscountAppliedInput(String(discPct));
                setDiscountAmountInput(discAmt.toFixed(2));
                setTaxAppliedRate(initialData.taxRate ?? 15);

                populatePartyAndCustomerFromRecord({
                    contract: matchedContract,
                    quotation: matchedQuotation,
                    company: matchedCompany,
                    contact: matchedContact,
                });
            } else {
                setContractId('');
                setQuotationId('');
                setInvoiceDate(DEFAULT_INVOICE_DATE_ISO);
                setCustomerName('');
                setCustomerEmail('');
                setCustomerPhone('');
                setLineItems([]);
                setDiscountAppliedInput('0');
                setDiscountAmountInput('0.00');
                setTaxAppliedRate(15);
                setPartyDetails(createInitialPartyDetails());
                setCompanyId(defaultCompany?.id || '');
                setDealId('');
                setContactId('');
                setAssignedEmployeeId(defaultEmployeeId);
            }
        }
    }

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Subtotal (Without VAT) from Subscription Details line items
    const subtotalWithoutVat = useMemo(() => {
        if (lineItems.length === 0) return 0;
        return roundCrmCurrency(
            lineItems.reduce((sum, item) => {
                const periodFactor =
                    item.periodUnit === 'one_time'
                        ? 1
                        : Math.max(1, Number(item.period ?? 1));
                return sum + item.unitPrice * item.quantity * periodFactor;
            }, 0)
        );
    }, [lineItems]);

    const discountAmount = useMemo(() => {
        const parsed = Number(discountAmountInput);
        if (!Number.isFinite(parsed) || parsed < 0) return 0;
        if (subtotalWithoutVat > 0) {
            return roundCrmCurrency(Math.min(subtotalWithoutVat, parsed));
        }
        return roundCrmCurrency(parsed);
    }, [discountAmountInput, subtotalWithoutVat]);

    const discountRate = useMemo(() => {
        const parsed = Number(discountAppliedInput);
        if (!Number.isFinite(parsed) || parsed < 0) return 0;
        return Math.min(100, Math.max(0, parsed));
    }, [discountAppliedInput]);

    const netAfterDiscount = useMemo(() => {
        return roundCrmCurrency(
            Math.max(0, subtotalWithoutVat - discountAmount)
        );
    }, [subtotalWithoutVat, discountAmount]);

    const effectiveTaxRate = useMemo(() => {
        return Math.min(100, Math.max(0, Number(taxAppliedRate) || 0));
    }, [taxAppliedRate]);

    const vatAmount = useMemo(() => {
        return roundCrmCurrency(netAfterDiscount * (effectiveTaxRate / 100));
    }, [netAfterDiscount, effectiveTaxRate]);

    const totalAmountWithVat = useMemo(() => {
        return roundCrmCurrency(netAfterDiscount + vatAmount);
    }, [netAfterDiscount, vatAmount]);

    const formatAmount = (value: number): string =>
        value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const applySubscriptionItemsAndFinancials = (
        items: CrmQuotationLineItem[],
        rawSubtotal: number,
        rawDiscountTotal: number,
        rawTaxRate: number
    ) => {
        setLineItems(items);
        const sub = roundCrmCurrency(
            items.length > 0
                ? items.reduce((sum, item) => {
                      const periodFactor =
                          item.periodUnit === 'one_time'
                              ? 1
                              : Math.max(1, Number(item.period ?? 1));
                      return (
                          sum + item.unitPrice * item.quantity * periodFactor
                      );
                  }, 0)
                : rawSubtotal
        );
        const discAmt = roundCrmCurrency(
            Math.min(sub, Math.max(0, rawDiscountTotal))
        );
        const discPct =
            sub > 0 ? roundCrmCurrency((discAmt / sub) * 100) : 0;

        setDiscountAppliedInput(String(discPct));
        setDiscountAmountInput(discAmt.toFixed(2));
        setTaxAppliedRate(rawTaxRate);
    };

    const handleContractSelect = (nextContractId: string) => {
        setContractId(nextContractId);
        clearFieldError('contractId');

        if (!nextContractId) {
            return;
        }

        const contract = contracts.find((c) => c.id === nextContractId);
        if (!contract) return;

        const linkedQuotation = contract.quotationId
            ? quotations.find((q) => q.id === contract.quotationId)
            : quotations.find((q) => q.companyId === contract.companyId);

        if (linkedQuotation) {
            setQuotationId(linkedQuotation.id);
            clearFieldError('quotationId');
        }

        const targetCompanyId =
            contract.companyId ||
            linkedQuotation?.companyId ||
            defaultCompany?.id ||
            '';
        const company = companies.find((c) => c.id === targetCompanyId);
        const contact =
            (contract.contactId
                ? loadedContacts.find((c) => c.id === contract.contactId)
                : undefined) ||
            (linkedQuotation?.contactId
                ? loadedContacts.find((c) => c.id === linkedQuotation.contactId)
                : undefined) ||
            loadedContacts.find(
                (c) => c.companyId === targetCompanyId && c.isPrimary
            ) ||
            loadedContacts.find((c) => c.companyId === targetCompanyId);

        setCompanyId(targetCompanyId);
        setDealId(contract.dealId || linkedQuotation?.dealId || '');
        setContactId(
            contract.contactId ||
                linkedQuotation?.contactId ||
                contact?.id ||
                ''
        );
        setAssignedEmployeeId(
            contract.assignedEmployeeId ||
                linkedQuotation?.assignedEmployeeId ||
                defaultEmployeeId
        );

        const inheritedItems =
            linkedQuotation?.lineItems && linkedQuotation.lineItems.length > 0
                ? linkedQuotation.lineItems
                : [
                      calculateCrmQuotationLineItem({
                          id: `inv-li-contract-${contract.id}`,
                          itemType: 'custom',
                          descriptionEn: contract.titleEn,
                          descriptionAr: contract.titleAr || undefined,
                          quantity: 1,
                          unitPrice: contract.subtotal,
                          discountAmount: contract.discountTotal,
                          discountPercent:
                              contract.subtotal > 0
                                  ? (contract.discountTotal /
                                        contract.subtotal) *
                                    100
                                  : 0,
                          taxRate: contract.taxRate ?? 15,
                      }),
                  ];

        const resolvedTaxRate =
            contract.taxRate ??
            linkedQuotation?.taxRate ??
            inheritedItems[0]?.taxRate ??
            15;

        applySubscriptionItemsAndFinancials(
            inheritedItems,
            contract.subtotal,
            contract.discountTotal,
            resolvedTaxRate
        );

        populatePartyAndCustomerFromRecord({
            contract,
            quotation: linkedQuotation,
            company,
            contact,
        });

        setFieldErrors({});
    };

    const handleQuotationSelect = (nextQuotationId: string) => {
        setQuotationId(nextQuotationId);
        clearFieldError('quotationId');

        if (!nextQuotationId) {
            return;
        }

        const quotation = quotations.find((q) => q.id === nextQuotationId);
        if (!quotation) return;

        const linkedContract =
            contracts.find((c) => c.quotationId === quotation.id) ||
            contracts.find((c) => c.companyId === quotation.companyId);

        if (linkedContract && !contractId) {
            setContractId(linkedContract.id);
            clearFieldError('contractId');
        }

        const targetCompanyId =
            quotation.companyId ||
            linkedContract?.companyId ||
            defaultCompany?.id ||
            '';
        const company = companies.find((c) => c.id === targetCompanyId);
        const contact =
            (quotation.contactId
                ? loadedContacts.find((c) => c.id === quotation.contactId)
                : undefined) ||
            loadedContacts.find(
                (c) => c.companyId === targetCompanyId && c.isPrimary
            ) ||
            loadedContacts.find((c) => c.companyId === targetCompanyId);

        setCompanyId(targetCompanyId);
        setDealId(quotation.dealId || linkedContract?.dealId || '');
        setContactId(quotation.contactId || contact?.id || '');
        setAssignedEmployeeId(
            quotation.assignedEmployeeId ||
                linkedContract?.assignedEmployeeId ||
                defaultEmployeeId
        );

        const inheritedItems =
            quotation.lineItems && quotation.lineItems.length > 0
                ? quotation.lineItems
                : [
                      calculateCrmQuotationLineItem({
                          id: `inv-li-quot-${quotation.id}`,
                          itemType: 'custom',
                          descriptionEn: quotation.titleEn,
                          descriptionAr: quotation.titleAr || undefined,
                          quantity: 1,
                          unitPrice: quotation.subtotal,
                          discountAmount: quotation.discountTotal,
                          discountPercent:
                              quotation.subtotal > 0
                                  ? (quotation.discountTotal /
                                        quotation.subtotal) *
                                    100
                                  : 0,
                          taxRate: quotation.taxRate ?? 15,
                      }),
                  ];

        const resolvedTaxRate =
            quotation.taxRate ?? inheritedItems[0]?.taxRate ?? 15;

        applySubscriptionItemsAndFinancials(
            inheritedItems,
            quotation.subtotal,
            quotation.discountTotal,
            resolvedTaxRate
        );

        populatePartyAndCustomerFromRecord({
            contract:
                contracts.find((c) => c.id === contractId) || linkedContract,
            quotation,
            company,
            contact,
        });

        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.quotationId;
            delete next.customerName;
            delete next.customerEmail;
            delete next.customerPhone;
            Object.keys(next).forEach((k) => {
                if (k.startsWith('party.')) {
                    delete next[k];
                }
            });
            return next;
        });
    };

    const handleDiscountAppliedChange = (rawPercent: string) => {
        setDiscountAppliedInput(rawPercent);
        clearFieldError('discountApplied');
        clearFieldError('discountAmount');

        const pct = Math.min(100, Math.max(0, Number(rawPercent) || 0));
        const computedAmt = roundCrmCurrency(subtotalWithoutVat * (pct / 100));
        setDiscountAmountInput(computedAmt.toFixed(2));
    };

    const handleDiscountAmountChange = (rawAmount: string) => {
        setDiscountAmountInput(rawAmount);
        clearFieldError('discountAmount');
        clearFieldError('discountApplied');

        const amt = Math.max(0, Number(rawAmount) || 0);
        const cappedAmt =
            subtotalWithoutVat > 0 ? Math.min(subtotalWithoutVat, amt) : amt;
        const computedPct =
            subtotalWithoutVat > 0
                ? roundCrmCurrency((cappedAmt / subtotalWithoutVat) * 100)
                : 0;
        setDiscountAppliedInput(String(computedPct));
    };

    const handleLineItemChange = (
        index: number,
        patch: { unitPrice?: number; quantity?: number }
    ) => {
        setLineItems((prev) => {
            const next = [...prev];
            const current = next[index];
            if (!current) return prev;
            const updated = calculateCrmQuotationLineItem({
                ...current,
                unitPrice:
                    patch.unitPrice !== undefined
                        ? Math.max(0, patch.unitPrice)
                        : current.unitPrice,
                quantity:
                    patch.quantity !== undefined
                        ? Math.max(1, patch.quantity)
                        : current.quantity,
                discountPercent: discountRate,
                taxRate: effectiveTaxRate,
            });
            next[index] = updated;

            const nextSubtotal = roundCrmCurrency(
                next.reduce((sum, item) => {
                    const periodFactor =
                        item.periodUnit === 'one_time'
                            ? 1
                            : Math.max(1, Number(item.period ?? 1));
                    return sum + item.unitPrice * item.quantity * periodFactor;
                }, 0)
            );
            const nextDiscAmt = roundCrmCurrency(
                nextSubtotal * (discountRate / 100)
            );
            setDiscountAmountInput(nextDiscAmt.toFixed(2));
            return next;
        });
    };

    const handlePartyChange = <K extends keyof PartyDetailsState>(
        field: K,
        value: PartyDetailsState[K]
    ) => {
        setPartyDetails((prev) => ({ ...prev, [field]: value }));
        clearFieldError(`party.${field}`);
    };

    if (!isOpen) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isSubmitting) return;

        const errors: Record<string, string> = {};

        // 1. Invoice Details validation
        if (!contractId.trim()) {
            errors.contractId = 'Contract ID is required';
        }
        if (!quotationId.trim()) {
            errors.quotationId = 'Quotation ID is required';
        }
        if (!invoiceDate.trim()) {
            errors.invoiceDate = 'Invoice Date is required';
        }

        // 2. Customer Details validation
        if (!customerName.trim()) {
            errors.customerName = 'Customer Name is required';
        }
        if (!customerEmail.trim()) {
            errors.customerEmail = 'Customer Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
            errors.customerEmail = 'Valid Customer Email is required';
        }
        if (!customerPhone.trim()) {
            errors.customerPhone = 'Customer Phone is required';
        }

        // 4. Additional Details validation
        if (
            discountAppliedInput.trim() === '' ||
            Number(discountAppliedInput) < 0
        ) {
            errors.discountApplied = 'Discount Applied is required';
        }
        if (
            discountAmountInput.trim() === '' ||
            Number(discountAmountInput) < 0
        ) {
            errors.discountAmount = 'Discount Amount is required';
        }

        // 5. Party Details validation
        if (!partyDetails.businessName.trim()) {
            errors['party.businessName'] = 'Business Name is required';
        }
        if (!partyDetails.crNumber.trim()) {
            errors['party.crNumber'] = 'CR Number is required';
        }
        if (!partyDetails.vatNumber.trim()) {
            errors['party.vatNumber'] = 'VAT Number is required';
        }
        if (!partyDetails.building.trim()) {
            errors['party.building'] = 'Building is required';
        }
        if (!partyDetails.street.trim()) {
            errors['party.street'] = 'Street is required';
        }
        if (!partyDetails.district.trim()) {
            errors['party.district'] = 'District is required';
        }
        if (!partyDetails.city.trim()) {
            errors['party.city'] = 'City is required';
        }
        if (!partyDetails.representative.trim()) {
            errors['party.representative'] = 'Representative is required';
        }
        if (!partyDetails.pinCode.trim()) {
            errors['party.pinCode'] = 'Pin Code is required';
        }
        if (!partyDetails.province.trim()) {
            errors['party.province'] = 'Province is required';
        }
        if (!partyDetails.phone.trim()) {
            errors['party.phone'] = 'Phone is required';
        }
        if (!partyDetails.email.trim()) {
            errors['party.email'] = 'Email is required';
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partyDetails.email.trim())
        ) {
            errors['party.email'] = 'Valid Email is required';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const selectedContract = contracts.find((c) => c.id === contractId);
        const selectedQuotation = quotations.find((q) => q.id === quotationId);

        const resolvedCompanyId =
            (selectedContract?.contractStatus === 'active'
                ? selectedContract.companyId
                : undefined) ||
            selectedQuotation?.companyId ||
            selectedContract?.companyId ||
            companyId ||
            defaultCompany?.id ||
            'crm-comp-1';

        const dueDateObj = new Date(invoiceDate);
        if (!Number.isNaN(dueDateObj.getTime())) {
            dueDateObj.setDate(dueDateObj.getDate() + 30);
        }
        const computedDueDate = !Number.isNaN(dueDateObj.getTime())
            ? dueDateObj.toISOString().split('T')[0]
            : invoiceDate;

        const matchedTax = taxOptions.find(
            (tx) => tx.rate === effectiveTaxRate
        );

        const synchronizedLineItems =
            lineItems.length > 0
                ? lineItems.map((item, idx) =>
                      calculateCrmQuotationLineItem({
                          ...item,
                          id: item.id || `inv-li-${idx + 1}`,
                          discountType: 'percentage',
                          discountPercent: discountRate,
                          taxId: matchedTax?.id || item.taxId,
                          taxRate: effectiveTaxRate,
                      })
                  )
                : undefined;

        const paidAmt =
            mode === 'edit' && initialData ? initialData.paidAmount : 0;

        const computed = calculateCrmInvoiceAmounts({
            subtotal: subtotalWithoutVat,
            discountTotal: discountAmount,
            discountAmount: discountAmount,
            taxRate: effectiveTaxRate,
            vatRate: effectiveTaxRate,
            taxAmount: vatAmount,
            paidAmount: paidAmt,
            lineItems: synchronizedLineItems,
        });

        const resolvedTitleEn =
            mode === 'edit' && initialData?.titleEn
                ? initialData.titleEn
                : selectedContract
                  ? `${selectedContract.titleEn} — Tax Invoice`
                  : selectedQuotation
                    ? `${selectedQuotation.titleEn} — Tax Invoice`
                    : `${partyDetails.businessName.trim()} — Tax Invoice`;

        const resolvedTitleAr =
            mode === 'edit' && initialData?.titleAr
                ? initialData.titleAr
                : selectedContract?.titleAr
                  ? `فاتورة ضريبية — ${selectedContract.titleAr}`
                  : selectedQuotation?.titleAr
                    ? `فاتورة ضريبية — ${selectedQuotation.titleAr}`
                    : `فاتورة ضريبية — ${partyDetails.businessName.trim()}`;

        const parsed = crmInvoiceInputSchema.safeParse({
            invoiceNumber:
                mode === 'edit' && initialData
                    ? initialData.invoiceNumber
                    : undefined,
            invoiceType:
                mode === 'edit' && initialData
                    ? initialData.invoiceType
                    : 'final_tax',
            titleEn: resolvedTitleEn,
            titleAr: resolvedTitleAr,
            companyId: resolvedCompanyId,
            companyNameEn: partyDetails.businessName.trim(),
            dealId:
                (
                    selectedContract?.dealId ||
                    selectedQuotation?.dealId ||
                    dealId
                )?.trim() || undefined,
            quotationId: quotationId.trim() || undefined,
            quotationCode: selectedQuotation?.code || undefined,
            contractId:
                selectedContract?.contractStatus === 'active'
                    ? selectedContract.id
                    : undefined,
            contractCode: selectedContract?.code || undefined,
            contractNumber: selectedContract?.contractNumber || undefined,
            contactId: contactId.trim() || undefined,
            contactName:
                customerName.trim() ||
                partyDetails.representative.trim() ||
                undefined,
            assignedEmployeeId:
                selectedContract?.assignedEmployeeId ||
                selectedQuotation?.assignedEmployeeId ||
                assignedEmployeeId ||
                defaultEmployeeId,
            issueDate: invoiceDate,
            dueDate:
                mode === 'edit' &&
                initialData?.dueDate &&
                Date.parse(initialData.dueDate) >= Date.parse(invoiceDate)
                    ? initialData.dueDate
                    : computedDueDate,
            lineItems: computed.lineItems || synchronizedLineItems,
            subtotal: subtotalWithoutVat,
            discountTotal: discountAmount,
            discountAmount: discountAmount,
            taxId: matchedTax?.id,
            taxRate: effectiveTaxRate,
            taxAmount: vatAmount,
            vatId: matchedTax?.id,
            vatRate: effectiveTaxRate,
            vatAmount: vatAmount,
            totalAmount: totalAmountWithVat,
            paidAmount: computed.paidAmount,
            remainingAmount: roundCrmCurrency(
                Math.max(0, totalAmountWithVat - computed.paidAmount)
            ),
            balanceDue: roundCrmCurrency(
                Math.max(0, totalAmountWithVat - computed.paidAmount)
            ),
            currency: 'SAR',
            paymentMethod:
                mode === 'edit' && initialData?.paymentMethod
                    ? initialData.paymentMethod
                    : 'bank_transfer',
            invoiceStatus:
                mode === 'edit' && initialData
                    ? initialData.invoiceStatus
                    : 'issued',
            status: 'active',
        });

        if (!parsed.success) {
            const schemaErrors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!schemaErrors[key]) {
                    schemaErrors[key] = issue.message;
                }
            }
            setFieldErrors(schemaErrors);
            return;
        }

        await onSubmit(parsed.data);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-form-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-3xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
                    <h2
                        id="invoice-form-drawer-title"
                        className="text-base font-bold text-[#0D0D0D] tracking-tight"
                    >
                        Create Invoice
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Content */}
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex-1 flex flex-col overflow-hidden"
                >
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {serverError && (
                            <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                                <AlertCircle
                                    size={16}
                                    className="shrink-0 mt-0.5"
                                />
                                <span>{serverError}</span>
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* 1. Invoice Details                                                        */}
                        {/* ========================================================================= */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                            <div className="pb-2 border-b border-[#E5E0D8]/60">
                                <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                    Invoice Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Contract ID* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Contract ID{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <select
                                        value={contractId}
                                        onChange={(e) =>
                                            handleContractSelect(e.target.value)
                                        }
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors.contractId
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    >
                                        <option value="">
                                            Select Contract ID
                                        </option>
                                        {contracts.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.contractNumber} — {c.titleEn}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.contractId && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.contractId}
                                        </p>
                                    )}
                                </div>

                                {/* Quotation ID* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Quotation ID{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <select
                                        value={quotationId}
                                        onChange={(e) =>
                                            handleQuotationSelect(
                                                e.target.value
                                            )
                                        }
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors.quotationId
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    >
                                        <option value="">
                                            Select Quotation ID
                                        </option>
                                        {quotations.map((q) => (
                                            <option key={q.id} value={q.id}>
                                                {q.code} — {q.titleEn}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.quotationId && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.quotationId}
                                        </p>
                                    )}
                                </div>

                                {/* Invoice Date* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Invoice Date{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        value={invoiceDate}
                                        onChange={(e) => {
                                            setInvoiceDate(e.target.value);
                                            clearFieldError('invoiceDate');
                                        }}
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors.invoiceDate
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors.invoiceDate && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.invoiceDate}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* 2. Customer Details                                                       */}
                        {/* ========================================================================= */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                            <div className="pb-2 border-b border-[#E5E0D8]/60">
                                <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                    Customer Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Customer Name* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Customer Name{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => {
                                            setCustomerName(e.target.value);
                                            clearFieldError('customerName');
                                        }}
                                        placeholder="Enter Customer Name"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors.customerName
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors.customerName && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.customerName}
                                        </p>
                                    )}
                                </div>

                                {/* Customer Email* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Customer Email{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => {
                                            setCustomerEmail(e.target.value);
                                            clearFieldError('customerEmail');
                                        }}
                                        placeholder="Enter Customer Email"
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors.customerEmail
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors.customerEmail && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.customerEmail}
                                        </p>
                                    )}
                                </div>

                                {/* Customer Phone* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Customer Phone{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => {
                                            setCustomerPhone(e.target.value);
                                            clearFieldError('customerPhone');
                                        }}
                                        placeholder="Enter Customer Phone Number"
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors.customerPhone
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors.customerPhone && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.customerPhone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* 3. Subscription Details                                                   */}
                        {/* ========================================================================= */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-white p-5 space-y-4">
                            <div className="pb-2 border-b border-[#E5E0D8]">
                                <h3 className="text-xs font-bold text-[#0D0D0D]">
                                    Subscription Details
                                </h3>
                            </div>

                            <div className="rounded-xl border border-[#E5E0D8] bg-white overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-start border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862]">
                                                <th className="py-3 px-4 text-start">
                                                    S.No.
                                                </th>
                                                <th className="py-3 px-4 text-start">
                                                    Package
                                                </th>
                                                <th className="py-3 px-4 text-start">
                                                    Unit Price
                                                </th>
                                                <th className="py-3 px-4 text-start">
                                                    Quantity
                                                </th>
                                                <th className="py-3 px-4 text-end">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E0D8]">
                                            {lineItems.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-6 text-center text-xs text-[#6E6862]"
                                                    >
                                                        No items found
                                                    </td>
                                                </tr>
                                            ) : (
                                                lineItems.map((item, idx) => {
                                                    const periodFactor =
                                                        item.periodUnit ===
                                                        'one_time'
                                                            ? 1
                                                            : Math.max(
                                                                  1,
                                                                  Number(
                                                                      item.period ??
                                                                          1
                                                                  )
                                                              );
                                                    const rowTotal =
                                                        roundCrmCurrency(
                                                            item.unitPrice *
                                                                item.quantity *
                                                                periodFactor
                                                        );
                                                    return (
                                                        <tr
                                                            key={
                                                                item.id || idx
                                                            }
                                                        >
                                                            <td className="py-3 px-4 font-mono text-[#0D0D0D]">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="py-3 px-4 font-semibold text-[#0D0D0D]">
                                                                {
                                                                    item.descriptionEn
                                                                }
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={
                                                                        item.unitPrice
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleLineItemChange(
                                                                            idx,
                                                                            {
                                                                                unitPrice:
                                                                                    Number(
                                                                                        e
                                                                                            .target
                                                                                            .value ||
                                                                                            0
                                                                                    ),
                                                                            }
                                                                        )
                                                                    }
                                                                    dir="ltr"
                                                                    className="w-28 px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono tabular-nums text-[#0D0D0D]"
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    value={
                                                                        item.quantity
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleLineItemChange(
                                                                            idx,
                                                                            {
                                                                                quantity:
                                                                                    Math.max(
                                                                                        1,
                                                                                        Number(
                                                                                            e
                                                                                                .target
                                                                                                .value ||
                                                                                                1
                                                                                        )
                                                                                    ),
                                                                            }
                                                                        )
                                                                    }
                                                                    dir="ltr"
                                                                    className="w-20 px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono tabular-nums text-[#0D0D0D]"
                                                                />
                                                            </td>
                                                            <td
                                                                className="py-3 px-4 font-mono font-bold text-[#037F8C] text-end"
                                                                dir="ltr"
                                                            >
                                                                {formatAmount(
                                                                    rowTotal
                                                                )}{' '}
                                                                SAR
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D8] text-xs">
                                <span className="font-semibold text-[#0D0D0D]">
                                    Total (Without VAT)
                                </span>
                                <span
                                    className="font-mono font-bold text-[#037F8C]"
                                    dir="ltr"
                                >
                                    {formatAmount(subtotalWithoutVat)} SAR
                                </span>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* 4. Additional Details                                                     */}
                        {/* ========================================================================= */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                            <div className="pb-2 border-b border-[#E5E0D8]/60">
                                <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                    Additional Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                {/* 1. Discount Applied* */}
                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                        Discount Applied{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={discountAppliedInput}
                                            onChange={(e) =>
                                                handleDiscountAppliedChange(
                                                    e.target.value
                                                )
                                            }
                                            dir="ltr"
                                            className={`w-full px-3.5 py-2.5 pe-8 rounded-xl border bg-white font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] ${
                                                fieldErrors.discountApplied
                                                    ? 'border-[#A63A3A]'
                                                    : 'border-[#E5E0D8]'
                                            }`}
                                        />
                                        <span
                                            className="absolute inset-y-0 end-3 flex items-center text-[#6E6862] font-semibold text-xs pointer-events-none"
                                            dir="ltr"
                                        >
                                            %
                                        </span>
                                    </div>
                                    {fieldErrors.discountApplied && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.discountApplied}
                                        </p>
                                    )}
                                </div>

                                {/* 2. Discount Amount* */}
                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                        Discount Amount{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={discountAmountInput}
                                            onChange={(e) =>
                                                handleDiscountAmountChange(
                                                    e.target.value
                                                )
                                            }
                                            dir="ltr"
                                            className={`w-full px-3.5 py-2.5 pe-12 rounded-xl border bg-white font-mono tabular-nums font-semibold text-[#B45309] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] ${
                                                fieldErrors.discountAmount
                                                    ? 'border-[#A63A3A]'
                                                    : 'border-[#E5E0D8]'
                                            }`}
                                        />
                                        <span
                                            className="absolute inset-y-0 end-3 flex items-center text-[11px] font-sans font-normal text-[#6E6862] pointer-events-none"
                                            dir="ltr"
                                        >
                                            SAR
                                        </span>
                                    </div>
                                    {fieldErrors.discountAmount && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.discountAmount}
                                        </p>
                                    )}
                                </div>

                                {/* 3. Net After Discount* */}
                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                        Net After Discount{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <div
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] font-mono tabular-nums font-semibold text-[#0D0D0D] flex items-center justify-between"
                                        dir="ltr"
                                    >
                                        <span>
                                            {formatAmount(netAfterDiscount)}
                                        </span>
                                        <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                            SAR
                                        </span>
                                    </div>
                                </div>

                                {/* 4. Tax Applied* */}
                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                        Tax Applied{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={taxAppliedRate}
                                            onChange={(e) =>
                                                setTaxAppliedRate(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                                        >
                                            {taxOptions.map((taxOpt) => (
                                                <option
                                                    key={`${taxOpt.label}-${taxOpt.rate}`}
                                                    value={taxOpt.rate}
                                                >
                                                    {taxOpt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* 5. VAT Amount* */}
                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                        VAT Amount{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <div
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] font-mono tabular-nums font-semibold text-[#0D0D0D] flex items-center justify-between"
                                        dir="ltr"
                                    >
                                        <span>{formatAmount(vatAmount)}</span>
                                        <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                            SAR
                                        </span>
                                    </div>
                                </div>

                                {/* 6. Total Amount (Including VAT) */}
                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                        Total Amount (Including VAT)
                                    </label>
                                    <div
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#037F8C] bg-[#037F8C]/10 font-mono tabular-nums font-bold text-[#037F8C] flex items-center justify-between"
                                        dir="ltr"
                                    >
                                        <span>
                                            {formatAmount(totalAmountWithVat)}
                                        </span>
                                        <span className="text-[11px] font-sans font-semibold text-[#037F8C]">
                                            SAR
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* 5. Party Details                                                          */}
                        {/* ========================================================================= */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                            <div className="pb-2 border-b border-[#E5E0D8]/60">
                                <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                    Party Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* 1. Business Name* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Business Name{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.businessName}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'businessName',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter Business Name"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.businessName']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.businessName'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.businessName']}
                                        </p>
                                    )}
                                </div>

                                {/* 2. CR Number* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        CR Number{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.crNumber}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'crNumber',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter CR Number"
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.crNumber']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.crNumber'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.crNumber']}
                                        </p>
                                    )}
                                </div>

                                {/* 3. VAT Number* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        VAT Number{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.vatNumber}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'vatNumber',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter VAT Number"
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.vatNumber']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.vatNumber'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.vatNumber']}
                                        </p>
                                    )}
                                </div>

                                {/* 4. Building* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Building{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.building}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'building',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter Building"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.building']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.building'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.building']}
                                        </p>
                                    )}
                                </div>

                                {/* 5. Street* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Street{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.street}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'street',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter Street"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.street']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.street'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.street']}
                                        </p>
                                    )}
                                </div>

                                {/* 6. District* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        District{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.district}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'district',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter District"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.district']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.district'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.district']}
                                        </p>
                                    )}
                                </div>

                                {/* 7. City* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        City{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.city}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'city',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter City"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.city']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.city'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.city']}
                                        </p>
                                    )}
                                </div>

                                {/* 8. Representative* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Representative{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.representative}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'representative',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter Representative"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.representative']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.representative'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {
                                                fieldErrors[
                                                    'party.representative'
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* 9. Pin Code* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Pin Code{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.pinCode}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'pinCode',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter Pin Code"
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.pinCode']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.pinCode'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.pinCode']}
                                        </p>
                                    )}
                                </div>

                                {/* 10. Province* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Province{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={partyDetails.province}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'province',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter Province"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.province']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.province'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.province']}
                                        </p>
                                    )}
                                </div>

                                {/* 11. Phone* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Phone{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={partyDetails.phone}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'phone',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter Phone"
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.phone']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.phone'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.phone']}
                                        </p>
                                    )}
                                </div>

                                {/* 12. Email* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        Email{' '}
                                        <span className="text-[#A63A3A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="email"
                                        value={partyDetails.email}
                                        onChange={(e) =>
                                            handlePartyChange(
                                                'email',
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter Email"
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                            fieldErrors['party.email']
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors['party.email'] && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors['party.email']}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
