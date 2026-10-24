import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    FileCheck2,
    Edit3,
    AlertCircle,
    Building2,
    Calculator,
} from 'lucide-react';
import {
    CRM_CONTRACT_STATUS_VALUES,
    CRM_CONTRACT_RENEWAL_VALUES,
    crmContractInputSchema,
    calculateCrmContractAmounts,
    roundCrmCurrency,
    type CrmContractInput,
    type CrmContractRecord,
    type CrmContractStatus,
    type CrmContractRenewal,
    type CrmBillingCycle,
    type CrmCompanyRecord,
    type CrmDealRecord,
    type CrmQuotationRecord,
    type CrmContactRecord,
} from '../../../schemas/crmSchema';
import type { CrmSalesEmployee } from '../../../api/api';

export interface ContractFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmContractRecord | null;
    companies: CrmCompanyRecord[];
    deals: CrmDealRecord[];
    quotations: CrmQuotationRecord[];
    contacts: CrmContactRecord[];
    employees: CrmSalesEmployee[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmContractInput) => Promise<void> | void;
}

interface FirstPartyFormState {
    contractDate: string;
    businessName: string;
    crNumber: string;
    building: string;
    district: string;
    province: string;
    representativeName: string;
    email: string;
    vatNumber: string;
    streetName: string;
    city: string;
    pinCode: string;
    mobileNumber: string;
}

interface SecondPartyFormState {
    quotationId: string;
    businessName: string;
    crNumber: string;
    vatNumber: string;
    building: string;
    streetName: string;
    district: string;
    city: string;
    province: string;
    pinCode: string;
    representativeJobTitle: string;
    email: string;
    representativeName: string;
    mobileNumber: string;
}

const createInitialFirstPartyState = (todayIso: string): FirstPartyFormState => ({
    contractDate: todayIso,
    businessName: 'AWN',
    crNumber: 'AWNCR12345',
    building: 'Second bld',
    district: 'Abahhh',
    province: 'HJZI',
    representativeName: 'AWN',
    email: 'info@awn.com',
    vatNumber: 'AWNVAT12345',
    streetName: 'St2 Corp.',
    city: 'Makkah',
    pinCode: '345678',
    mobileNumber: '+919876543210',
});

const createInitialSecondPartyState = (): SecondPartyFormState => ({
    quotationId: '',
    businessName: '',
    crNumber: '',
    vatNumber: '',
    building: '',
    streetName: '',
    district: '',
    city: '',
    province: '',
    pinCode: '',
    representativeJobTitle: '',
    email: '',
    representativeName: '',
    mobileNumber: '',
});

