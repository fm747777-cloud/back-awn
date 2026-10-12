import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Phone,
    Mail,
    Power,
    ShieldCheck,
    CreditCard,
    FileCheck,
} from 'lucide-react';

export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';
export type ContractType = 'full_time' | 'part_time' | 'contractor';

export interface CustomerEmployeeItem {
    id: string;
    employeeCode: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    departmentId: string;
    departmentNameEn: string;
    departmentNameAr: string;
    nameEn: string;
    nameAr: string;
    jobTitleEn: string;
    jobTitleAr: string;
    nationalityEn: string;
    nationalityAr: string;
    nationalIdOrIqama: string;
    gosiNumber: string;
    contractType: ContractType;
    phone: string;
    email: string;
    status: EmployeeStatus;
    joinDate: string;
    notes?: string;
}

const STORAGE_KEY = 'awn_customer_employees_v1';

const DEMO_COMPANIES = [
    { id: 'cmp-1', code: 'CMP-1001', nameEn: 'Al-Wataniya Logistics Co.', nameAr: 'الشركة الوطنية للخدمات اللوجستية' },
    { id: 'cmp-2', code: 'CMP-1002', nameEn: 'Riyadh Industrial Holdings', nameAr: 'القابضة الصناعية بالرياض' },
    { id: 'cmp-3', code: 'CMP-1003', nameEn: 'Tamweel Capital Partners', nameAr: 'تمويل كابيتال المالية' },
    { id: 'cmp-4', code: 'CMP-1004', nameEn: 'Najm Healthcare Network', nameAr: 'شبكة نجم للرعاية الصحية' },
    { id: 'cmp-5', code: 'CMP-1005', nameEn: 'Horizon Digital Technologies', nameAr: 'تقنيات الأفق الرقمية' },
    { id: 'cmp-6', code: 'CMP-1006', nameEn: 'Red Sea Hospitality & Resorts', nameAr: 'الضيافة والمنتجعات بالبحر الأحمر' },
];

const DEMO_DEPARTMENTS = [
    { id: 'dep-1', companyId: 'cmp-1', nameEn: 'Supply Chain & Fleet Operations', nameAr: 'إدارة سلاسل الإمداد وعمليات الأسطول' },
    { id: 'dep-2', companyId: 'cmp-2', nameEn: 'Plant Engineering & Production', nameAr: 'الهندسة الصناعية وخطوط الإنتاج' },
    { id: 'dep-3', companyId: 'cmp-3', nameEn: 'Corporate Finance & Risk Analysis', nameAr: 'المالية العامة وإدارة المخاطر' },
    { id: 'dep-4', companyId: 'cmp-4', nameEn: 'Medical Compliance & Licensing', nameAr: 'الامتثال الطبي والتراخيص الصحية' },
    { id: 'dep-5', companyId: 'cmp-5', nameEn: 'Cloud Engineering & Cybersecurity', nameAr: 'هندسة السحابة والأمن السيبراني' },
    { id: 'dep-6', companyId: 'cmp-6', nameEn: 'Guest Services & Facility Operations', nameAr: 'خدمات النزلاء وتشغيل المرافق' },
];

