export type RequestServiceStatus = 'Active' | 'Inactive';

export interface RequestBusinessOwnerOption {
    id: string;
    nameEn: string;
    nameAr: string;
    email: string;
    companyIds: string[];
}

export interface RequestCompanyOption {
    id: string;
    name: string;
    nameEn: string;
    nameAr: string;
    ownerId: string;
    ownerNameEn: string;
    ownerNameAr: string;
    crNumber: string;
}

export interface RequestServiceGroupOption {
    id: string;
    nameEn: string;
    nameAr: string;
}

export interface RequestCatalogServiceOption {
    id: string;
    nameEn: string;
    nameAr: string;
    groupId: string;
    groupNameEn: string;
    groupNameAr: string;
}

export interface RequestServiceRecord {
    id: string;
    code: string;
    ownerId: string;
    ownerNameEn: string;
    ownerNameAr: string;
    companyId: string;
    companyName: string;
    companyNameAr: string;
    packageName: string;
    packageNameAr: string;
    serviceGroups: string[];
    serviceGroupsAr: string[];
    selectedServices: string[];
    selectedServicesAr: string[];
    createdDate: string;
    status: RequestServiceStatus;
}

export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface InitiatedRequestPayload {
    id: string;
    requestCode: string;
    serviceRecordId: string;
    ownerId: string;
    ownerName: string;
    companyId: string;
    companyName: string;
    packageName: string;
    serviceGroup: string;
    serviceName: string;
    requestTitle: string;
    beneficiaryName: string;
    priority: RequestPriority;
    requestedDueDate: string;
    notes: string;
    status: 'Initiated';
    createdAt: string;
}

// ============================================================================
// Interconnected Business Owners & Companies Catalog
// ============================================================================

export const REQUEST_BUSINESS_OWNERS: RequestBusinessOwnerOption[] = [
    {
        id: 'owner-1',
        nameEn: 'Njoud Al-Qahtani',
        nameAr: 'نجود القحطاني',
        email: 'njoud.qahtani@awn.sa',
        companyIds: ['comp-njoud-ar', 'comp-njoud-en'],
    },
    {
        id: 'owner-2',
        nameEn: 'Tariq Al-Mansoor',
        nameAr: 'طارق المنصور',
        email: 'tariq.mansoor@dezen.sa',
        companyIds: ['comp-dezen', 'comp-spring'],
    },
    {
        id: 'owner-3',
        nameEn: 'Abdullah Al-Ghamdi',
        nameAr: 'عبدالله الغامدي',
        email: 'a.ghamdi@coffee7.sa',
        companyIds: ['comp-coffee7', 'comp-faisaliah'],
    },
    {
        id: 'owner-4',
        nameEn: 'Sultan Al-Harbi',
        nameAr: 'سلطان الحربي',
        email: 'sultan.harbi@najd.sa',
        companyIds: ['comp-najd', 'comp-yamamah'],
    },
    {
        id: 'owner-5',
        nameEn: 'Noura Al-Shammari',
        nameAr: 'نورة الشمري',
        email: 'noura.shammari@tuwaiq.sa',
        companyIds: ['comp-tuwaiq', 'comp-gulf'],
    },
    {
        id: 'owner-6',
        nameEn: 'Khalid Al-Otaibi',
        nameAr: 'خالد العتيبي',
        email: 'khalid.otaibi@awn-ent.sa',
        companyIds: ['comp-awn', 'comp-riyadh-tech'],
    },
];

export const REQUEST_COMPANIES: RequestCompanyOption[] = [
    {
        id: 'comp-dezen',
        name: 'dezen company',
        nameEn: 'dezen company',
        nameAr: 'شركة ديزن (dezen company)',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        crNumber: '1010845120',
    },
    {
        id: 'comp-spring',
        name: 'Testing Spring 1',
        nameEn: 'Testing Spring 1',
        nameAr: 'Testing Spring 1',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        crNumber: '1010912340',
    },
    {
        id: 'comp-njoud-ar',
        name: 'نجود تيست',
        nameEn: 'نجود تيست',
        nameAr: 'نجود تيست',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        crNumber: '1010734891',
    },
    {
        id: 'comp-njoud-en',
        name: 'njoud test com',
        nameEn: 'njoud test com',
        nameAr: 'njoud test com',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        crNumber: '1010734892',
    },
    {
        id: 'comp-coffee7',
        name: 'مؤسسة قهوة السابعة',
        nameEn: 'مؤسسة قهوة السابعة (Seventh Coffee Est.)',
        nameAr: 'مؤسسة قهوة السابعة',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        crNumber: '1010621984',
    },
    {
        id: 'comp-faisaliah',
        name: 'Al Faisaliah Holding Group',
        nameEn: 'Al Faisaliah Holding Group',
        nameAr: 'مجموعة الفيصلية القابضة',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        crNumber: '1010411209',
    },
    {
        id: 'comp-najd',
        name: 'Najd Integrated Solutions',
        nameEn: 'Najd Integrated Solutions',
        nameAr: 'شركة نجد للحلول المتكاملة',
        ownerId: 'owner-4',
        ownerNameEn: 'Sultan Al-Harbi',
        ownerNameAr: 'سلطان الحربي',
        crNumber: '1010539812',
    },
    {
        id: 'comp-yamamah',
        name: 'Al Yamamah Contracting Est.',
        nameEn: 'Al Yamamah Contracting Est.',
        nameAr: 'مؤسسة اليمامة للمقاولات',
        ownerId: 'owner-4',
        ownerNameEn: 'Sultan Al-Harbi',
        ownerNameAr: 'سلطان الحربي',
        crNumber: '1010389214',
    },
    {
        id: 'comp-tuwaiq',
        name: 'Tuwaiq Logistics Co.',
        nameEn: 'Tuwaiq Logistics Co.',
        nameAr: 'شركة طويق للخدمات اللوجستية',
        ownerId: 'owner-5',
        ownerNameEn: 'Noura Al-Shammari',
        ownerNameAr: 'نورة الشمري',
        crNumber: '1010678341',
    },
    {
        id: 'comp-gulf',
        name: 'Gulf Industrial Supplies',
        nameEn: 'Gulf Industrial Supplies',
        nameAr: 'شركة الخليج للتوريدات الصناعية',
        ownerId: 'owner-5',
        ownerNameEn: 'Noura Al-Shammari',
        ownerNameAr: 'نورة الشمري',
        crNumber: '1010592103',
    },
    {
        id: 'comp-awn',
        name: 'AWN Administrative Services',
        nameEn: 'AWN Administrative Services',
        nameAr: 'شركة عون للخدمات الإدارية',
        ownerId: 'owner-6',
        ownerNameEn: 'Khalid Al-Otaibi',
        ownerNameAr: 'خالد العتيبي',
        crNumber: '1010200145',
    },
    {
        id: 'comp-riyadh-tech',
        name: 'Riyadh Tech Solutions',
        nameEn: 'Riyadh Tech Solutions',
        nameAr: 'مؤسسة الرياض للحلول التقنية',
        ownerId: 'owner-6',
        ownerNameEn: 'Khalid Al-Otaibi',
        ownerNameAr: 'خالد العتيبي',
        crNumber: '1010884310',
    },
];