export const ContractFormDrawer: React.FC<ContractFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    companies,
    deals,
    quotations,
    contacts,
    employees,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultCompany =
        companies.find((c) => c.status === 'active') || companies[0];
    const defaultEmployeeId = employees[0]?.id || 'emp-1';
    const todayDate = new Date();
    const todayIso = todayDate.toISOString().split('T')[0];
    const nextYearDate = new Date(todayDate);
    nextYearDate.setDate(nextYearDate.getDate() + 365);
    const nextYearIso = nextYearDate.toISOString().split('T')[0];

    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [firstParty, setFirstParty] = useState<FirstPartyFormState>(() =>
        createInitialFirstPartyState(todayIso)
    );
    const [secondParty, setSecondParty] = useState<SecondPartyFormState>(() =>
        createInitialSecondPartyState()
    );

    const [taxRate, setTaxRate] = useState<number>(15);
    const [formState, setFormState] = useState<CrmContractInput>({
        contractNumber: '',
        titleEn: '',
        titleAr: '',
        dealId: '',
        quotationId: '',
        companyId: defaultCompany?.id || '',
        contactId: '',
        assignedEmployeeId: defaultEmployeeId,
        contractStatus: 'draft',
        renewalType: 'annual_auto',
        billingCycle: 'monthly',
        startDate: todayIso,
        endDate: nextYearIso,
        signedDate: '',
        subtotal: 0,
        discountTotal: 0,
        taxAmount: 0,
        totalValue: 0,
        currency: 'SAR',
        termsAndConditions:
            'Annual professional services engagement governed by SOCPA and ZATCA regulatory frameworks.',
        notes: '',
        status: 'active',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${defaultCompany?.id ?? ''}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setFieldErrors({});
            setCurrentStep(1);
            setFirstParty(createInitialFirstPartyState(todayIso));
            setSecondParty(createInitialSecondPartyState());
            if (mode === 'edit' && initialData) {
                setTaxRate(15);
                setFormState({
                    contractNumber: initialData.contractNumber,
                    titleEn: initialData.titleEn,
                    titleAr: initialData.titleAr || '',
                    dealId: initialData.dealId || '',
                    quotationId: initialData.quotationId || '',
                    companyId: initialData.companyId,
                    contactId: initialData.contactId || '',
                    assignedEmployeeId: initialData.assignedEmployeeId,
                    contractStatus: initialData.contractStatus,
                    renewalType: initialData.renewalType,
                    billingCycle: initialData.billingCycle || 'annual',
                    startDate: initialData.startDate,
                    endDate: initialData.endDate,
                    signedDate: initialData.signedDate || '',
                    subtotal: initialData.subtotal,
                    discountTotal: initialData.discountTotal,
                    taxAmount: initialData.taxAmount,
                    totalValue: initialData.totalValue,
                    currency: initialData.currency || 'SAR',
                    termsAndConditions: initialData.termsAndConditions || '',
                    notes: initialData.notes || '',
                    status: initialData.status || 'active',
                });
            } else {
                setTaxRate(15);
                setFormState({
                    contractNumber: '',
                    titleEn: '',
                    titleAr: '',
                    dealId: '',
                    quotationId: '',
                    companyId: defaultCompany?.id || '',
                    contactId: '',
                    assignedEmployeeId: defaultEmployeeId,
                    contractStatus: 'draft',
                    renewalType: 'annual_auto',
                    billingCycle: 'monthly',
                    startDate: todayIso,
                    endDate: nextYearIso,
                    signedDate: '',
                    subtotal: 0,
                    discountTotal: 0,
                    taxAmount: 0,
                    totalValue: 0,
                    currency: 'SAR',
                    termsAndConditions:
                        'Annual professional services engagement governed by SOCPA and ZATCA regulatory frameworks.',
                    notes: '',
                    status: 'active',
                });
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

    if (!isOpen) return null;

    const clearFieldError = (key: string) => {
        if (fieldErrors[key]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const handleChange = <K extends keyof CrmContractInput>(
        field: K,
        value: CrmContractInput[K]
    ) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        clearFieldError(field as string);
    };

    const handleFirstPartyChange = <K extends keyof FirstPartyFormState>(
        field: K,
        value: FirstPartyFormState[K]
    ) => {
        setFirstParty((prev) => ({ ...prev, [field]: value }));
        clearFieldError(`firstParty.${field}`);
    };

    const handleSecondPartyChange = <K extends keyof SecondPartyFormState>(
        field: K,
        value: SecondPartyFormState[K]
    ) => {
        setSecondParty((prev) => ({ ...prev, [field]: value }));
        clearFieldError(`secondParty.${field}`);
    };

    const eligibleQuotations = quotations.filter((q) => {
        if (mode === 'create') {
            return q.status !== 'inactive';
        }
        const isApprovedOrLinked =
            q.quotationStatus === 'approved' ||
            (mode === 'edit' && q.id === initialData?.quotationId);
        if (!isApprovedOrLinked) return false;

        if (formState.companyId && q.companyId !== formState.companyId) {
            return false;
        }

        return true;
    });

    const handleCompanyChange = (newCompanyId: string) => {
        setFormState((prev) => {
            const isQuotationIncompatible =
                Boolean(prev.quotationId) &&
                quotations.some(
                    (q) => q.id === prev.quotationId && q.companyId !== newCompanyId
                );

            const isContactIncompatible =
                Boolean(prev.contactId) &&
                contacts.some(
                    (c) => c.id === prev.contactId && c.companyId !== newCompanyId
                );

            return {
                ...prev,
                companyId: newCompanyId,
                quotationId: isQuotationIncompatible ? '' : prev.quotationId,
                contactId: isContactIncompatible ? '' : prev.contactId,
            };
        });

        clearFieldError('companyId');
        clearFieldError('quotationId');
    };

    const handleQuotationSelect = (quotationId: string) => {
        clearFieldError('quotationId');
        clearFieldError('secondParty.quotationId');

        if (!quotationId) {
            handleChange('quotationId', '');
            if (mode === 'create') {
                setSecondParty(createInitialSecondPartyState());
                setFormState((prev) => ({
                    ...prev,
                    quotationId: '',
                    subtotal: 0,
                    discountTotal: 0,
                    taxAmount: 0,
                    totalValue: 0,
                }));
            }
            return;
        }

        const q = quotations.find((item) => item.id === quotationId);
        if (!q) {
            handleChange('quotationId', '');
            return;
        }

        if (
            mode === 'edit' &&
            q.quotationStatus !== 'approved' &&
            q.id !== initialData?.quotationId
        ) {
            setFieldErrors((prev) => ({
                ...prev,
                quotationId: t('crm.commercial.quotations.validation.mustBeApproved', {
                    defaultValue: 'Only approved quotations can be converted into contracts.',
                }),
            }));
            return;
        }

        const linkedCompany = companies.find((c) => c.id === q.companyId);
        const linkedContact =
            (q.contactId
                ? contacts.find((c) => c.id === q.contactId)
                : undefined) ||
            contacts.find((c) => c.companyId === q.companyId && c.isPrimary) ||
            contacts.find((c) => c.companyId === q.companyId);

        if (mode === 'create') {
            setSecondParty({
                quotationId: q.id,
                businessName:
                    linkedCompany?.businessName ||
                    linkedCompany?.nameEn ||
                    q.companyNameEn ||
                    '',
                crNumber: linkedCompany?.crNumber || '',
                vatNumber: linkedCompany?.taxNumber || '',
                building: linkedCompany?.buildingNumber || '',
                streetName: linkedCompany?.street || linkedCompany?.address || '',
                district: linkedCompany?.district || '',
                city: linkedCompany?.city || '',
                province: linkedCompany?.province || linkedCompany?.state || '',
                pinCode: linkedCompany?.postalCode || linkedCompany?.pinCode || '',
                representativeJobTitle:
                    linkedCompany?.representativeJobTitle ||
                    linkedContact?.jobTitle ||
                    '',
                email:
                    q.customerEmail ||
                    linkedCompany?.email ||
                    linkedContact?.email ||
                    '',
                representativeName:
                    linkedCompany?.representativeName ||
                    q.customerName ||
                    q.contactName ||
                    linkedContact?.fullNameEn ||
                    '',
                mobileNumber:
                    q.customerPhone ||
                    linkedCompany?.phone ||
                    linkedContact?.phone ||
                    '',
            });

            setFieldErrors((prev) => {
                const next = { ...prev };
                Object.keys(next).forEach((k) => {
                    if (k.startsWith('secondParty.')) {
                        delete next[k];
                    }
                });
                return next;
            });
        }

        const firstItem = q.lineItems?.[0];
        let resolvedBillingCycle: CrmBillingCycle = 'annual';
        if (firstItem) {
            if (firstItem.periodUnit === 'one_time') {
                resolvedBillingCycle = 'one_time';
            } else if (firstItem.periodUnit === 'months') {
                if (firstItem.period === 1) resolvedBillingCycle = 'monthly';
                else if (firstItem.period === 3) resolvedBillingCycle = 'quarterly';
                else if (firstItem.period === 6) resolvedBillingCycle = 'semi_annual';
                else resolvedBillingCycle = 'annual';
            } else {
                resolvedBillingCycle = 'annual';
            }
        }

        const durationMonths = q.contractDurationMonths || q.contractDuration || 12;
        const startIso = formState.startDate || todayIso;
        const computedEndDate = new Date(startIso);
        if (!Number.isNaN(computedEndDate.getTime())) {
            computedEndDate.setMonth(computedEndDate.getMonth() + durationMonths);
        }
        const computedEndIso = !Number.isNaN(computedEndDate.getTime())
            ? computedEndDate.toISOString().split('T')[0]
            : nextYearIso;

        const effectiveTaxRate =
            q.taxRate ?? firstItem?.taxRate ?? firstItem?.vatRate ?? 15;
        setTaxRate(effectiveTaxRate);

        setFormState((prev) => ({
            ...prev,
            quotationId: q.id,
            dealId: q.dealId || prev.dealId,
            companyId: q.companyId || prev.companyId,
            contactId: q.contactId || linkedContact?.id || prev.contactId,
            assignedEmployeeId:
                q.assignedEmployeeId || prev.assignedEmployeeId || defaultEmployeeId,
            titleEn: `${q.titleEn} — Service Agreement`,
            titleAr: q.titleAr ? `عقد خدمات — ${q.titleAr}` : prev.titleAr || '',
            billingCycle: resolvedBillingCycle,
            startDate: prev.startDate || todayIso,
            endDate: computedEndIso,
            subtotal: q.subtotal,
            discountTotal: q.discountTotal,
            taxAmount: q.taxAmount,
            totalValue: q.grandTotal,
            termsAndConditions:
                q.termsAndConditions || prev.termsAndConditions,
        }));
    };

    const handleFinancialChange = (
        nextSubtotal: number,
        nextDiscount: number,
        nextTaxRate: number
    ) => {
        const computed = calculateCrmContractAmounts({
            subtotal: nextSubtotal,
            discountTotal: nextDiscount,
            taxRate: nextTaxRate,
        });
        setTaxRate(nextTaxRate);
        setFormState((prev) => ({
            ...prev,
            subtotal: computed.subtotal,
            discountTotal: computed.discountTotal,
            taxAmount: computed.taxAmount,
            totalValue: computed.totalValue,
        }));
    };

    const validateCreateStep1 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!firstParty.contractDate.trim()) {
            errors['firstParty.contractDate'] = 'Contract Date is required.';
        }
        if (!firstParty.businessName.trim()) {
            errors['firstParty.businessName'] = 'Business Name is required.';
        }
        if (!firstParty.crNumber.trim()) {
            errors['firstParty.crNumber'] = 'CR Number is required.';
        }
        if (!firstParty.building.trim()) {
            errors['firstParty.building'] = 'Building is required.';
        }
        if (!firstParty.district.trim()) {
            errors['firstParty.district'] = 'District is required.';
        }
        if (!firstParty.province.trim()) {
            errors['firstParty.province'] = 'Province is required.';
        }
        if (!firstParty.representativeName.trim()) {
            errors['firstParty.representativeName'] =
                'AWN Representative name is required.';
        }
        if (
            !firstParty.email.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(firstParty.email.trim())
        ) {
            errors['firstParty.email'] = 'Valid Email Address is required.';
        }
        if (!firstParty.vatNumber.trim()) {
            errors['firstParty.vatNumber'] = 'VAT Number is required.';
        }
        if (!firstParty.streetName.trim()) {
            errors['firstParty.streetName'] = 'Street Name is required.';
        }
        if (!firstParty.city.trim()) {
            errors['firstParty.city'] = 'City is required.';
        }
        if (!firstParty.pinCode.trim()) {
            errors['firstParty.pinCode'] = 'Pin Code is required.';
        }
        if (!firstParty.mobileNumber.trim()) {
            errors['firstParty.mobileNumber'] = 'Mobile Number is required.';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return false;
        }
        return true;
    };

    const validateCreateStep2 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!secondParty.quotationId.trim()) {
            errors['secondParty.quotationId'] = 'Quotation Ref is required.';
        }
        if (!secondParty.businessName.trim()) {
            errors['secondParty.businessName'] = 'Business Name is required.';
        }
        if (!secondParty.crNumber.trim()) {
            errors['secondParty.crNumber'] = 'CR Number is required.';
        }
        if (!secondParty.vatNumber.trim()) {
            errors['secondParty.vatNumber'] = 'VAT Number is required.';
        }
        if (!secondParty.building.trim()) {
            errors['secondParty.building'] = 'Building is required.';
        }
        if (!secondParty.streetName.trim()) {
            errors['secondParty.streetName'] = 'Street Name is required.';
        }
        if (!secondParty.district.trim()) {
            errors['secondParty.district'] = 'District is required.';
        }
        if (!secondParty.city.trim()) {
            errors['secondParty.city'] = 'City is required.';
        }
        if (!secondParty.province.trim()) {
            errors['secondParty.province'] = 'Province is required.';
        }
        if (!secondParty.pinCode.trim()) {
            errors['secondParty.pinCode'] = 'Pin Code is required.';
        }
        if (!secondParty.representativeJobTitle.trim()) {
            errors['secondParty.representativeJobTitle'] =
                'Representative Job Title is required.';
        }
        if (
            !secondParty.email.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondParty.email.trim())
        ) {
            errors['secondParty.email'] = 'Valid Email Address is required.';
        }
        if (!secondParty.representativeName.trim()) {
            errors['secondParty.representativeName'] =
                'Representative name is required.';
        }
        if (!secondParty.mobileNumber.trim()) {
            errors['secondParty.mobileNumber'] = 'Mobile Number is required.';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return false;
        }
        return true;
    };

    const validateCreateStep3 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formState.startDate || !formState.startDate.trim()) {
            errors.startDate = 'Start Date is required.';
        }
        if (!formState.endDate || !formState.endDate.trim()) {
            errors.endDate = 'End Date is required.';
        }
        if (
            formState.startDate &&
            formState.endDate &&
            Date.parse(formState.endDate) < Date.parse(formState.startDate)
        ) {
            errors.endDate = 'End Date cannot be earlier than Start Date.';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return false;
        }
        return true;
    };

    const handleCreateSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isSubmitting) return;

        setFieldErrors({});

        if (currentStep === 1) {
            if (validateCreateStep1()) {
                setCurrentStep(2);
            }
            return;
        }

        if (currentStep === 2) {
            if (validateCreateStep2()) {
                setCurrentStep(3);
            }
            return;
        }

        if (currentStep === 3) {
            if (validateCreateStep3()) {
                setCurrentStep(4);
            }
            return;
        }

        // Step 4: Final submission — validate all steps first
        if (!validateCreateStep1()) {
            setCurrentStep(1);
            return;
        }
        if (!validateCreateStep2()) {
            setCurrentStep(2);
            return;
        }
        if (!validateCreateStep3()) {
            setCurrentStep(3);
            return;
        }

        const selectedQ = quotations.find(
            (q) => q.id === secondParty.quotationId
        );
        const resolvedCompanyId =
            selectedQ?.companyId ||
            formState.companyId ||
            defaultCompany?.id ||
            '';
        const resolvedTitleEn =
            formState.titleEn.trim() ||
            (selectedQ
                ? `${selectedQ.titleEn} — Service Agreement`
                : `${secondParty.businessName.trim()} — Service Agreement`);

        const parsed = crmContractInputSchema.safeParse({
            ...formState,
            titleEn: resolvedTitleEn,
            companyId: resolvedCompanyId,
            assignedEmployeeId:
                selectedQ?.assignedEmployeeId ||
                formState.assignedEmployeeId ||
                defaultEmployeeId,
            contractNumber: formState.contractNumber?.trim() || undefined,
            dealId: (selectedQ?.dealId || formState.dealId)?.trim() || undefined,
            quotationId: secondParty.quotationId.trim() || undefined,
            contactId:
                (selectedQ?.contactId || formState.contactId)?.trim() ||
                undefined,
            contactName:
                secondParty.representativeName.trim() ||
                selectedQ?.contactName ||
                undefined,
            signedDate:
                formState.signedDate?.trim() ||
                firstParty.contractDate.trim() ||
                undefined,
        });

        if (!parsed.success) {
            const errors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!errors[key]) {
                    errors[key] = issue.message;
                }
            }
            setFieldErrors(errors);
            return;
        }

        await onSubmit(parsed.data);
    };

    const handleEditSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isSubmitting) return;
        setFieldErrors({});

        if (formState.quotationId && formState.quotationId.trim() !== '') {
            const selectedQ = quotations.find((q) => q.id === formState.quotationId);
            if (!selectedQ) {
                setFieldErrors((prev) => ({
                    ...prev,
                    quotationId: 'Selected quotation does not exist.',
                }));
                return;
            }
            if (
                selectedQ.quotationStatus !== 'approved' &&
                selectedQ.id !== initialData?.quotationId
            ) {
                setFieldErrors((prev) => ({
                    ...prev,
                    quotationId: 'Only approved quotations can be linked to a contract.',
                }));
                return;
            }
            if (selectedQ.companyId !== formState.companyId) {
                setFieldErrors((prev) => ({
                    ...prev,
                    quotationId: 'The selected quotation does not belong to the selected company.',
                }));
                return;
            }
        }

        const parsed = crmContractInputSchema.safeParse({
            ...formState,
            contractNumber: formState.contractNumber?.trim() || undefined,
            dealId: formState.dealId?.trim() || undefined,
            quotationId: formState.quotationId?.trim() || undefined,
            contactId: formState.contactId?.trim() || undefined,
            signedDate: formState.signedDate?.trim() || undefined,
        });

        if (!parsed.success) {
            const errors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!errors[key]) {
                    errors[key] = issue.message;
                }
            }
            setFieldErrors(errors);
            return;
        }
        await onSubmit(parsed.data);
    };

    const availableContacts = contacts.filter(
        (c) =>
            !formState.companyId ||
            c.companyId === formState.companyId ||
            c.id === formState.contactId
    );

    if (mode === 'create') {
        const selectedQuotation = quotations.find(
            (q) => q.id === secondParty.quotationId
        );
        const subscriptionItems = selectedQuotation?.lineItems || [];

        const monthlyTotalWithoutVat = selectedQuotation
            ? subscriptionItems.length > 0
                ? roundCrmCurrency(
                      subscriptionItems.reduce(
                          (sum, item) => sum + item.unitPrice * item.quantity,
                          0
                      )
                  )
                : roundCrmCurrency(selectedQuotation.subtotal)
            : 0;

        const totalForPeriod = selectedQuotation
            ? roundCrmCurrency(selectedQuotation.subtotal)
            : 0;

        const discountAmount = selectedQuotation
            ? roundCrmCurrency(selectedQuotation.discountTotal)
            : 0;

        const discountPercent = selectedQuotation
            ? selectedQuotation.discountPercent ??
              subscriptionItems[0]?.discountPercent ??
              (totalForPeriod > 0
                  ? roundCrmCurrency((discountAmount / totalForPeriod) * 100)
                  : 0)
            : 0;

        const vatAmount = selectedQuotation
            ? roundCrmCurrency(selectedQuotation.taxAmount)
            : 0;

        const amountAfterDiscount = selectedQuotation
            ? roundCrmCurrency(
                  selectedQuotation.taxableAmount ??
                      Math.max(0, totalForPeriod - discountAmount)
              )
            : 0;

        const totalAmountIncludingVat = selectedQuotation
            ? roundCrmCurrency(selectedQuotation.grandTotal)
            : 0;

        const steps = [
            { step: 1 as const, label: 'First Party' },
            { step: 2 as const, label: 'Second Party' },
            { step: 3 as const, label: 'Subscription Details' },
            { step: 4 as const, label: 'Signature' },
        ];

        return (
            <div
                className="fixed inset-0 z-50 flex justify-end"
                role="dialog"
                aria-modal="true"
                aria-labelledby="contract-form-drawer-title"
            >
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                    onClick={onClose}
                />

                <div className="relative z-10 w-full max-w-3xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 border border-[#2D3F2C]/20 flex items-center justify-center text-[#2D3F2C] shrink-0">
                                <FileCheck2 size={18} />
                            </div>
                            <div className="min-w-0">
                                <h2
                                    id="contract-form-drawer-title"
                                    className="text-base font-bold text-[#0D0D0D] truncate"
                                >
                                    Create Contract
                                </h2>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Step Navigation */}
                    <div className="px-6 py-3.5 border-b border-[#E5E0D8] bg-white grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {steps.map((item) => {
                            const isActive = currentStep === item.step;
                            const isDone = currentStep > item.step;
                            return (
                                <button
                                    key={item.step}
                                    type="button"
                                    onClick={() => {
                                        setFieldErrors({});
                                        setCurrentStep(item.step);
                                    }}
                                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-start transition-colors cursor-pointer ${
                                        isActive
                                            ? 'border-[#037F8C] bg-[#037F8C]/5'
                                            : isDone
                                              ? 'border-[#2E6B4E]/30 bg-[#E9F5EE]/50'
                                              : 'border-[#E5E0D8] bg-[#FAF8F5]'
                                    }`}
                                >
                                    <div
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                            isActive
                                                ? 'bg-[#037F8C] text-white'
                                                : isDone
                                                  ? 'bg-[#2E6B4E] text-white'
                                                  : 'bg-white border border-[#E5E0D8] text-[#6E6862]'
                                        }`}
                                    >
                                        {item.step}
                                    </div>
                                    <span className="text-xs font-bold text-[#0D0D0D] truncate">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Form Body */}
                    <form
                        onSubmit={handleCreateSubmit}
                        noValidate
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {serverError && (
                                <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                                    <AlertCircle
                                        size={16}
                                        className="shrink-0 mt-0.5"
                                    />
                                    <span>{serverError}</span>
                                </div>
                            )}

                            {/* STEP 1: First Party */}
                            {currentStep === 1 && (
                                <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        First Party
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Contract Date
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={firstParty.contractDate}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'contractDate',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.contractDate'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.contractDate']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Business Name
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.businessName}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'businessName',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.businessName'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.businessName']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                CR Number
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.crNumber}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'crNumber',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.crNumber'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.crNumber']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Building
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.building}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'building',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.building'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.building']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                District
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.district}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'district',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.district'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.district']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Province
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.province}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'province',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.province'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.province']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                AWN Representative name
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.representativeName}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'representativeName',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.representativeName'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.representativeName']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Email Address
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={firstParty.email}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'email',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.email'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.email']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                VAT Number
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.vatNumber}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'vatNumber',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.vatNumber'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.vatNumber']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Street Name
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.streetName}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'streetName',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.streetName'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.streetName']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                City
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.city}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'city',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.city'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.city']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Pin Code
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={firstParty.pinCode}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'pinCode',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.pinCode'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.pinCode']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Mobile Number
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={firstParty.mobileNumber}
                                                onChange={(e) =>
                                                    handleFirstPartyChange(
                                                        'mobileNumber',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['firstParty.mobileNumber'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['firstParty.mobileNumber']}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Second Party */}
                            {currentStep === 2 && (
                                <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        Second Party
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Quotation Ref
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <select
                                                value={secondParty.quotationId}
                                                onChange={(e) =>
                                                    handleQuotationSelect(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            >
                                                <option value="">
                                                    Select Quotation
                                                </option>
                                                {eligibleQuotations.map((q) => (
                                                    <option key={q.id} value={q.id}>
                                                        {q.code} —{' '}
                                                        {isRtl
                                                            ? q.titleAr || q.titleEn
                                                            : q.titleEn}
                                                    </option>
                                                ))}
                                            </select>
                                            {fieldErrors['secondParty.quotationId'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.quotationId']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Business Name
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.businessName}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'businessName',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.businessName'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.businessName']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                CR Number
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.crNumber}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'crNumber',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.crNumber'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.crNumber']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                VAT Number
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.vatNumber}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'vatNumber',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.vatNumber'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.vatNumber']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Building
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.building}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'building',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.building'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.building']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Street Name
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.streetName}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'streetName',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.streetName'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.streetName']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                District
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.district}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'district',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.district'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.district']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                City
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.city}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'city',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.city'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.city']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Province
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.province}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'province',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.province'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.province']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Pin Code
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={secondParty.pinCode}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'pinCode',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.pinCode'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.pinCode']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Representative Job Title
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    secondParty.representativeJobTitle
                                                }
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'representativeJobTitle',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors[
                                                'secondParty.representativeJobTitle'
                                            ] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {
                                                        fieldErrors[
                                                            'secondParty.representativeJobTitle'
                                                        ]
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Email Address
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={secondParty.email}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'email',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors['secondParty.email'] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {fieldErrors['secondParty.email']}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Representative name
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    secondParty.representativeName
                                                }
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'representativeName',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors[
                                                'secondParty.representativeName'
                                            ] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {
                                                        fieldErrors[
                                                            'secondParty.representativeName'
                                                        ]
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                Mobile Number
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={secondParty.mobileNumber}
                                                onChange={(e) =>
                                                    handleSecondPartyChange(
                                                        'mobileNumber',
                                                        e.target.value
                                                    )
                                                }
                                                dir="ltr"
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                            />
                                            {fieldErrors[
                                                'secondParty.mobileNumber'
                                            ] && (
                                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                                    {
                                                        fieldErrors[
                                                            'secondParty.mobileNumber'
                                                        ]
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Subscription Details */}
                            {currentStep === 3 && (
                                <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-5">
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        Subscription Details
                                    </h3>

                                    {/* Subscription Items Table */}
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
                                                            Monthly amount
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#E5E0D8]">
                                                    {subscriptionItems.length ===
                                                    0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={5}
                                                                className="py-8 text-center text-xs text-[#6E6862]"
                                                            >
                                                                No items found
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        subscriptionItems.map(
                                                            (item, idx) => {
                                                                const monthlyAmt =
                                                                    roundCrmCurrency(
                                                                        item.unitPrice *
                                                                            item.quantity
                                                                    );
                                                                return (
                                                                    <tr
                                                                        key={
                                                                            item.id ||
                                                                            idx
                                                                        }
                                                                    >
                                                                        <td className="py-3 px-4 font-mono text-[#0D0D0D]">
                                                                            {idx +
                                                                                1}
                                                                        </td>
                                                                        <td className="py-3 px-4 font-semibold text-[#0D0D0D]">
                                                                            {isRtl
                                                                                ? item.descriptionAr ||
                                                                                  item.descriptionEn
                                                                                : item.descriptionEn}
                                                                        </td>
                                                                        <td
                                                                            className="py-3 px-4 font-mono text-[#0D0D0D]"
                                                                            dir="ltr"
                                                                        >
                                                                            {item.unitPrice.toLocaleString()}{' '}
                                                                            SAR
                                                                        </td>
                                                                        <td className="py-3 px-4 font-mono text-[#0D0D0D]">
                                                                            {
                                                                                item.quantity
                                                                            }
                                                                        </td>
                                                                        <td
                                                                            className="py-3 px-4 font-mono font-bold text-[#0D0D0D] text-end"
                                                                            dir="ltr"
                                                                        >
                                                                            {monthlyAmt.toLocaleString()}{' '}
                                                                            SAR
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Financial Fields & Summaries in Exact Order */}
                                    <div className="space-y-3 bg-white rounded-xl border border-[#E5E0D8] p-4">
                                        <div className="flex items-center justify-between py-2 border-b border-[#E5E0D8]/60 text-xs">
                                            <span className="font-semibold text-[#0D0D0D]">
                                                Monthly Total - without VAT
                                            </span>
                                            <span
                                                className="font-mono font-bold text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {monthlyTotalWithoutVat.toLocaleString()}{' '}
                                                SAR
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-[#E5E0D8]/60 text-xs">
                                            <span className="font-semibold text-[#0D0D0D]">
                                                Total for the period
                                            </span>
                                            <span
                                                className="font-mono font-bold text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {totalForPeriod.toLocaleString()}{' '}
                                                SAR
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 py-2 border-b border-[#E5E0D8]/60 text-xs">
                                            <label className="font-semibold text-[#0D0D0D]">
                                                Payment Mode
                                            </label>
                                            <select
                                                value={
                                                    formState.billingCycle ||
                                                    'monthly'
                                                }
                                                onChange={(e) =>
                                                    handleChange(
                                                        'billingCycle',
                                                        e.target
                                                            .value as CrmBillingCycle
                                                    )
                                                }
                                                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                                            >
                                                <option value="monthly">
                                                    Monthly
                                                </option>
                                                <option value="quarterly">
                                                    Quarterly
                                                </option>
                                                <option value="semi_annual">
                                                    Semi-Annual
                                                </option>
                                                <option value="annual">
                                                    Annual
                                                </option>
                                                <option value="one_time">
                                                    One-Time
                                                </option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-[#E5E0D8]/60 text-xs">
                                            <span className="font-semibold text-[#0D0D0D]">
                                                Discount Amount
                                            </span>
                                            <span
                                                className="font-mono font-bold text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {discountAmount.toLocaleString()}{' '}
                                                SAR
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-[#E5E0D8]/60 text-xs">
                                            <span className="font-semibold text-[#0D0D0D]">
                                                Discount
                                            </span>
                                            <span
                                                className="font-mono font-bold text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {discountPercent}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-[#E5E0D8]/60 text-xs">
                                            <span className="font-semibold text-[#0D0D0D]">
                                                VAT Amount
                                            </span>
                                            <span
                                                className="font-mono font-bold text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {vatAmount.toLocaleString()} SAR
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-[#E5E0D8]/60 text-xs">
                                            <span className="font-semibold text-[#0D0D0D]">
                                                Amount after Discount
                                            </span>
                                            <span
                                                className="font-mono font-bold text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {amountAfterDiscount.toLocaleString()}{' '}
                                                SAR
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-[#E5E0D8]/60 text-xs">
                                            <span className="font-bold text-[#0D0D0D]">
                                                Total Amount Including VAT
                                            </span>
                                            <span
                                                className="font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {totalAmountIncludingVat.toLocaleString()}{' '}
                                                SAR
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                    Start Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formState.startDate}
                                                    placeholder="dd-mm-yyyy"
                                                    onChange={(e) =>
                                                        handleChange(
                                                            'startDate',
                                                            e.target.value
                                                        )
                                                    }
                                                    dir="ltr"
                                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                                />
                                                {fieldErrors.startDate && (
                                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                                        {fieldErrors.startDate}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                    End Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formState.endDate}
                                                    placeholder="dd-mm-yyyy"
                                                    onChange={(e) =>
                                                        handleChange(
                                                            'endDate',
                                                            e.target.value
                                                        )
                                                    }
                                                    dir="ltr"
                                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                                />
                                                {fieldErrors.endDate && (
                                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                                        {fieldErrors.endDate}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Signature */}
                            {currentStep === 4 && (
                                <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-5">
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        Signature
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-6">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-semibold text-[#6E6862] block">
                                                    First Party
                                                </span>
                                                <span className="text-xs font-bold text-[#0D0D0D] block">
                                                    {firstParty.businessName}
                                                </span>
                                                <span className="text-xs text-[#6E6862] block">
                                                    {
                                                        firstParty.representativeName
                                                    }
                                                </span>
                                            </div>
                                            <div className="pt-6 border-b border-dashed border-[#8C8479]" />
                                        </div>

                                        <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-6">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-semibold text-[#6E6862] block">
                                                    Second Party
                                                </span>
                                                <span className="text-xs font-bold text-[#0D0D0D] block">
                                                    {secondParty.businessName ||
                                                        '—'}
                                                </span>
                                                <span className="text-xs text-[#6E6862] block">
                                                    {secondParty.representativeName ||
                                                        '—'}
                                                </span>
                                            </div>
                                            <div className="pt-6 border-b border-dashed border-[#8C8479]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
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
                                className="px-5 py-2.5 rounded-xl bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contract-form-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 border border-[#2D3F2C]/20 flex items-center justify-center text-[#2D3F2C] shrink-0">
                            <Edit3 size={18} />
                        </div>
                        <div className="min-w-0">
                            <span
                                className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {initialData
                                    ? initialData.contractNumber
                                    : t('crm.commercial.contracts.badge')}
                            </span>
                            <h2
                                id="contract-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {t('crm.commercial.contracts.form.editTitle', {
                                    code: initialData?.code || '',
                                })}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {t('crm.commercial.contracts.form.editSubtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    onSubmit={handleEditSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-5"
                >
                    {serverError && (
                        <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* Section 1: Agreement Identity & Source Quotation */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3F2C]">
                            <Building2 size={14} />
                            <span>
                                {t('crm.commercial.contracts.form.companyLabel')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.quotationLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.quotationId || ''}
                                    onChange={(e) =>
                                        handleQuotationSelect(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t(
                                            'crm.commercial.common.noLinkedQuotation'
                                        )}
                                    </option>
                                    {eligibleQuotations.map((q) => (
                                        <option key={q.id} value={q.id}>
                                            {q.code} —{' '}
                                            {isRtl
                                                ? q.titleAr || q.titleEn
                                                : q.titleEn}{' '}
                                            ({q.grandTotal.toLocaleString()} SAR)
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.quotationId && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.quotationId}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.titleEnLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="text"
                                    value={formState.titleEn}
                                    onChange={(e) =>
                                        handleChange('titleEn', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.commercial.contracts.form.titleEnPlaceholder'
                                    )}
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                />
                                {fieldErrors.titleEn && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.titleEn}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.titleArLabel'
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={formState.titleAr || ''}
                                    onChange={(e) =>
                                        handleChange('titleAr', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.commercial.contracts.form.titleArPlaceholder'
                                    )}
                                    dir="rtl"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.companyLabel'
                                    )}{' '}
                                    *
                                </label>
                                <select
                                    value={formState.companyId}
                                    onChange={(e) =>
                                        handleCompanyChange(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} —{' '}
                                            {isRtl ? c.nameAr : c.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.contracts.form.dealLabel')}
                                </label>
                                <select
                                    value={formState.dealId || ''}
                                    onChange={(e) =>
                                        handleChange('dealId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('crm.commercial.common.noLinkedDeal')}
                                    </option>
                                    {deals.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.code} —{' '}
                                            {isRtl
                                                ? d.titleAr || d.titleEn
                                                : d.titleEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.contactLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.contactId || ''}
                                    onChange={(e) =>
                                        handleChange('contactId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t(
                                            'crm.commercial.common.noLinkedContact'
                                        )}
                                    </option>
                                    {availableContacts.map((cnt) => (
                                        <option key={cnt.id} value={cnt.id}>
                                            {isRtl
                                                ? cnt.fullNameAr || cnt.fullNameEn
                                                : cnt.fullNameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.assignedRepLabel'
                                    )}{' '}
                                    *
                                </label>
                                <select
                                    value={formState.assignedEmployeeId}
                                    onChange={(e) =>
                                        handleChange(
                                            'assignedEmployeeId',
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {isRtl ? emp.nameAr : emp.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.startDateLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="date"
                                    value={formState.startDate}
                                    onChange={(e) =>
                                        handleChange('startDate', e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.endDateLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="date"
                                    value={formState.endDate}
                                    onChange={(e) =>
                                        handleChange('endDate', e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                                {fieldErrors.endDate && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.endDate}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.renewalTypeLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.renewalType}
                                    onChange={(e) =>
                                        handleChange(
                                            'renewalType',
                                            e.target.value as CrmContractRenewal
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {CRM_CONTRACT_RENEWAL_VALUES.map((rt) => (
                                        <option key={rt} value={rt}>
                                            {t(
                                                `crm.commercial.contracts.renewalTypes.${rt}`
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.contractStatusLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.contractStatus}
                                    onChange={(e) =>
                                        handleChange(
                                            'contractStatus',
                                            e.target.value as CrmContractStatus
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {CRM_CONTRACT_STATUS_VALUES.map((st) => (
                                        <option key={st} value={st}>
                                            {t(
                                                `crm.commercial.contracts.statuses.${st}`
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Financial Valuation */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3F2C]">
                            <Calculator size={14} />
                            <span>
                                {t('crm.commercial.contracts.columns.financials')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.subtotalLabel'
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    value={formState.subtotal}
                                    onChange={(e) =>
                                        handleFinancialChange(
                                            Number(e.target.value || 0),
                                            formState.discountTotal,
                                            taxRate
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.discountTotalLabel'
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={formState.discountTotal}
                                    onChange={(e) =>
                                        handleFinancialChange(
                                            formState.subtotal,
                                            Number(e.target.value || 0),
                                            taxRate
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.taxRateLabel'
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={taxRate}
                                    onChange={(e) =>
                                        handleFinancialChange(
                                            formState.subtotal,
                                            formState.discountTotal,
                                            Number(e.target.value || 0)
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>
                        </div>

                        <div className="rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] p-3.5 flex items-center justify-between">
                            <div className="text-xs text-[#6E6862]">
                                {t(
                                    'crm.commercial.contracts.form.taxAmountLabel'
                                )}
                                :{' '}
                                <span
                                    className="font-mono font-bold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {formState.taxAmount.toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="text-sm font-bold text-[#0D0D0D]">
                                {t(
                                    'crm.commercial.contracts.form.totalValueLabel'
                                )}
                                :{' '}
                                <span
                                    className="font-mono text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {formState.totalValue.toLocaleString()} SAR
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Contractual Clauses */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                {t('crm.commercial.contracts.form.termsLabel')}
                            </label>
                            <textarea
                                rows={2}
                                value={formState.termsAndConditions || ''}
                                onChange={(e) =>
                                    handleChange(
                                        'termsAndConditions',
                                        e.target.value
                                    )
                                }
                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                {t('crm.commercial.contracts.form.notesLabel')}
                            </label>
                            <textarea
                                rows={2}
                                value={formState.notes || ''}
                                onChange={(e) =>
                                    handleChange('notes', e.target.value)
                                }
                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                        >
                            {t('crm.commercial.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting
                                ? t('crm.commercial.common.saving')
                                : t('crm.commercial.common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

