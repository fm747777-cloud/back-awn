import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Search,
    ChevronDown,
    Check,
    Upload,
    FileText,
    Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateError } from '../../i18n';
import { focusAndScrollToFirstError } from '../../utils/formValidation';
import {
    TICKET_CUSTOMER_OPTIONS,
    TICKET_COMPANY_OPTIONS,
    TICKET_PRIORITY_OPTIONS,
    getActiveTicketTypeOptions,
    type TableTicket,
    type TicketAttachment,
    type TicketSelectOption,
} from './ticketingMockData';

export type TicketDrawerMode = 'create' | 'edit' | 'view';

export interface TicketFormSubmitData {
    customerValue: string;
    companyValue: string;
    ticketTypeValue: string;
    priority: 'High' | 'Medium' | 'Low';
    subject: string;
    message: string;
    attachment: TicketAttachment | null;
}

interface TicketDrawerProps {
    isOpen: boolean;
    mode: TicketDrawerMode;
    ticket?: TableTicket | null;
    onClose: () => void;
    onSubmit: (data: TicketFormSubmitData, existingTicket?: TableTicket | null) => void;
}

interface ValidationErrors {
    customer?: string;
    company?: string;
    priority?: string;
    subject?: string;
    message?: string;
    attachment?: string;
}

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS_REGEX =
    /\.(png|jpe?g|gif|webp|svg|bmp|pdf|docx?|xlsx?|csv|txt|log|md)$/i;

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
]);

function isAllowedAttachmentFile(file: { name: string; type: string }): boolean {
    if (file.type && (file.type.startsWith('image/') || ALLOWED_MIME_TYPES.has(file.type))) {
        return true;
    }
    return ALLOWED_EXTENSIONS_REGEX.test(file.name);
}

function formatFileSizeLatin(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
}