// ============================================================================
// Packages, Service Groups & Selected Services Options
// ============================================================================

export const REQUEST_PACKAGE_PRESETS: Array<{ nameEn: string; nameAr: string }> = [
    { nameEn: 'موظفين باقة اساسية', nameAr: 'موظفين باقة اساسية' },
    { nameEn: 'Asset Onboarding', nameAr: 'تأهيل وتسجيل الأصول (Asset Onboarding)' },
    { nameEn: 'Business onboarding', nameAr: 'تأسيس وتأهيل المنشآت (Business onboarding)' },
    { nameEn: 'موظف غير سعودي باقة مخفضة', nameAr: 'موظف غير سعودي باقة مخفضة' },
    { nameEn: 'ادارة السجل التجاري باقة اساسية', nameAr: 'ادارة السجل التجاري باقة اساسية' },
    { nameEn: 'موظف سعودي باقة عادية', nameAr: 'موظف سعودي باقة عادية' },
];

export const REQUEST_SERVICE_GROUPS: RequestServiceGroupOption[] = [
    {
        id: 'sg-emp-onboarding',
        nameEn: 'Employee Onboarding & GOSI',
        nameAr: 'تأهيل الموظفين والتأمينات الاجتماعية',
    },
    {
        id: 'sg-muqeem-iqama',
        nameEn: 'Muqeem & Iqama Operations',
        nameAr: 'خدمات مقيم والإقامات والتأشيرات',
    },
    {
        id: 'sg-cr-commerce',
        nameEn: 'Commercial Registration & Ministry of Commerce',
        nameAr: 'إدارة السجل التجاري ووزارة التجارة',
    },
    {
        id: 'sg-qiwa-labor',
        nameEn: 'Qiwa & Labor Office Contracts',
        nameAr: 'منصة قوى وتوثيق عقود العمل',
    },
    {
        id: 'sg-municipal-baladi',
        nameEn: 'Municipal & Baladi Licensing',
        nameAr: 'التراخيص البلدية ومنصة بلدي',
    },
    {
        id: 'sg-assets-fleet',
        nameEn: 'Assets & Fleet Registration',
        nameAr: 'إدارة الأصول وتسجيل المركبات',
    },
    {
        id: 'sg-mudad-payroll',
        nameEn: 'Mudad & Wage Protection (WPS)',
        nameAr: 'منصة مدد ونظام حماية الأجور',
    },
    {
        id: 'sg-zatca-compliance',
        nameEn: 'ZATCA & Chamber of Commerce',
        nameAr: 'هيئة الزكاة والضريبة والغرفة التجارية',
    },
];