const INITIAL_EMPLOYEES: CustomerEmployeeItem[] = [
    {
        id: 'emp-1',
        employeeCode: 'EMP-301',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        departmentId: 'dep-1',
        departmentNameEn: 'Supply Chain & Fleet Operations',
        departmentNameAr: 'إدارة سلاسل الإمداد وعمليات الأسطول',
        nameEn: 'Bandar Al-Harbi',
        nameAr: 'بندر الحربي',
        jobTitleEn: 'Fleet Logistics Specialist',
        jobTitleAr: 'أخصائي لوجستيات الأسطول',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودي',
        nationalIdOrIqama: '1088492011',
        gosiNumber: '90823411',
        contractType: 'full_time',
        phone: '+966 50 119 2831',
        email: 'b.harbi@wataniya-logistics.sa',
        status: 'active',
        joinDate: '2024-03-01',
        notes: 'Lead dispatcher for western province haulage routes.',
    },
    {
        id: 'emp-2',
        employeeCode: 'EMP-302',
        companyId: 'cmp-2',
        companyNameEn: 'Riyadh Industrial Holdings',
        companyNameAr: 'القابضة الصناعية بالرياض',
        departmentId: 'dep-2',
        departmentNameEn: 'Plant Engineering & Production',
        departmentNameAr: 'الهندسة الصناعية وخطوط الإنتاج',
        nameEn: 'Eng. Ahmed Mansour',
        nameAr: 'م. أحمد منصور',
        jobTitleEn: 'Senior Automation Engineer',
        jobTitleAr: 'مهندس أول أتمتة صناعية',
        nationalityEn: 'Egypt',
        nationalityAr: 'مصري',
        nationalIdOrIqama: '2349182044',
        gosiNumber: '71928302',
        contractType: 'full_time',
        phone: '+966 54 991 4022',
        email: 'a.mansour@riyadh-ind.sa',
        status: 'active',
        joinDate: '2023-08-15',
        notes: 'Transferrable Iqama; certified Siemens PLC automation systems.',
    },
    {
        id: 'emp-3',
        employeeCode: 'EMP-303',
        companyId: 'cmp-3',
        companyNameEn: 'Tamweel Capital Partners',
        companyNameAr: 'تمويل كابيتال المالية',
        departmentId: 'dep-3',
        departmentNameEn: 'Corporate Finance & Risk Analysis',
        departmentNameAr: 'المالية العامة وإدارة المخاطر',
        nameEn: 'Sara Al-Ghamdi',
        nameAr: 'سارة الغامدي',
        jobTitleEn: 'Financial Compliance Auditor',
        jobTitleAr: 'مدقق امتثال مالي',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودية',
        nationalIdOrIqama: '1099238192',
        gosiNumber: '88192033',
        contractType: 'full_time',
        phone: '+966 55 421 8839',
        email: 's.ghamdi@tamweel-capital.sa',
        status: 'active',
        joinDate: '2025-01-10',
        notes: 'SOCPA certified; oversees corporate governance compliance.',
    },
    {
        id: 'emp-4',
        employeeCode: 'EMP-304',
        companyId: 'cmp-4',
        companyNameEn: 'Najm Healthcare Network',
        companyNameAr: 'شبكة نجم للرعاية الصحية',
        departmentId: 'dep-4',
        departmentNameEn: 'Medical Compliance & Licensing',
        departmentNameAr: 'الامتثال الطبي والتراخيص الصحية',
        nameEn: 'Dr. Ziyad Al-Farhan',
        nameAr: 'د. زياد الفرحان',
        jobTitleEn: 'Clinical Quality Consultant',
        jobTitleAr: 'استشاري جودة سريرية',
        nationalityEn: 'Jordan',
        nationalityAr: 'أردني',
        nationalIdOrIqama: '2418902311',
        gosiNumber: '66281944',
        contractType: 'contractor',
        phone: '+966 56 312 9011',
        email: 'z.farhan@najm-health.sa',
        status: 'active',
        joinDate: '2024-11-01',
        notes: 'SCFHS licensed medical consultant.',
    },
    {
        id: 'emp-5',
        employeeCode: 'EMP-305',
        companyId: 'cmp-5',
        companyNameEn: 'Horizon Digital Technologies',
        companyNameAr: 'تقنيات الأفق الرقمية',
        departmentId: 'dep-5',
        departmentNameEn: 'Cloud Engineering & Cybersecurity',
        departmentNameAr: 'هندسة السحابة والأمن السيبراني',
        nameEn: 'Nasser Al-Subaie',
        nameAr: 'ناصر السبيعي',
        jobTitleEn: 'Senior SecOps Specialist',
        jobTitleAr: 'أخصائي أول أمن المعلومات',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودي',
        nationalIdOrIqama: '1072938101',
        gosiNumber: '55192034',
        contractType: 'full_time',
        phone: '+966 53 881 2940',
        email: 'n.subaie@horizon-tech.sa',
        status: 'on_leave',
        joinDate: '2024-05-15',
        notes: 'On annual paternity leave until end of month.',
    },
    {
        id: 'emp-6',
        employeeCode: 'EMP-306',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        departmentId: 'dep-6',
        departmentNameEn: 'Guest Services & Facility Operations',
        departmentNameAr: 'خدمات النزلاء وتشغيل المرافق',
        nameEn: 'Hassan Al-Baqami',
        nameAr: 'حسن البقمي',
        jobTitleEn: 'Site Operations Supervisor',
        jobTitleAr: 'مشرف عمليات الموقع',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودي',
        nationalIdOrIqama: '1061829032',
        gosiNumber: '44819201',
        contractType: 'full_time',
        phone: '+966 59 123 7744',
        email: 'h.baqami@redsea-hospitality.sa',
        status: 'inactive',
        joinDate: '2023-10-01',
        notes: 'Resigned and cleared GOSI termination filing.',
    },
];