function resolveOptionValue(
    options: TicketSelectOption[],
    arVal?: string,
    enVal?: string
): string {
    if (!arVal && !enVal) return '';
    const match = options.find(
        (o) =>
            o.value === enVal ||
            o.value === arVal ||
            o.en === enVal ||
            o.ar === arVal
    );
    return match ? match.value : enVal || arVal || '';
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
    isOpen,
    mode,
    ticket,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');
    const isView = mode === 'view';
    const isEdit = mode === 'edit';

    // Refs for form and focus management
    const formRef = useRef<HTMLFormElement>(null);
    const customerDropdownRef = useRef<HTMLDivElement>(null);
    const companyDropdownRef = useRef<HTMLDivElement>(null);
    const customerButtonRef = useRef<HTMLButtonElement>(null);
    const companyButtonRef = useRef<HTMLButtonElement>(null);
    const prioritySelectRef = useRef<HTMLSelectElement>(null);
    const subjectInputRef = useRef<HTMLInputElement>(null);
    const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chooseFileBtnRef = useRef<HTMLButtonElement>(null);

    // 7 Strictly Allowed Fields State
    const [customerValue, setCustomerValue] = useState<string>('');
    const [companyValue, setCompanyValue] = useState<string>('');
    const [ticketTypeValue, setTicketTypeValue] = useState<string>('');
    const [priority, setPriority] = useState<'' | 'High' | 'Medium' | 'Low'>('');
    const [subject, setSubject] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [attachment, setAttachment] = useState<TicketAttachment | null>(null);

    // Searchable dropdown states
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [companySearch, setCompanySearch] = useState('');

    // Drag and drop state
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Validation state (only shown after form submission attempt)
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const activeTicketTypeOptions = getActiveTicketTypeOptions();

    // Adjust state during render when drawer opens or mode/ticket changes (per React docs, matching ServiceGroupDrawer)
    const [prevSyncKey, setPrevSyncKey] = useState<string>('');
    const currentSyncKey = `${isOpen}-${mode}-${ticket?.id ?? 'new'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setHasSubmitted(false);
        setErrors({});
        setIsCustomerOpen(false);
        setCustomerSearch('');
        setIsCompanyOpen(false);
        setCompanySearch('');
        setIsDraggingOver(false);

        if (isOpen && (mode === 'edit' || mode === 'view') && ticket) {
            setCustomerValue(
                resolveOptionValue(TICKET_CUSTOMER_OPTIONS, ticket.customer, ticket.customerEn)
            );
            setCompanyValue(
                resolveOptionValue(TICKET_COMPANY_OPTIONS, ticket.company, ticket.companyEn)
            );
            setTicketTypeValue(
                resolveOptionValue(activeTicketTypeOptions, ticket.ticketType, ticket.ticketTypeEn)
            );
            setPriority(ticket.priority);
            setSubject(
                (isAr ? ticket.subject : ticket.subjectEn) ||
                    ticket.subject ||
                    ticket.subjectEn ||
                    ''
            );
            setMessage(
                (isAr ? ticket.message : ticket.messageEn) ||
                    ticket.message ||
                    ticket.messageEn ||
                    ''
            );
            setAttachment(ticket.attachment ? { ...ticket.attachment } : null);
        } else if (isOpen && mode === 'create') {
            setCustomerValue('');
            setCompanyValue('');
            setTicketTypeValue('');
            setPriority('');
            setSubject('');
            setMessage('');
            setAttachment(null);
        }
    }

    // Close searchable dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(target)) {
                setIsCustomerOpen(false);
            }
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (isCustomerOpen || isCompanyOpen) {
                    setIsCustomerOpen(false);
                    setIsCompanyOpen(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isCustomerOpen, isCompanyOpen, onClose]);

    // Ensure custom options from ticket (if any) are included in options lists
    const customerOptions = React.useMemo(() => {
        if (
            ticket &&
            customerValue &&
            !TICKET_CUSTOMER_OPTIONS.some((o) => o.value === customerValue)
        ) {
            return [
                ...TICKET_CUSTOMER_OPTIONS,
                {
                    value: customerValue,
                    ar: ticket.customer || customerValue,
                    en: ticket.customerEn || customerValue,
                },
            ];
        }
        return TICKET_CUSTOMER_OPTIONS;
    }, [ticket, customerValue]);

    const companyOptions = React.useMemo(() => {
        if (
            ticket &&
            companyValue &&
            !TICKET_COMPANY_OPTIONS.some((o) => o.value === companyValue)
        ) {
            return [
                ...TICKET_COMPANY_OPTIONS,
                {
                    value: companyValue,
                    ar: ticket.company || companyValue,
                    en: ticket.companyEn || companyValue,
                },
            ];
        }
        return TICKET_COMPANY_OPTIONS;
    }, [ticket, companyValue]);

    const ticketTypeOptions = React.useMemo(() => {
        const base = getActiveTicketTypeOptions();
        if (
            ticket &&
            ticketTypeValue &&
            !base.some((o) => o.value === ticketTypeValue)
        ) {
            return [
                ...base,
                {
                    value: ticketTypeValue,
                    ar: ticket.ticketType || ticketTypeValue,
                    en: ticket.ticketTypeEn || ticketTypeValue,
                },
            ];
        }
        return base;
    }, [ticket, ticketTypeValue]);

    const selectedCustomerOption = customerOptions.find((o) => o.value === customerValue);
    const selectedCompanyOption = companyOptions.find((o) => o.value === companyValue);
    const selectedTicketTypeOption = ticketTypeOptions.find((o) => o.value === ticketTypeValue);

    const filteredCustomerOptions = customerOptions.filter((opt) => {
        const q = customerSearch.trim().toLowerCase();
        if (!q) return true;
        return opt.en.toLowerCase().includes(q) || opt.ar.toLowerCase().includes(q);
    });

    const filteredCompanyOptions = companyOptions.filter((opt) => {
        const q = companySearch.trim().toLowerCase();
        if (!q) return true;
        return opt.en.toLowerCase().includes(q) || opt.ar.toLowerCase().includes(q);
    });

    const validateFields = (currentValues: {
        customer: string;
        company: string;
        priority: string;
        subject: string;
        message: string;
        attachment: TicketAttachment | null;
    }): ValidationErrors => {
        const nextErrors: ValidationErrors = {};

        if (!currentValues.customer.trim()) {
            nextErrors.customer = 'Customer is required';
        }
        if (!currentValues.company.trim()) {
            nextErrors.company = 'Company is required';
        }
        if (!currentValues.priority) {
            nextErrors.priority = 'Priority is required';
        }
        if (!currentValues.subject.trim()) {
            nextErrors.subject = 'Subject is required';
        }
        if (!currentValues.message.trim()) {
            nextErrors.message = 'Message is required';
        }
        if (currentValues.attachment) {
            if (!isAllowedAttachmentFile(currentValues.attachment)) {
                nextErrors.attachment =
                    'Unsupported file type. Allowed: Images, PDF, Word, Excel, Text';
            } else if (currentValues.attachment.size > MAX_ATTACHMENT_SIZE_BYTES) {
                nextErrors.attachment = 'Attachment exceeds the 10MB size limit';
            }
        }

        return nextErrors;
    };

    const focusFirstInvalid = (validationErrors: ValidationErrors) => {
        setTimeout(() => {
            if (validationErrors.customer && customerButtonRef.current) {
                customerButtonRef.current.focus();
                customerButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (validationErrors.company && companyButtonRef.current) {
                companyButtonRef.current.focus();
                companyButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (validationErrors.priority && prioritySelectRef.current) {
                prioritySelectRef.current.focus();
                prioritySelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (validationErrors.subject && subjectInputRef.current) {
                subjectInputRef.current.focus();
                subjectInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (validationErrors.message && messageTextareaRef.current) {
                messageTextareaRef.current.focus();
                messageTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (validationErrors.attachment && chooseFileBtnRef.current) {
                chooseFileBtnRef.current.focus();
                chooseFileBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            focusAndScrollToFirstError(
                validationErrors,
                ['customer', 'company', 'priority', 'subject', 'message', 'attachment'],
                formRef.current
            );
        }, 30);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isView) return;

        setHasSubmitted(true);

        const validationErrors = validateFields({
            customer: customerValue,
            company: companyValue,
            priority,
            subject,
            message,
            attachment,
        });

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            focusFirstInvalid(validationErrors);
            return;
        }

        onSubmit(
            {
                customerValue,
                companyValue,
                ticketTypeValue,
                priority: priority as 'High' | 'Medium' | 'Low',
                subject: subject.trim(),
                message: message.trim(),
                attachment,
            },
            ticket
        );
    };

    const handleFileSelect = (file: File | null | undefined) => {
        if (!file || isView) return;

        const nextAttachment: TicketAttachment = {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
        };

        setAttachment(nextAttachment);

        if (hasSubmitted) {
            setErrors((prev) => {
                const updated = { ...prev };
                if (!isAllowedAttachmentFile(nextAttachment)) {
                    updated.attachment =
                        'Unsupported file type. Allowed: Images, PDF, Word, Excel, Text';
                } else if (nextAttachment.size > MAX_ATTACHMENT_SIZE_BYTES) {
                    updated.attachment = 'Attachment exceeds the 10MB size limit';
                } else {
                    delete updated.attachment;
                }
                return updated;
            });
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (isView) return;

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const headerTitle = isView
        ? t('ticketing.form.viewTitle')
        : isEdit
          ? t('ticketing.form.editTitle')
          : t('ticketing.form.createTitle');

    const headerSubtitle = isView
        ? t('ticketing.form.viewSubtitle', { id: ticket?.ticketId || '' })
        : isEdit
          ? t('ticketing.form.editSubtitle', { id: ticket?.ticketId || '' })
          : t('ticketing.form.createSubtitle');

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isOpen}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Container */}
            <div
                className={`fixed top-0 end-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${
                    isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">
                            {headerTitle}
                        </h2>
                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {headerSubtitle}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 rounded-lg hover:bg-[#F8F6F2] dark:hover:bg-slate-800 transition cursor-pointer"
                        title={t('ticketing.form.close')}
                        aria-label={t('ticketing.form.close')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="awn-ticket-form"
                    ref={formRef}
                    onSubmit={handleFormSubmit}
                    noValidate
                    className="p-6 overflow-y-auto flex-1 space-y-5"
                >
                    {/* 1. Customer * -> searchable dropdown */}
                    <div className="relative" ref={customerDropdownRef}>
                        <label
                            htmlFor="ticket-customer-btn"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('ticketing.form.customer')}{' '}
                            {!isView && <span className="text-[#A23B2A]">*</span>}
                        </label>
                        <button
                            id="ticket-customer-btn"
                            ref={customerButtonRef}
                            type="button"
                            disabled={isView}
                            aria-invalid={Boolean(hasSubmitted && errors.customer)}
                            onClick={() => {
                                if (isView) return;
                                setIsCustomerOpen((prev) => !prev);
                                setIsCompanyOpen(false);
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs text-start flex items-center justify-between transition ${
                                isView
                                    ? 'bg-[#FAF8F5] dark:bg-slate-800/60 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-200 cursor-default'
                                    : hasSubmitted && errors.customer
                                      ? 'bg-white dark:bg-slate-800 border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 cursor-pointer'
                                      : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#F3EFE8] dark:hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] cursor-pointer'
                            }`}
                        >
                            <span
                                className={
                                    selectedCustomerOption
                                        ? 'font-medium text-[#0D0D0D] dark:text-slate-100'
                                        : 'text-[#857E74] dark:text-slate-400'
                                }
                            >
                                {selectedCustomerOption
                                    ? isAr
                                        ? selectedCustomerOption.ar
                                        : selectedCustomerOption.en
                                    : t('ticketing.form.customerPlaceholder')}
                            </span>
                            {!isView && (
                                <ChevronDown size={14} className="text-[#857E74] shrink-0" />
                            )}
                        </button>

                        {isCustomerOpen && !isView && (
                            <div className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                                <div className="p-2 border-b border-[#F0ECE4] dark:border-slate-700 flex items-center gap-2 bg-[#FAF8F5] dark:bg-slate-800/90">
                                    <Search size={14} className="text-[#857E74] shrink-0" />
                                    <input
                                        type="text"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        placeholder={t('ticketing.form.searchCustomer')}
                                        className="w-full bg-transparent text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto py-1 divide-y divide-[#F0ECE4]/60 dark:divide-slate-700/50">
                                    {filteredCustomerOptions.length === 0 ? (
                                        <div className="px-3.5 py-2.5 text-xs text-[#857E74] text-center">
                                            {t('ticketing.form.noCustomerFound')}
                                        </div>
                                    ) : (
                                        filteredCustomerOptions.map((opt) => {
                                            const isSelected = customerValue === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomerValue(opt.value);
                                                        setIsCustomerOpen(false);
                                                        setCustomerSearch('');
                                                        if (hasSubmitted && errors.customer) {
                                                            setErrors((prev) => ({
                                                                ...prev,
                                                                customer: undefined,
                                                            }));
                                                        }
                                                    }}
                                                    className={`w-full px-3.5 py-2 text-xs text-start flex items-center justify-between transition cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-300 font-semibold'
                                                            : 'text-[#0D0D0D] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-700/60'
                                                    }`}
                                                >
                                                    <span>{isAr ? opt.ar : opt.en}</span>
                                                    {isSelected && (
                                                        <Check
                                                            size={14}
                                                            className="text-[#2D3F2C] dark:text-emerald-300 shrink-0"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {hasSubmitted && errors.customer && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {translateError(t, errors.customer)}
                            </span>
                        )}
                    </div>

                    {/* 2. Company * -> searchable dropdown */}
                    <div className="relative" ref={companyDropdownRef}>
                        <label
                            htmlFor="ticket-company-btn"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('ticketing.form.company')}{' '}
                            {!isView && <span className="text-[#A23B2A]">*</span>}
                        </label>
                        <button
                            id="ticket-company-btn"
                            ref={companyButtonRef}
                            type="button"
                            disabled={isView}
                            aria-invalid={Boolean(hasSubmitted && errors.company)}
                            onClick={() => {
                                if (isView) return;
                                setIsCompanyOpen((prev) => !prev);
                                setIsCustomerOpen(false);
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs text-start flex items-center justify-between transition ${
                                isView
                                    ? 'bg-[#FAF8F5] dark:bg-slate-800/60 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-200 cursor-default'
                                    : hasSubmitted && errors.company
                                      ? 'bg-white dark:bg-slate-800 border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 cursor-pointer'
                                      : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#F3EFE8] dark:hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] cursor-pointer'
                            }`}
                        >
                            <span
                                className={
                                    selectedCompanyOption
                                        ? 'font-medium text-[#0D0D0D] dark:text-slate-100'
                                        : 'text-[#857E74] dark:text-slate-400'
                                }
                            >
                                {selectedCompanyOption
                                    ? isAr
                                        ? selectedCompanyOption.ar
                                        : selectedCompanyOption.en
                                    : t('ticketing.form.companyPlaceholder')}
                            </span>
                            {!isView && (
                                <ChevronDown size={14} className="text-[#857E74] shrink-0" />
                            )}
                        </button>

                        {isCompanyOpen && !isView && (
                            <div className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                                <div className="p-2 border-b border-[#F0ECE4] dark:border-slate-700 flex items-center gap-2 bg-[#FAF8F5] dark:bg-slate-800/90">
                                    <Search size={14} className="text-[#857E74] shrink-0" />
                                    <input
                                        type="text"
                                        value={companySearch}
                                        onChange={(e) => setCompanySearch(e.target.value)}
                                        placeholder={t('ticketing.form.searchCompany')}
                                        className="w-full bg-transparent text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto py-1 divide-y divide-[#F0ECE4]/60 dark:divide-slate-700/50">
                                    {filteredCompanyOptions.length === 0 ? (
                                        <div className="px-3.5 py-2.5 text-xs text-[#857E74] text-center">
                                            {t('ticketing.form.noCompanyFound')}
                                        </div>
                                    ) : (
                                        filteredCompanyOptions.map((opt) => {
                                            const isSelected = companyValue === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setCompanyValue(opt.value);
                                                        setIsCompanyOpen(false);
                                                        setCompanySearch('');
                                                        if (hasSubmitted && errors.company) {
                                                            setErrors((prev) => ({
                                                                ...prev,
                                                                company: undefined,
                                                            }));
                                                        }
                                                    }}
                                                    className={`w-full px-3.5 py-2 text-xs text-start flex items-center justify-between transition cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-300 font-semibold'
                                                            : 'text-[#0D0D0D] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-700/60'
                                                    }`}
                                                >
                                                    <span>{isAr ? opt.ar : opt.en}</span>
                                                    {isSelected && (
                                                        <Check
                                                            size={14}
                                                            className="text-[#2D3F2C] dark:text-emerald-300 shrink-0"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {hasSubmitted && errors.company && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {translateError(t, errors.company)}
                            </span>
                        )}
                    </div>

                    {/* 3. Ticket Type -> dropdown, optional & 4. Priority * -> dropdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 3. Ticket Type (Optional) */}
                        <div>
                            <label
                                htmlFor="ticket-type-select"
                                className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                            >
                                {t('ticketing.form.ticketType')}{' '}
                                {!isView && (
                                    <span className="text-[#857E74] font-normal">
                                        {t('common.optional')}
                                    </span>
                                )}
                            </label>
                            {isView ? (
                                <div className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-700 text-xs font-medium text-[#0D0D0D] dark:text-slate-200">
                                    {selectedTicketTypeOption
                                        ? isAr
                                            ? selectedTicketTypeOption.ar
                                            : selectedTicketTypeOption.en
                                        : t('ticketing.form.noTicketType')}
                                </div>
                            ) : (
                                <select
                                    id="ticket-type-select"
                                    value={ticketTypeValue}
                                    onChange={(e) => setTicketTypeValue(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] cursor-pointer transition"
                                >
                                    <option value="">
                                        {t('ticketing.form.ticketTypePlaceholder')}
                                    </option>
                                    {ticketTypeOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {isAr ? opt.ar : opt.en}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* 4. Priority * (Strictly High, Medium, Low) */}
                        <div>
                            <label
                                htmlFor="ticket-priority-select"
                                className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                            >
                                {t('ticketing.form.priority')}{' '}
                                {!isView && <span className="text-[#A23B2A]">*</span>}
                            </label>
                            {isView ? (
                                <div className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-700 text-xs font-medium text-[#0D0D0D] dark:text-slate-200">
                                    {priority === 'High'
                                        ? t('ticketing.priorities.high')
                                        : priority === 'Medium'
                                          ? t('ticketing.priorities.medium')
                                          : priority === 'Low'
                                            ? t('ticketing.priorities.low')
                                            : '—'}
                                </div>
                            ) : (
                                <select
                                    id="ticket-priority-select"
                                    ref={prioritySelectRef}
                                    value={priority}
                                    aria-invalid={Boolean(hasSubmitted && errors.priority)}
                                    onChange={(e) => {
                                        const val = e.target.value as '' | 'High' | 'Medium' | 'Low';
                                        setPriority(val);
                                        if (hasSubmitted && errors.priority && val) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                priority: undefined,
                                            }));
                                        }
                                    }}
                                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition cursor-pointer ${
                                        hasSubmitted && errors.priority
                                            ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                            : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ticketing.form.priorityPlaceholder')}
                                    </option>
                                    {TICKET_PRIORITY_OPTIONS.map((prio) => (
                                        <option key={prio} value={prio}>
                                            {prio === 'High'
                                                ? t('ticketing.priorities.high')
                                                : prio === 'Medium'
                                                  ? t('ticketing.priorities.medium')
                                                  : t('ticketing.priorities.low')}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {hasSubmitted && errors.priority && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {translateError(t, errors.priority)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 5. Subject * -> text input */}
                    <div>
                        <label
                            htmlFor="ticket-subject-input"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('ticketing.form.subject')}{' '}
                            {!isView && <span className="text-[#A23B2A]">*</span>}
                        </label>
                        <input
                            id="ticket-subject-input"
                            ref={subjectInputRef}
                            type="text"
                            readOnly={isView}
                            disabled={isView}
                            value={subject}
                            aria-invalid={Boolean(hasSubmitted && errors.subject)}
                            onChange={(e) => {
                                setSubject(e.target.value);
                                if (hasSubmitted && errors.subject && e.target.value.trim()) {
                                    setErrors((prev) => ({ ...prev, subject: undefined }));
                                }
                            }}
                            placeholder={t('ticketing.form.subjectPlaceholder')}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                isView
                                    ? 'bg-[#FAF8F5] dark:bg-slate-800/60 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-200 cursor-default'
                                    : hasSubmitted && errors.subject
                                      ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                      : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                            }`}
                        />
                        {hasSubmitted && errors.subject && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {translateError(t, errors.subject)}
                            </span>
                        )}
                    </div>

                    {/* 6. Message * -> textarea */}
                    <div>
                        <label
                            htmlFor="ticket-message-textarea"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('ticketing.form.message')}{' '}
                            {!isView && <span className="text-[#A23B2A]">*</span>}
                        </label>
                        <textarea
                            id="ticket-message-textarea"
                            ref={messageTextareaRef}
                            rows={4}
                            readOnly={isView}
                            disabled={isView}
                            value={message}
                            aria-invalid={Boolean(hasSubmitted && errors.message)}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                if (hasSubmitted && errors.message && e.target.value.trim()) {
                                    setErrors((prev) => ({ ...prev, message: undefined }));
                                }
                            }}
                            placeholder={t('ticketing.form.messagePlaceholder')}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition resize-y ${
                                isView
                                    ? 'bg-[#FAF8F5] dark:bg-slate-800/60 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-200 cursor-default'
                                    : hasSubmitted && errors.message
                                      ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                      : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                            }`}
                        />
                        {hasSubmitted && errors.message && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {translateError(t, errors.message)}
                            </span>
                        )}
                    </div>

                    {/* 7. Attachment -> file upload */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                            {t('ticketing.form.attachment')}{' '}
                            {!isView && (
                                <span className="text-[#857E74] font-normal">
                                    {t('common.optional')}
                                </span>
                            )}
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.log,.md"
                            onChange={(e) => handleFileSelect(e.target.files?.[0])}
                            className="hidden"
                        />

                        {isView ? (
                            attachment ? (
                                <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-700">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-300 flex items-center justify-center shrink-0">
                                            <FileText size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p
                                                className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 truncate"
                                                dir="ltr"
                                            >
                                                {attachment.name}
                                            </p>
                                            <p
                                                className="text-[11px] text-[#6E6862] dark:text-slate-400 font-mono"
                                                dir="ltr"
                                            >
                                                {formatFileSizeLatin(attachment.size)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-3.5 py-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#857E74]">
                                    {t('ticketing.form.noAttachment')}
                                </div>
                            )
                        ) : (
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDraggingOver(true);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDraggingOver(false);
                                }}
                                onDrop={handleDrop}
                                className={`rounded-xl border-2 border-dashed p-4 transition text-center ${
                                    hasSubmitted && errors.attachment
                                        ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20'
                                        : isDraggingOver
                                          ? 'border-[#2D3F2C] bg-[#2D3F2C]/5'
                                          : 'border-[#DCD6CD] dark:border-slate-700 bg-[#FAF8F5]/70 dark:bg-slate-800/50 hover:border-[#BFAB93]'
                                }`}
                            >
                                {attachment ? (
                                    <div className="flex items-center justify-between gap-3 text-start">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-9 h-9 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-300 flex items-center justify-center shrink-0">
                                                <FileText size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p
                                                    className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 truncate"
                                                    dir="ltr"
                                                >
                                                    {attachment.name}
                                                </p>
                                                <p
                                                    className="text-[11px] text-[#6E6862] dark:text-slate-400 font-mono"
                                                    dir="ltr"
                                                >
                                                    {formatFileSizeLatin(attachment.size)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                ref={chooseFileBtnRef}
                                                type="button"
                                                aria-invalid={Boolean(
                                                    hasSubmitted && errors.attachment
                                                )}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-200 hover:bg-[#F8F6F2] transition cursor-pointer"
                                            >
                                                {t('ticketing.form.replaceAttachment')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAttachment(null);
                                                    if (hasSubmitted && errors.attachment) {
                                                        setErrors((prev) => ({
                                                            ...prev,
                                                            attachment: undefined,
                                                        }));
                                                    }
                                                }}
                                                className="p-1.5 rounded-lg text-[#A23B2A] hover:bg-[#A23B2A]/10 transition cursor-pointer"
                                                title={t('ticketing.form.removeAttachment')}
                                                aria-label={t('ticketing.form.removeAttachment')}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 py-1">
                                        <div className="w-9 h-9 rounded-full bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-300 flex items-center justify-center mx-auto">
                                            <Upload size={16} />
                                        </div>
                                        <div className="text-xs text-[#595550] dark:text-slate-300">
                                            <span>{t('ticketing.form.dragDropTitle')} </span>
                                            <button
                                                ref={chooseFileBtnRef}
                                                type="button"
                                                aria-invalid={Boolean(
                                                    hasSubmitted && errors.attachment
                                                )}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="font-semibold text-[#2D3F2C] dark:text-emerald-400 underline underline-offset-2 hover:opacity-80 cursor-pointer"
                                            >
                                                {t('ticketing.form.chooseFile')}
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-[#857E74] dark:text-slate-400">
                                            {t('ticketing.form.attachmentHint')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {hasSubmitted && errors.attachment && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {translateError(t, errors.attachment)}
                            </span>
                        )}
                    </div>
                </form>

                {/* Sticky Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-900 flex justify-end gap-2.5 shrink-0">
                    {isView ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                        >
                            {t('ticketing.form.close')}
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                            >
                                {t('ticketing.form.cancel')}
                            </button>
                            <button
                                type="submit"
                                form="awn-ticket-form"
                                className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                            >
                                {isEdit
                                    ? t('ticketing.form.saveEdit')
                                    : t('ticketing.form.saveCreate')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