export const REQUEST_CATALOG_SERVICES: RequestCatalogServiceOption[] = [
    {
        id: 'srv-gosi-reg',
        nameEn: 'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
        nameAr: 'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
        groupId: 'sg-emp-onboarding',
        groupNameEn: 'Employee Onboarding & GOSI',
        groupNameAr: 'تأهيل الموظفين والتأمينات الاجتماعية',
    },
    {
        id: 'srv-qiwa-contract',
        nameEn: 'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
        nameAr: 'توثيق عقد عمل موحد في منصة قوى',
        groupId: 'sg-qiwa-labor',
        groupNameEn: 'Qiwa & Labor Office Contracts',
        groupNameAr: 'منصة قوى وتوثيق عقود العمل',
    },
    {
        id: 'srv-medical-ins',
        nameEn: 'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
        nameAr: 'إصدار وربط التأمين الطبي التعاوني للموظفين',
        groupId: 'sg-emp-onboarding',
        groupNameEn: 'Employee Onboarding & GOSI',
        groupNameAr: 'تأهيل الموظفين والتأمينات الاجتماعية',
    },
    {
        id: 'srv-iqama-issue',
        nameEn: 'New Iqama Issuance & Renewal via Muqeem (إصدار وتجديد الإقامة عبر مقيم)',
        nameAr: 'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
        groupId: 'sg-muqeem-iqama',
        groupNameEn: 'Muqeem & Iqama Operations',
        groupNameAr: 'خدمات مقيم والإقامات والتأشيرات',
    },
    {
        id: 'srv-exit-reentry',
        nameEn: 'Exit & Re-Entry Visa Issuance (إصدار تأشيرة خروج وعودة)',
        nameAr: 'إصدار وتمديد تأشيرة خروج وعودة إلكترونية',
        groupId: 'sg-muqeem-iqama',
        groupNameEn: 'Muqeem & Iqama Operations',
        groupNameAr: 'خدمات مقيم والإقامات والتأشيرات',
    },
    {
        id: 'srv-work-permit',
        nameEn: 'Work Permit Issuance & SADAD Fee Calculation (إصدار رخصة عمل وحساب المقابل المالي)',
        nameAr: 'إصدار وتجديد رخصة العمل وحساب المقابل المالي',
        groupId: 'sg-qiwa-labor',
        groupNameEn: 'Qiwa & Labor Office Contracts',
        groupNameAr: 'منصة قوى وتوثيق عقود العمل',
    },
    {
        id: 'srv-cr-issue',
        nameEn: 'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
        nameAr: 'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
        groupId: 'sg-cr-commerce',
        groupNameEn: 'Commercial Registration & Ministry of Commerce',
        groupNameAr: 'إدارة السجل التجاري ووزارة التجارة',
    },
    {
        id: 'srv-cr-amend',
        nameEn: 'CR Activity & Signatory Amendment (تعديل أنشطة السجل التجاري والمفوضين)',
        nameAr: 'تعديل أنشطة السجل التجاري وتحديث بيانات المفوضين',
        groupId: 'sg-cr-commerce',
        groupNameEn: 'Commercial Registration & Ministry of Commerce',
        groupNameAr: 'إدارة السجل التجاري ووزارة التجارة',
    },
    {
        id: 'srv-chamber-sub',
        nameEn: 'Chamber of Commerce Membership Renewal (تجديد اشتراك الغرفة التجارية)',
        nameAr: 'تجديد اشتراك الغرفة التجارية وتصديق الوثائق',
        groupId: 'sg-zatca-compliance',
        groupNameEn: 'ZATCA & Chamber of Commerce',
        groupNameAr: 'هيئة الزكاة والضريبة والغرفة التجارية',
    },
    {
        id: 'srv-baladi-license',
        nameEn: 'Baladi Commercial License Issuance & Renewal (إصدار وتجديد رخصة بلدي)',
        nameAr: 'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
        groupId: 'sg-municipal-baladi',
        groupNameEn: 'Municipal & Baladi Licensing',
        groupNameAr: 'التراخيص البلدية ومنصة بلدي',
    },
    {
        id: 'srv-civil-defense',
        nameEn: 'Salamah Civil Defense Safety Certificate (شهادة السلامة من الدفاع المدني - سلامة)',
        nameAr: 'إصدار وتجديد ترخيص السلامة من الدفاع المدني (سلامة)',
        groupId: 'sg-municipal-baladi',
        groupNameEn: 'Municipal & Baladi Licensing',
        groupNameAr: 'التراخيص البلدية ومنصة بلدي',
    },
    {
        id: 'srv-vehicle-reg',
        nameEn: 'Fleet Vehicle Istimara & TGA Operation Card (تسجيل المركبات وإصدار كرت التشغيل)',
        nameAr: 'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
        groupId: 'sg-assets-fleet',
        groupNameEn: 'Assets & Fleet Registration',
        groupNameAr: 'إدارة الأصول وتسجيل المركبات',
    },
    {
        id: 'srv-vehicle-ins',
        nameEn: 'Commercial Fleet Comprehensive Insurance (تأمين أسطول المركبات التجارية)',
        nameAr: 'إصدار وربط وثيقة تأمين المركبات والأسطول التجاري',
        groupId: 'sg-assets-fleet',
        groupNameEn: 'Assets & Fleet Registration',
        groupNameAr: 'إدارة الأصول وتسجيل المركبات',
    },
    {
        id: 'srv-mudad-wps',
        nameEn: 'Mudad Payroll SIF Upload & WPS Compliance (رفع ملفات حماية الأجور في مدد)',
        nameAr: 'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
        groupId: 'sg-mudad-payroll',
        groupNameEn: 'Mudad & Wage Protection (WPS)',
        groupNameAr: 'منصة مدد ونظام حماية الأجور',
    },
    {
        id: 'srv-zatca-cert',
        nameEn: 'ZATCA Zakat & Tax Compliance Certificate (إصدار شهادة الزكاة والضريبة)',
        nameAr: 'إصدار شهادة الالتزام الزكوي والضريبي (هيئة الزكاة والضريبة والجمارك)',
        groupId: 'sg-zatca-compliance',
        groupNameEn: 'ZATCA & Chamber of Commerce',
        groupNameAr: 'هيئة الزكاة والضريبة والغرفة التجارية',
    },
    {
        id: 'srv-spl-address',
        nameEn: 'SPL National Address Registration (تسجيل وتحديث العنوان الوطني سبل)',
        nameAr: 'تسجيل وتجديد العنوان الوطني للمنشأة عبر البريد السعودي (سبل)',
        groupId: 'sg-cr-commerce',
        groupNameEn: 'Commercial Registration & Ministry of Commerce',
        groupNameAr: 'إدارة السجل التجاري ووزارة التجارة',
    },
];