export const CustomerEmployeesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in localStorage
    const [employees, setEmployees] = useState<CustomerEmployeeItem[]>(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            }
        } catch {
            // fallback
        }
        return INITIAL_EMPLOYEES;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
            }
        } catch {
            // ignore
        }
    }, [employees]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | EmployeeStatus>('all');
    const [contractFilter, setContractFilter] = useState<'all' | ContractType>('all');
    const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');

    // Modals & Drawer
    const [viewingEmployee, setViewingEmployee] = useState<CustomerEmployeeItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        employeeCode: '',
        companyId: DEMO_COMPANIES[0].id,
        departmentId: DEMO_DEPARTMENTS[0].id,
        nameEn: '',
        nameAr: '',
        jobTitleEn: '',
        jobTitleAr: '',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودي',
        nationalIdOrIqama: '',
        gosiNumber: '',
        contractType: 'full_time' as ContractType,
        phone: '+966 5',
        email: '',
        status: 'active' as EmployeeStatus,
        joinDate: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        code?: string;
        nationalId?: string;
        email?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered employees
    const filteredEmployees = useMemo(() => {
        const query = search.trim().toLowerCase();
        return employees.filter((emp) => {
            const matchesQuery =
                !query ||
                emp.employeeCode.toLowerCase().includes(query) ||
                emp.nameEn.toLowerCase().includes(query) ||
                emp.nameAr.includes(search.trim()) ||
                emp.jobTitleEn.toLowerCase().includes(query) ||
                emp.jobTitleAr.includes(search.trim()) ||
                emp.nationalIdOrIqama.includes(query) ||
                emp.email.toLowerCase().includes(query) ||
                emp.phone.includes(query) ||
                emp.companyNameEn.toLowerCase().includes(query) ||
                emp.companyNameAr.includes(search.trim());

            const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
            const matchesContract = contractFilter === 'all' || emp.contractType === contractFilter;
            const matchesCompany = companyFilter === 'all' || emp.companyId === companyFilter;

            return matchesQuery && matchesStatus && matchesContract && matchesCompany;
        });
    }, [employees, search, statusFilter, contractFilter, companyFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = employees.length;
        const active = employees.filter((e) => e.status === 'active').length;
        const saudiCount = employees.filter(
            (e) =>
                e.nationalityEn.toLowerCase().includes('saudi') ||
                e.nationalityAr.includes('سعود') ||
                e.nationalIdOrIqama.startsWith('1')
        ).length;
        const saudizationRate = total > 0 ? Math.round((saudiCount / total) * 100) : 0;
        const contractors = employees.filter((e) => e.contractType === 'contractor').length;

        return {
            total,
            active,
            saudizationRate,
            contractors,
        };
    }, [employees]);

    // Toggle status
    const handleToggleStatus = (id: string) => {
        setEmployees((prev) =>
            prev.map((e) => {
                if (e.id === id) {
                    const newStatus: EmployeeStatus = e.status === 'active' ? 'inactive' : 'active';
                    return { ...e, status: newStatus };
                }
                return e;
            })
        );
        if (viewingEmployee && viewingEmployee.id === id) {
            setViewingEmployee((prev) =>
                prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
            );
        }
        showToast(t('customer.pages.employees.feedback.statusToggled'));
    };

    // Start Add
    const handleStartAdd = () => {
        const nextNum = employees.length + 301;
        setEditingEmployeeId(null);
        setFormErrors({});
        setFormData({
            employeeCode: `EMP-${nextNum}`,
            companyId: DEMO_COMPANIES[0].id,
            departmentId: DEMO_DEPARTMENTS[0].id,
            nameEn: '',
            nameAr: '',
            jobTitleEn: '',
            jobTitleAr: '',
            nationalityEn: 'Saudi Arabia',
            nationalityAr: 'سعودي',
            nationalIdOrIqama: '',
            gosiNumber: '',
            contractType: 'full_time',
            phone: '+966 5',
            email: '',
            status: 'active',
            joinDate: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (item: CustomerEmployeeItem) => {
        setEditingEmployeeId(item.id);
        setFormErrors({});
        setFormData({
            employeeCode: item.employeeCode,
            companyId: item.companyId,
            departmentId: item.departmentId,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            jobTitleEn: item.jobTitleEn,
            jobTitleAr: item.jobTitleAr,
            nationalityEn: item.nationalityEn,
            nationalityAr: item.nationalityAr,
            nationalIdOrIqama: item.nationalIdOrIqama,
            gosiNumber: item.gosiNumber || '',
            contractType: item.contractType,
            phone: item.phone,
            email: item.email,
            status: item.status,
            joinDate: item.joinDate,
            notes: item.notes || '',
        });
        setViewingEmployee(null);
        setIsFormModalOpen(true);
    };

    // Save Form
    const handleSaveEmployee = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { name?: string; code?: string; nationalId?: string; email?: string } = {};
        if (!formData.nameEn.trim() && !formData.nameAr.trim()) {
            errors.name = t('customer.pages.employees.modal.validationName');
        }
        if (!formData.employeeCode.trim()) {
            errors.code = t('customer.pages.employees.modal.validationCode');
        }
        if (!formData.nationalIdOrIqama.trim()) {
            errors.nationalId = t('customer.pages.employees.modal.validationNationalId');
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            errors.email = t('customer.pages.employees.modal.validationEmail');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const comp = DEMO_COMPANIES.find((c) => c.id === formData.companyId) || DEMO_COMPANIES[0];
        const dept = DEMO_DEPARTMENTS.find((d) => d.id === formData.departmentId) || DEMO_DEPARTMENTS[0];

        if (editingEmployeeId) {
            setEmployees((prev) =>
                prev.map((e) => {
                    if (e.id === editingEmployeeId) {
                        return {
                            ...e,
                            employeeCode: formData.employeeCode.trim() || e.employeeCode,
                            companyId: comp.id,
                            companyNameEn: comp.nameEn,
                            companyNameAr: comp.nameAr,
                            departmentId: dept.id,
                            departmentNameEn: dept.nameEn,
                            departmentNameAr: dept.nameAr,
                            nameEn: formData.nameEn.trim() || e.nameEn,
                            nameAr: formData.nameAr.trim() || e.nameAr,
                            jobTitleEn: formData.jobTitleEn.trim() || e.jobTitleEn,
                            jobTitleAr: formData.jobTitleAr.trim() || e.jobTitleAr,
                            nationalityEn: formData.nationalityEn.trim() || e.nationalityEn,
                            nationalityAr: formData.nationalityAr.trim() || e.nationalityAr,
                            nationalIdOrIqama: formData.nationalIdOrIqama.trim(),
                            gosiNumber: formData.gosiNumber.trim(),
                            contractType: formData.contractType,
                            phone: formData.phone.trim(),
                            email: formData.email.trim(),
                            status: formData.status,
                            joinDate: formData.joinDate,
                            notes: formData.notes.trim(),
                        };
                    }
                    return e;
                })
            );
            showToast(t('customer.pages.employees.feedback.employeeUpdated'));
        } else {
            const newEmp: CustomerEmployeeItem = {
                id: `emp-${Date.now()}`,
                employeeCode: formData.employeeCode.trim() || `EMP-${employees.length + 301}`,
                companyId: comp.id,
                companyNameEn: comp.nameEn,
                companyNameAr: comp.nameAr,
                departmentId: dept.id,
                departmentNameEn: dept.nameEn,
                departmentNameAr: dept.nameAr,
                nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim(),
                jobTitleEn: formData.jobTitleEn.trim() || formData.jobTitleAr.trim(),
                jobTitleAr: formData.jobTitleAr.trim() || formData.jobTitleEn.trim(),
                nationalityEn: formData.nationalityEn.trim() || 'Saudi Arabia',
                nationalityAr: formData.nationalityAr.trim() || 'سعودي',
                nationalIdOrIqama: formData.nationalIdOrIqama.trim(),
                gosiNumber: formData.gosiNumber.trim(),
                contractType: formData.contractType,
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                status: formData.status,
                joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
                notes: formData.notes.trim(),
            };
            setEmployees((prev) => [newEmp, ...prev]);
            showToast(t('customer.pages.employees.feedback.employeeAdded'));
        }

        setIsFormModalOpen(false);
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#265938] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#EAF3EC] dark:bg-emerald-950/40 rounded-xl text-[#265938] dark:text-emerald-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    {t('customer.pages.employees.title')}
                                </h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                                    CST-EMP
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {t('customer.pages.employees.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={handleStartAdd}
                        className="bg-[#265938] hover:bg-[#1E472D] text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('customer.pages.employees.addEmployee')}</span>
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.employees.kpis.totalEmployees')}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/50 flex items-center justify-center text-[#265938] dark:text-emerald-400">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.employees.kpis.activeWorkforce')}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {kpis.active}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.employees.kpis.saudizationRate')}
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {kpis.saudizationRate}%
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.employees.kpis.contractors')}
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                            {kpis.contractors}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <FileCheck className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 start-3" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('customer.pages.employees.searchPlaceholder')}
                            className="w-full ps-9 pe-9 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        >
                            <option value="all">{t('customer.pages.employees.statusAll')}</option>
                            <option value="active">{t('customer.pages.employees.statusActive')}</option>
                            <option value="on_leave">{t('customer.pages.employees.statusOnLeave')}</option>
                            <option value="inactive">{t('customer.pages.employees.statusInactive')}</option>
                        </select>

                        {/* Contract Type Filter */}
                        <select
                            value={contractFilter}
                            onChange={(e) => setContractFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        >
                            <option value="all">{t('customer.pages.employees.contractAll')}</option>
                            <option value="full_time">{t('customer.pages.employees.contracts.full_time')}</option>
                            <option value="part_time">{t('customer.pages.employees.contracts.part_time')}</option>
                            <option value="contractor">{t('customer.pages.employees.contracts.contractor')}</option>
                        </select>

                        {/* Company Filter */}
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        >
                            <option value="all">{t('customer.pages.employees.companyAll')}</option>
                            {DEMO_COMPANIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {isRtl ? c.nameAr : c.nameEn}
                                </option>
                            ))}
                        </select>

                        {(search || statusFilter !== 'all' || contractFilter !== 'all' || companyFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                    setContractFilter('all');
                                    setCompanyFilter('all');
                                }}
                                className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{t('customer.pages.employees.feedback.resetFilters')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs">
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.employees.table.code')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.employees.table.employeeName')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.employees.table.companyDepartment')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.employees.table.iqamaId')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.employees.table.contact')}
                                </th>
                                <th className="px-4 py-3 text-center font-semibold">
                                    {t('customer.pages.employees.table.contract')}
                                </th>
                                <th className="px-4 py-3 text-center font-semibold">
                                    {t('customer.pages.employees.table.status')}
                                </th>
                                <th className="px-4 py-3 text-end font-semibold">
                                    {t('customer.pages.employees.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Users className="w-8 h-8 text-gray-400" />
                                            <p>{t('customer.pages.employees.feedback.noResults')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr
                                        key={emp.id}
                                        className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono font-medium text-xs text-gray-900 dark:text-gray-200">
                                            {emp.employeeCode}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {isRtl ? emp.nameAr : emp.nameEn}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {isRtl ? emp.jobTitleAr : emp.jobTitleEn}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div className="font-medium text-xs text-gray-900 dark:text-gray-200 truncate max-w-[190px]">
                                                {isRtl ? emp.companyNameAr : emp.companyNameEn}
                                            </div>
                                            <div className="text-[11px] text-gray-500 truncate max-w-[190px]">
                                                {isRtl ? emp.departmentNameAr : emp.departmentNameEn}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{emp.nationalIdOrIqama}</span>
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                {isRtl ? emp.nationalityAr : emp.nationalityEn}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                <span dir="ltr">{emp.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5 text-gray-400 truncate max-w-[170px]">
                                                <Mail className="w-3 h-3" />
                                                <span>{emp.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    emp.contractType === 'full_time'
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                        : emp.contractType === 'contractor'
                                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {t(`customer.pages.employees.contracts.${emp.contractType}`)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    emp.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : emp.status === 'on_leave'
                                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                {emp.status === 'active' ? (
                                                    <CheckCircle2 className="w-3 h-3" />
                                                ) : (
                                                    <XCircle className="w-3 h-3" />
                                                )}
                                                <span>{t(`customer.pages.employees.status_${emp.status}`)}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setViewingEmployee(emp)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title={t('customer.pages.employees.table.view')}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStartEdit(emp)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title={t('customer.pages.employees.table.edit')}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(emp.id)}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        emp.status === 'active'
                                                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40'
                                                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                    }`}
                                                    title={
                                                        emp.status === 'active'
                                                            ? t('customer.pages.employees.table.deactivate')
                                                            : t('customer.pages.employees.table.activate')
                                                    }
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Drawer */}
            {viewingEmployee && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slideLeft">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-[#EAF3EC] dark:bg-emerald-950/40 rounded-lg text-[#265938] dark:text-emerald-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        {t('customer.pages.employees.details.title')}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-mono">{viewingEmployee.employeeCode}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingEmployee(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="py-5 space-y-5 flex-1">
                            <div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                    {isRtl ? viewingEmployee.nameAr : viewingEmployee.nameEn}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isRtl ? viewingEmployee.jobTitleAr : viewingEmployee.jobTitleEn}
                                </p>
                            </div>

                            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.employees.table.company')}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {isRtl ? viewingEmployee.companyNameAr : viewingEmployee.companyNameEn}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.employees.table.department')}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {isRtl ? viewingEmployee.departmentNameAr : viewingEmployee.departmentNameEn}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.employees.table.iqamaId')}</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                                        {viewingEmployee.nationalIdOrIqama}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.employees.details.gosiNumber')}</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">
                                        {viewingEmployee.gosiNumber || '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.employees.details.nationality')}</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {isRtl ? viewingEmployee.nationalityAr : viewingEmployee.nationalityEn}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.employees.details.joinDate')}</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                                        {viewingEmployee.joinDate}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-500">{t('customer.pages.employees.table.status')}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            viewingEmployee.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : viewingEmployee.status === 'on_leave'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        {t(`customer.pages.employees.status_${viewingEmployee.status}`)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    {t('customer.pages.employees.details.contactChannels')}
                                </h5>
                                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        <span dir="ltr">{viewingEmployee.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{viewingEmployee.email}</span>
                                    </div>
                                </div>
                            </div>

                            {viewingEmployee.notes && (
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        {t('customer.pages.employees.details.notes')}
                                    </h5>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                                        {viewingEmployee.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <button
                                onClick={() => handleStartEdit(viewingEmployee)}
                                className="flex-1 bg-[#265938] hover:bg-[#1E472D] text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {t('customer.pages.employees.details.edit')}
                            </button>
                            <button
                                onClick={() => handleToggleStatus(viewingEmployee.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                                    viewingEmployee.status === 'active'
                                        ? 'border-red-300 text-red-600 hover:bg-red-50'
                                        : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                                }`}
                            >
                                {viewingEmployee.status === 'active'
                                    ? t('customer.pages.employees.table.deactivate')
                                    : t('customer.pages.employees.table.activate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-scaleUp">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                    {editingEmployeeId
                                        ? t('customer.pages.employees.modal.editTitle')
                                        : t('customer.pages.employees.modal.addTitle')}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {editingEmployeeId
                                        ? t('customer.pages.employees.modal.editSubtitle')
                                        : t('customer.pages.employees.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.code')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.employeeCode}
                                        onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#265938]"
                                        placeholder="EMP-301"
                                    />
                                    {formErrors.code && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.company')} *
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    >
                                        {DEMO_COMPANIES.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {isRtl ? c.nameAr : c.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.department')} *
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    >
                                        {DEMO_DEPARTMENTS.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {isRtl ? d.nameAr : d.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.contractType')}
                                    </label>
                                    <select
                                        value={formData.contractType}
                                        onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    >
                                        <option value="full_time">{t('customer.pages.employees.contracts.full_time')}</option>
                                        <option value="part_time">{t('customer.pages.employees.contracts.part_time')}</option>
                                        <option value="contractor">{t('customer.pages.employees.contracts.contractor')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.nameAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="بندر الحربي"
                                        dir="rtl"
                                    />
                                    {formErrors.name && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.nameEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="Bandar Al-Harbi"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.jobTitleAr')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.jobTitleAr}
                                        onChange={(e) => setFormData({ ...formData, jobTitleAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="أخصائي لوجستيات"
                                        dir="rtl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.jobTitleEn')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.jobTitleEn}
                                        onChange={(e) => setFormData({ ...formData, jobTitleEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="Logistics Specialist"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.nationalId')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nationalIdOrIqama}
                                        onChange={(e) => setFormData({ ...formData, nationalIdOrIqama: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#265938]"
                                        placeholder="1088492011"
                                    />
                                    {formErrors.nationalId && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.nationalId}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.gosiNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.gosiNumber}
                                        onChange={(e) => setFormData({ ...formData, gosiNumber: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#265938]"
                                        placeholder="90823411"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.phone')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="+966 50 119 2831"
                                        dir="ltr"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.email')} *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="b.harbi@domain.sa"
                                        dir="ltr"
                                    />
                                    {formErrors.email && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.status')}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    >
                                        <option value="active">{t('customer.pages.employees.statusActive')}</option>
                                        <option value="on_leave">{t('customer.pages.employees.statusOnLeave')}</option>
                                        <option value="inactive">{t('customer.pages.employees.statusInactive')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.employees.modal.joinDate')}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.joinDate}
                                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                                >
                                    {t('customer.pages.employees.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#265938] hover:bg-[#1E472D] text-white text-sm font-medium transition-colors"
                                >
                                    {t('customer.pages.employees.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