// ============================================================================
// 24 Realistic Initial Demo Service Records
// ============================================================================

export const INITIAL_REQUEST_SERVICES: RequestServiceRecord[] = [
    {
        id: 'req-srv-01',
        code: 'RSRV-001',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-dezen',
        companyName: 'dezen company',
        companyNameAr: 'dezen company',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceGroups: ['Employee Onboarding & GOSI', 'Qiwa & Labor Office Contracts'],
        serviceGroupsAr: ['تأهيل الموظفين والتأمينات الاجتماعية', 'منصة قوى وتوثيق عقود العمل'],
        selectedServices: [
            'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
            'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
            'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
        ],
        selectedServicesAr: [
            'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
            'توثيق عقد عمل موحد في منصة قوى',
            'إصدار وربط التأمين الطبي التعاوني للموظفين',
        ],
        createdDate: '2026-03-28',
        status: 'Active',
    },
    {
        id: 'req-srv-02',
        code: 'RSRV-002',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-spring',
        companyName: 'Testing Spring 1',
        companyNameAr: 'Testing Spring 1',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceGroups: ['Assets & Fleet Registration', 'Municipal & Baladi Licensing'],
        serviceGroupsAr: ['إدارة الأصول وتسجيل المركبات', 'التراخيص البلدية ومنصة بلدي'],
        selectedServices: [
            'Fleet Vehicle Istimara & TGA Operation Card (تسجيل المركبات وإصدار كرت التشغيل)',
            'Commercial Fleet Comprehensive Insurance (تأمين أسطول المركبات التجارية)',
            'Salamah Civil Defense Safety Certificate (شهادة السلامة من الدفاع المدني - سلامة)',
        ],
        selectedServicesAr: [
            'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
            'إصدار وربط وثيقة تأمين المركبات والأسطول التجاري',
            'إصدار وتجديد ترخيص السلامة من الدفاع المدني (سلامة)',
        ],
        createdDate: '2026-03-26',
        status: 'Active',
    },
    {
        id: 'req-srv-03',
        code: 'RSRV-003',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-ar',
        companyName: 'نجود تيست',
        companyNameAr: 'نجود تيست',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        serviceGroups: [
            'Commercial Registration & Ministry of Commerce',
            'ZATCA & Chamber of Commerce',
            'Municipal & Baladi Licensing',
        ],
        serviceGroupsAr: [
            'إدارة السجل التجاري ووزارة التجارة',
            'هيئة الزكاة والضريبة والغرفة التجارية',
            'التراخيص البلدية ومنصة بلدي',
        ],
        selectedServices: [
            'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
            'Chamber of Commerce Membership Renewal (تجديد اشتراك الغرفة التجارية)',
            'SPL National Address Registration (تسجيل وتحديث العنوان الوطني سبل)',
            'Baladi Commercial License Issuance & Renewal (إصدار وتجديد رخصة بلدي)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
            'تجديد اشتراك الغرفة التجارية وتصديق الوثائق',
            'تسجيل وتجديد العنوان الوطني للمنشأة عبر البريد السعودي (سبل)',
            'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
        ],
        createdDate: '2026-03-24',
        status: 'Active',
    },
    {
        id: 'req-srv-04',
        code: 'RSRV-004',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-en',
        companyName: 'njoud test com',
        companyNameAr: 'njoud test com',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        serviceGroups: ['Muqeem & Iqama Operations', 'Qiwa & Labor Office Contracts'],
        serviceGroupsAr: ['خدمات مقيم والإقامات والتأشيرات', 'منصة قوى وتوثيق عقود العمل'],
        selectedServices: [
            'New Iqama Issuance & Renewal via Muqeem (إصدار وتجديد الإقامة عبر مقيم)',
            'Work Permit Issuance & SADAD Fee Calculation (إصدار رخصة عمل وحساب المقابل المالي)',
            'Exit & Re-Entry Visa Issuance (إصدار تأشيرة خروج وعودة)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
            'إصدار وتجديد رخصة العمل وحساب المقابل المالي',
            'إصدار وتمديد تأشيرة خروج وعودة إلكترونية',
        ],
        createdDate: '2026-03-22',
        status: 'Active',
    },
    {
        id: 'req-srv-05',
        code: 'RSRV-005',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        companyId: 'comp-coffee7',
        companyName: 'مؤسسة قهوة السابعة',
        companyNameAr: 'مؤسسة قهوة السابعة',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceGroups: ['Commercial Registration & Ministry of Commerce', 'ZATCA & Chamber of Commerce'],
        serviceGroupsAr: ['إدارة السجل التجاري ووزارة التجارة', 'هيئة الزكاة والضريبة والغرفة التجارية'],
        selectedServices: [
            'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
            'CR Activity & Signatory Amendment (تعديل أنشطة السجل التجاري والمفوضين)',
            'Chamber of Commerce Membership Renewal (تجديد اشتراك الغرفة التجارية)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
            'تعديل أنشطة السجل التجاري وتحديث بيانات المفوضين',
            'تجديد اشتراك الغرفة التجارية وتصديق الوثائق',
        ],
        createdDate: '2026-03-20',
        status: 'Active',
    },
    {
        id: 'req-srv-06',
        code: 'RSRV-006',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        companyId: 'comp-coffee7',
        companyName: 'مؤسسة قهوة السابعة',
        companyNameAr: 'مؤسسة قهوة السابعة',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        serviceGroups: ['Employee Onboarding & GOSI', 'Mudad & Wage Protection (WPS)'],
        serviceGroupsAr: ['تأهيل الموظفين والتأمينات الاجتماعية', 'منصة مدد ونظام حماية الأجور'],
        selectedServices: [
            'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
            'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
            'Mudad Payroll SIF Upload & WPS Compliance (رفع ملفات حماية الأجور في مدد)',
        ],
        selectedServicesAr: [
            'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
            'توثيق عقد عمل موحد في منصة قوى',
            'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
        ],
        createdDate: '2026-03-19',
        status: 'Active',
    },
    {
        id: 'req-srv-07',
        code: 'RSRV-007',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-dezen',
        companyName: 'dezen company',
        companyNameAr: 'dezen company',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        serviceGroups: ['Commercial Registration & Ministry of Commerce', 'Municipal & Baladi Licensing'],
        serviceGroupsAr: ['إدارة السجل التجاري ووزارة التجارة', 'التراخيص البلدية ومنصة بلدي'],
        selectedServices: [
            'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
            'Baladi Commercial License Issuance & Renewal (إصدار وتجديد رخصة بلدي)',
            'SPL National Address Registration (تسجيل وتحديث العنوان الوطني سبل)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
            'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
            'تسجيل وتجديد العنوان الوطني للمنشأة عبر البريد السعودي (سبل)',
        ],
        createdDate: '2026-03-17',
        status: 'Active',
    },
    {
        id: 'req-srv-08',
        code: 'RSRV-008',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-spring',
        companyName: 'Testing Spring 1',
        companyNameAr: 'Testing Spring 1',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        serviceGroups: ['Muqeem & Iqama Operations', 'Employee Onboarding & GOSI'],
        serviceGroupsAr: ['خدمات مقيم والإقامات والتأشيرات', 'تأهيل الموظفين والتأمينات الاجتماعية'],
        selectedServices: [
            'New Iqama Issuance & Renewal via Muqeem (إصدار وتجديد الإقامة عبر مقيم)',
            'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
            'Exit & Re-Entry Visa Issuance (إصدار تأشيرة خروج وعودة)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
            'إصدار وربط التأمين الطبي التعاوني للموظفين',
            'إصدار وتمديد تأشيرة خروج وعودة إلكترونية',
        ],
        createdDate: '2026-03-15',
        status: 'Active',
    },
    {
        id: 'req-srv-09',
        code: 'RSRV-009',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-ar',
        companyName: 'نجود تيست',
        companyNameAr: 'نجود تيست',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceGroups: ['Employee Onboarding & GOSI', 'Qiwa & Labor Office Contracts'],
        serviceGroupsAr: ['تأهيل الموظفين والتأمينات الاجتماعية', 'منصة قوى وتوثيق عقود العمل'],
        selectedServices: [
            'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
            'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
        ],
        selectedServicesAr: [
            'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
            'توثيق عقد عمل موحد في منصة قوى',
        ],
        createdDate: '2026-03-14',
        status: 'Active',
    },
    {
        id: 'req-srv-10',
        code: 'RSRV-010',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-en',
        companyName: 'njoud test com',
        companyNameAr: 'njoud test com',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceGroups: ['Commercial Registration & Ministry of Commerce'],
        serviceGroupsAr: ['إدارة السجل التجاري ووزارة التجارة'],
        selectedServices: [
            'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
            'CR Activity & Signatory Amendment (تعديل أنشطة السجل التجاري والمفوضين)',
            'SPL National Address Registration (تسجيل وتحديث العنوان الوطني سبل)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
            'تعديل أنشطة السجل التجاري وتحديث بيانات المفوضين',
            'تسجيل وتجديد العنوان الوطني للمنشأة عبر البريد السعودي (سبل)',
        ],
        createdDate: '2026-03-12',
        status: 'Active',
    },
    {
        id: 'req-srv-11',
        code: 'RSRV-011',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        companyId: 'comp-faisaliah',
        companyName: 'Al Faisaliah Holding Group',
        companyNameAr: 'مجموعة الفيصلية القابضة',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        serviceGroups: ['Commercial Registration & Ministry of Commerce', 'ZATCA & Chamber of Commerce'],
        serviceGroupsAr: ['إدارة السجل التجاري ووزارة التجارة', 'هيئة الزكاة والضريبة والغرفة التجارية'],
        selectedServices: [
            'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
            'ZATCA Zakat & Tax Compliance Certificate (إصدار شهادة الزكاة والضريبة)',
            'Chamber of Commerce Membership Renewal (تجديد اشتراك الغرفة التجارية)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
            'إصدار شهادة الالتزام الزكوي والضريبي (هيئة الزكاة والضريبة والجمارك)',
            'تجديد اشتراك الغرفة التجارية وتصديق الوثائق',
        ],
        createdDate: '2026-03-10',
        status: 'Active',
    },
    {
        id: 'req-srv-12',
        code: 'RSRV-012',
        ownerId: 'owner-4',
        ownerNameEn: 'Sultan Al-Harbi',
        ownerNameAr: 'سلطان الحربي',
        companyId: 'comp-najd',
        companyName: 'Najd Integrated Solutions',
        companyNameAr: 'شركة نجد للحلول المتكاملة',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        serviceGroups: ['Employee Onboarding & GOSI', 'Qiwa & Labor Office Contracts', 'Mudad & Wage Protection (WPS)'],
        serviceGroupsAr: [
            'تأهيل الموظفين والتأمينات الاجتماعية',
            'منصة قوى وتوثيق عقود العمل',
            'منصة مدد ونظام حماية الأجور',
        ],
        selectedServices: [
            'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
            'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
            'Mudad Payroll SIF Upload & WPS Compliance (رفع ملفات حماية الأجور في مدد)',
            'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
        ],
        selectedServicesAr: [
            'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
            'توثيق عقد عمل موحد في منصة قوى',
            'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
            'إصدار وربط التأمين الطبي التعاوني للموظفين',
        ],
        createdDate: '2026-03-08',
        status: 'Active',
    },
    {
        id: 'req-srv-13',
        code: 'RSRV-013',
        ownerId: 'owner-4',
        ownerNameEn: 'Sultan Al-Harbi',
        ownerNameAr: 'سلطان الحربي',
        companyId: 'comp-yamamah',
        companyName: 'Al Yamamah Contracting Est.',
        companyNameAr: 'مؤسسة اليمامة للمقاولات',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceGroups: ['Assets & Fleet Registration', 'Municipal & Baladi Licensing'],
        serviceGroupsAr: ['إدارة الأصول وتسجيل المركبات', 'التراخيص البلدية ومنصة بلدي'],
        selectedServices: [
            'Fleet Vehicle Istimara & TGA Operation Card (تسجيل المركبات وإصدار كرت التشغيل)',
            'Commercial Fleet Comprehensive Insurance (تأمين أسطول المركبات التجارية)',
            'Baladi Commercial License Issuance & Renewal (إصدار وتجديد رخصة بلدي)',
        ],
        selectedServicesAr: [
            'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
            'إصدار وربط وثيقة تأمين المركبات والأسطول التجاري',
            'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
        ],
        createdDate: '2026-03-06',
        status: 'Active',
    },
    {
        id: 'req-srv-14',
        code: 'RSRV-014',
        ownerId: 'owner-5',
        ownerNameEn: 'Noura Al-Shammari',
        ownerNameAr: 'نورة الشمري',
        companyId: 'comp-tuwaiq',
        companyName: 'Tuwaiq Logistics Co.',
        companyNameAr: 'شركة طويق للخدمات اللوجستية',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceGroups: ['Assets & Fleet Registration'],
        serviceGroupsAr: ['إدارة الأصول وتسجيل المركبات'],
        selectedServices: [
            'Fleet Vehicle Istimara & TGA Operation Card (تسجيل المركبات وإصدار كرت التشغيل)',
            'Commercial Fleet Comprehensive Insurance (تأمين أسطول المركبات التجارية)',
        ],
        selectedServicesAr: [
            'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
            'إصدار وربط وثيقة تأمين المركبات والأسطول التجاري',
        ],
        createdDate: '2026-03-04',
        status: 'Active',
    },
    {
        id: 'req-srv-15',
        code: 'RSRV-015',
        ownerId: 'owner-5',
        ownerNameEn: 'Noura Al-Shammari',
        ownerNameAr: 'نورة الشمري',
        companyId: 'comp-gulf',
        companyName: 'Gulf Industrial Supplies',
        companyNameAr: 'شركة الخليج للتوريدات الصناعية',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        serviceGroups: ['Muqeem & Iqama Operations', 'Qiwa & Labor Office Contracts'],
        serviceGroupsAr: ['خدمات مقيم والإقامات والتأشيرات', 'منصة قوى وتوثيق عقود العمل'],
        selectedServices: [
            'New Iqama Issuance & Renewal via Muqeem (إصدار وتجديد الإقامة عبر مقيم)',
            'Work Permit Issuance & SADAD Fee Calculation (إصدار رخصة عمل وحساب المقابل المالي)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
            'إصدار وتجديد رخصة العمل وحساب المقابل المالي',
        ],
        createdDate: '2026-03-02',
        status: 'Active',
    },
    {
        id: 'req-srv-16',
        code: 'RSRV-016',
        ownerId: 'owner-6',
        ownerNameEn: 'Khalid Al-Otaibi',
        ownerNameAr: 'خالد العتيبي',
        companyId: 'comp-awn',
        companyName: 'AWN Administrative Services',
        companyNameAr: 'شركة عون للخدمات الإدارية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceGroups: ['Employee Onboarding & GOSI', 'Mudad & Wage Protection (WPS)'],
        serviceGroupsAr: ['تأهيل الموظفين والتأمينات الاجتماعية', 'منصة مدد ونظام حماية الأجور'],
        selectedServices: [
            'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
            'Mudad Payroll SIF Upload & WPS Compliance (رفع ملفات حماية الأجور في مدد)',
            'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
        ],
        selectedServicesAr: [
            'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
            'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
            'إصدار وربط التأمين الطبي التعاوني للموظفين',
        ],
        createdDate: '2026-02-28',
        status: 'Active',
    },
    {
        id: 'req-srv-17',
        code: 'RSRV-017',
        ownerId: 'owner-6',
        ownerNameEn: 'Khalid Al-Otaibi',
        ownerNameAr: 'خالد العتيبي',
        companyId: 'comp-riyadh-tech',
        companyName: 'Riyadh Tech Solutions',
        companyNameAr: 'مؤسسة الرياض للحلول التقنية',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceGroups: ['Commercial Registration & Ministry of Commerce', 'ZATCA & Chamber of Commerce'],
        serviceGroupsAr: ['إدارة السجل التجاري ووزارة التجارة', 'هيئة الزكاة والضريبة والغرفة التجارية'],
        selectedServices: [
            'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
            'CR Activity & Signatory Amendment (تعديل أنشطة السجل التجاري والمفوضين)',
            'ZATCA Zakat & Tax Compliance Certificate (إصدار شهادة الزكاة والضريبة)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
            'تعديل أنشطة السجل التجاري وتحديث بيانات المفوضين',
            'إصدار شهادة الالتزام الزكوي والضريبي (هيئة الزكاة والضريبة والجمارك)',
        ],
        createdDate: '2026-02-25',
        status: 'Active',
    },
    {
        id: 'req-srv-18',
        code: 'RSRV-018',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-dezen',
        companyName: 'dezen company',
        companyNameAr: 'dezen company',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceGroups: ['Commercial Registration & Ministry of Commerce'],
        serviceGroupsAr: ['إدارة السجل التجاري ووزارة التجارة'],
        selectedServices: [
            'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
            'CR Activity & Signatory Amendment (تعديل أنشطة السجل التجاري والمفوضين)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
            'تعديل أنشطة السجل التجاري وتحديث بيانات المفوضين',
        ],
        createdDate: '2026-02-22',
        status: 'Active',
    },
    {
        id: 'req-srv-19',
        code: 'RSRV-019',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-spring',
        companyName: 'Testing Spring 1',
        companyNameAr: 'Testing Spring 1',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        serviceGroups: ['Employee Onboarding & GOSI', 'Qiwa & Labor Office Contracts'],
        serviceGroupsAr: ['تأهيل الموظفين والتأمينات الاجتماعية', 'منصة قوى وتوثيق عقود العمل'],
        selectedServices: [
            'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
            'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
        ],
        selectedServicesAr: [
            'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
            'توثيق عقد عمل موحد في منصة قوى',
        ],
        createdDate: '2026-02-19',
        status: 'Active',
    },
    {
        id: 'req-srv-20',
        code: 'RSRV-020',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-ar',
        companyName: 'نجود تيست',
        companyNameAr: 'نجود تيست',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceGroups: ['Assets & Fleet Registration', 'Municipal & Baladi Licensing'],
        serviceGroupsAr: ['إدارة الأصول وتسجيل المركبات', 'التراخيص البلدية ومنصة بلدي'],
        selectedServices: [
            'Fleet Vehicle Istimara & TGA Operation Card (تسجيل المركبات وإصدار كرت التشغيل)',
            'Salamah Civil Defense Safety Certificate (شهادة السلامة من الدفاع المدني - سلامة)',
        ],
        selectedServicesAr: [
            'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
            'إصدار وتجديد ترخيص السلامة من الدفاع المدني (سلامة)',
        ],
        createdDate: '2026-02-16',
        status: 'Active',
    },
    {
        id: 'req-srv-21',
        code: 'RSRV-021',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-en',
        companyName: 'njoud test com',
        companyNameAr: 'njoud test com',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        serviceGroups: ['Municipal & Baladi Licensing', 'ZATCA & Chamber of Commerce'],
        serviceGroupsAr: ['التراخيص البلدية ومنصة بلدي', 'هيئة الزكاة والضريبة والغرفة التجارية'],
        selectedServices: [
            'Baladi Commercial License Issuance & Renewal (إصدار وتجديد رخصة بلدي)',
            'ZATCA Zakat & Tax Compliance Certificate (إصدار شهادة الزكاة والضريبة)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
            'إصدار شهادة الالتزام الزكوي والضريبي (هيئة الزكاة والضريبة والجمارك)',
        ],
        createdDate: '2026-02-14',
        status: 'Active',
    },
    {
        id: 'req-srv-22',
        code: 'RSRV-022',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        companyId: 'comp-coffee7',
        companyName: 'مؤسسة قهوة السابعة',
        companyNameAr: 'مؤسسة قهوة السابعة',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        serviceGroups: ['Muqeem & Iqama Operations', 'Employee Onboarding & GOSI'],
        serviceGroupsAr: ['خدمات مقيم والإقامات والتأشيرات', 'تأهيل الموظفين والتأمينات الاجتماعية'],
        selectedServices: [
            'New Iqama Issuance & Renewal via Muqeem (إصدار وتجديد الإقامة عبر مقيم)',
            'Exit & Re-Entry Visa Issuance (إصدار تأشيرة خروج وعودة)',
            'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
        ],
        selectedServicesAr: [
            'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
            'إصدار وتمديد تأشيرة خروج وعودة إلكترونية',
            'إصدار وربط التأمين الطبي التعاوني للموظفين',
        ],
        createdDate: '2026-02-11',
        status: 'Active',
    },
    {
        id: 'req-srv-23',
        code: 'RSRV-023',
        ownerId: 'owner-4',
        ownerNameEn: 'Sultan Al-Harbi',
        ownerNameAr: 'سلطان الحربي',
        companyId: 'comp-najd',
        companyName: 'Najd Integrated Solutions',
        companyNameAr: 'شركة نجد للحلول المتكاملة',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceGroups: ['Employee Onboarding & GOSI', 'Qiwa & Labor Office Contracts'],
        serviceGroupsAr: ['تأهيل الموظفين والتأمينات الاجتماعية', 'منصة قوى وتوثيق عقود العمل'],
        selectedServices: [
            'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
            'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
            'Work Permit Issuance & SADAD Fee Calculation (إصدار رخصة عمل وحساب المقابل المالي)',
        ],
        selectedServicesAr: [
            'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
            'توثيق عقد عمل موحد في منصة قوى',
            'إصدار وتجديد رخصة العمل وحساب المقابل المالي',
        ],
        createdDate: '2026-02-08',
        status: 'Active',
    },
    {
        id: 'req-srv-24',
        code: 'RSRV-024',
        ownerId: 'owner-5',
        ownerNameEn: 'Noura Al-Shammari',
        ownerNameAr: 'نورة الشمري',
        companyId: 'comp-tuwaiq',
        companyName: 'Tuwaiq Logistics Co.',
        companyNameAr: 'شركة طويق للخدمات اللوجستية',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        serviceGroups: ['Employee Onboarding & GOSI', 'Mudad & Wage Protection (WPS)'],
        serviceGroupsAr: ['تأهيل الموظفين والتأمينات الاجتماعية', 'منصة مدد ونظام حماية الأجور'],
        selectedServices: [
            'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
            'Mudad Payroll SIF Upload & WPS Compliance (رفع ملفات حماية الأجور في مدد)',
        ],
        selectedServicesAr: [
            'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
            'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
        ],
        createdDate: '2026-02-05',
        status: 'Active',
    },
];

// ============================================================================
// LocalStorage Persistence Helpers
// ============================================================================

export const REQUEST_SERVICES_STORAGE_KEY = 'awn_request_services_v1';
export const REQUEST_INITIATED_STORAGE_KEY = 'awn_request_initiated_requests_v1';

function hasLocalStorage(): boolean {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
        return false;
    }
}

function isValidRequestServiceRecord(item: unknown): item is RequestServiceRecord {
    if (!item || typeof item !== 'object') return false;
    const rec = item as Record<string, unknown>;
    return (
        typeof rec.id === 'string' &&
        rec.id.trim().length > 0 &&
        typeof rec.companyId === 'string' &&
        typeof rec.companyName === 'string' &&
        typeof rec.packageName === 'string' &&
        Array.isArray(rec.serviceGroups) &&
        Array.isArray(rec.selectedServices)
    );
}

export function loadRequestServices(): RequestServiceRecord[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_REQUEST_SERVICES];
    }
    try {
        const raw = window.localStorage.getItem(REQUEST_SERVICES_STORAGE_KEY);
        if (raw === null) {
            window.localStorage.setItem(
                REQUEST_SERVICES_STORAGE_KEY,
                JSON.stringify(INITIAL_REQUEST_SERVICES)
            );
            return [...INITIAL_REQUEST_SERVICES];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_REQUEST_SERVICES];
        }
        const valid = parsed.filter(isValidRequestServiceRecord);
        if (parsed.length > 0 && valid.length === 0) {
            return [...INITIAL_REQUEST_SERVICES];
        }
        return valid;
    } catch {
        return [...INITIAL_REQUEST_SERVICES];
    }
}

export function saveRequestServices(records: RequestServiceRecord[]): RequestServiceRecord[] {
    const safeList = Array.isArray(records)
        ? records.filter(isValidRequestServiceRecord)
        : [...INITIAL_REQUEST_SERVICES];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(REQUEST_SERVICES_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage quota errors
        }
    }
    return safeList;
}

export function createRequestServiceRecord(record: RequestServiceRecord): RequestServiceRecord[] {
    const current = loadRequestServices();
    const exists = current.some((item) => item.id === record.id);
    const next = exists
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current];
    return saveRequestServices(next);
}

export function updateRequestServiceRecord(record: RequestServiceRecord): RequestServiceRecord[] {
    const current = loadRequestServices();
    const next = current.map((item) => (item.id === record.id ? record : item));
    return saveRequestServices(next);
}

export function deleteRequestServiceRecord(id: string): RequestServiceRecord[] {
    const current = loadRequestServices();
    const next = current.filter((item) => item.id !== id);
    return saveRequestServices(next);
}

export function loadInitiatedRequests(): InitiatedRequestPayload[] {
    if (!hasLocalStorage()) return [];
    try {
        const raw = window.localStorage.getItem(REQUEST_INITIATED_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveInitiatedRequest(payload: InitiatedRequestPayload): InitiatedRequestPayload[] {
    const current = loadInitiatedRequests();
    const filtered = current.filter((item) => item.id !== payload.id);
    const next = [payload, ...filtered];
    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(REQUEST_INITIATED_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Ignore storage errors
        }
    }
    return next;
}
