export interface DemoTicket {
    id: string;
    code: string;
    title: string;
    status: 'open' | 'closed' | 'reopened';
    client: string;
    clientEn: string;
    company: string;
    companyEn: string;
    assignedResource: string | null;
    assignedResourceEn: string | null;
    month: 'Nov' | 'Dec' | 'Jan' | 'Feb' | 'Mar' | 'Apr';
}

export const MONTH_ORDER: Array<'Nov' | 'Dec' | 'Jan' | 'Feb' | 'Mar' | 'Apr'> = [
    'Nov',
    'Dec',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
];

export const MONTH_LABELS: Record<'Nov' | 'Dec' | 'Jan' | 'Feb' | 'Mar' | 'Apr', { en: string; ar: string }> = {
    Nov: { en: 'Nov 2025', ar: 'نوفمبر ٢٠٢٥' },
    Dec: { en: 'Dec 2025', ar: 'ديسمبر ٢٠٢٥' },
    Jan: { en: 'Jan 2026', ar: 'يناير ٢٠٢٦' },
    Feb: { en: 'Feb 2026', ar: 'فبراير ٢٠٢٦' },
    Mar: { en: 'Mar 2026', ar: 'مارس ٢٠٢٦' },
    Apr: { en: 'Apr 2026', ar: 'أبريل ٢٠٢٦' },
};

export const MOCK_TICKETS: DemoTicket[] = [
    // --- November 2025 (10 tickets: 3 Open, 6 Closed, 1 Reopened) ---
    {
        id: 'tck-01',
        code: 'TCK-2025-101',
        title: 'طلب تفعيل ربط بوابة مقيم الإلكترونية',
        status: 'open',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Nov',
    },
    {
        id: 'tck-02',
        code: 'TCK-2025-102',
        title: 'استفسار بشأن اشتراك منصة قوى السنوي',
        status: 'open',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Nov',
    },
    {
        id: 'tck-03',
        code: 'TCK-2025-103',
        title: 'خلل في مزامنة بيانات السجل التجاري',
        status: 'open',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Nov',
    },
    {
        id: 'tck-04',
        code: 'TCK-2025-104',
        title: 'إصدار شهادة التوطين والمواءمة',
        status: 'closed',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Nov',
    },
    {
        id: 'tck-05',
        code: 'TCK-2025-105',
        title: 'تجديد ترخيص الاستثمار الأجنبي',
        status: 'closed',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Nov',
    },
    {
        id: 'tck-06',
        code: 'TCK-2025-106',
        title: 'تعديل الصلاحيات الإدارية على منصة بلدي',
        status: 'closed',
        client: 'نورة الغامدي',
        clientEn: 'Noura Al-Ghamdi',
        company: 'شركة علم لأمن المعلومات',
        companyEn: 'Elm Info Security',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Nov',
    },
    {
        id: 'tck-07',
        code: 'TCK-2025-107',
        title: 'سداد رسوم المقابل المالي للرخص المهنية',
        status: 'closed',
        client: 'سلطان الحربي',
        clientEn: 'Sultan Al-Harbi',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Nov',
    },
    {
        id: 'tck-08',
        code: 'TCK-2025-108',
        title: 'تحديث بيانات المفوض بالتوقيع في الغرفة التجارية',
        status: 'closed',
        client: 'ريم الشهري',
        clientEn: 'Reem Al-Shehri',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Nov',
    },
    {
        id: 'tck-09',
        code: 'TCK-2025-109',
        title: 'طباعة شهادة الزكاة وضريبة الدخل',
        status: 'closed',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Nov',
    },
    {
        id: 'tck-10',
        code: 'TCK-2025-110',
        title: 'طلب إعادة فحص مستندات الإلغاء بالسجل التجاري',
        status: 'reopened',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Nov',
    },

    // --- December 2025 (12 tickets: 4 Open, 7 Closed, 1 Reopened) ---
    {
        id: 'tck-11',
        code: 'TCK-2025-111',
        title: 'إلغاء تأشيرة خروج وعودة غير مستخدمة',
        status: 'open',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Dec',
    },
    {
        id: 'tck-12',
        code: 'TCK-2025-112',
        title: 'إضافة فرع جديد للمنشأة في التأمينات',
        status: 'open',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Dec',
    },
    {
        id: 'tck-13',
        code: 'TCK-2025-113',
        title: 'طلب ربط الحساب البنكي لنظام حماية الأجور',
        status: 'open',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Dec',
    },
    {
        id: 'tck-14',
        code: 'TCK-2025-114',
        title: 'تأكيد صحة عقد العمل الإلكتروني',
        status: 'open',
        client: 'نورة الغامدي',
        clientEn: 'Noura Al-Ghamdi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Dec',
    },
    {
        id: 'tck-15',
        code: 'TCK-2025-115',
        title: 'تحديث هوية مقيم لموظفي المشاريع',
        status: 'closed',
        client: 'سلطان الحربي',
        clientEn: 'Sultan Al-Harbi',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Dec',
    },
    {
        id: 'tck-16',
        code: 'TCK-2025-116',
        title: 'تعديل الاسم التجاري المسجل باللغة الإنجليزية',
        status: 'closed',
        client: 'ريم الشهري',
        clientEn: 'Reem Al-Shehri',
        company: 'شركة علم لأمن المعلومات',
        companyEn: 'Elm Info Security',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Dec',
    },
    {
        id: 'tck-17',
        code: 'TCK-2025-117',
        title: 'تفعيل ملف المنشأة لدى وزارة التجارة',
        status: 'closed',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Dec',
    },
    {
        id: 'tck-18',
        code: 'TCK-2025-118',
        title: 'استرداد مبالغ سداد مقيم المعلقة',
        status: 'closed',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Dec',
    },
    {
        id: 'tck-19',
        code: 'TCK-2025-119',
        title: 'نقل خدمات وافد بموافقة المنشأة السابقة',
        status: 'closed',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Dec',
    },
    {
        id: 'tck-20',
        code: 'TCK-2025-120',
        title: 'إصدار تصريح عمل لموظف تحت التدريب',
        status: 'closed',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Dec',
    },
    {
        id: 'tck-21',
        code: 'TCK-2025-121',
        title: 'تحميل بيان الرواتب الشهري في مدد',
        status: 'closed',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Dec',
    },
    {
        id: 'tck-22',
        code: 'TCK-2025-122',
        title: 'اعتراض على مخالفة تأخير توثيق العقود',
        status: 'reopened',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Dec',
    },

    // --- January 2026 (11 tickets: 5 Open, 5 Closed, 1 Reopened) ---
    {
        id: 'tck-23',
        code: 'TCK-2026-001',
        title: 'طلب ترقية الباقة الشهرية للبوابة الرقمية',
        status: 'open',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Jan',
    },
    {
        id: 'tck-24',
        code: 'TCK-2026-002',
        title: 'تسجيل الدخول الموحد عبر النفاذ الوطني',
        status: 'open',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Jan',
    },
    {
        id: 'tck-25',
        code: 'TCK-2026-003',
        title: 'حساب نسبة التوطين في نطاقات',
        status: 'open',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Jan',
    },
    {
        id: 'tck-26',
        code: 'TCK-2026-004',
        title: 'تعديل نشاط السجل الفرعي في جدة',
        status: 'open',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Jan',
    },
    {
        id: 'tck-27',
        code: 'TCK-2026-005',
        title: 'طلب تمديد تأشيرة زيارة العمل للخبراء',
        status: 'open',
        client: 'نورة الغامدي',
        clientEn: 'Noura Al-Ghamdi',
        company: 'شركة علم لأمن المعلومات',
        companyEn: 'Elm Info Security',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Jan',
    },
    {
        id: 'tck-28',
        code: 'TCK-2026-006',
        title: 'شهادة الالتزام بحماية الأجور للربع الأخير',
        status: 'closed',
        client: 'سلطان الحربي',
        clientEn: 'Sultan Al-Harbi',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Jan',
    },
    {
        id: 'tck-29',
        code: 'TCK-2026-007',
        title: 'إلغاء بلاغ تغيب بعد المصالحة الودية',
        status: 'closed',
        client: 'ريم الشهري',
        clientEn: 'Reem Al-Shehri',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Jan',
    },
    {
        id: 'tck-30',
        code: 'TCK-2026-008',
        title: 'إصدار تصريح الدفاع المدني للمستودعات',
        status: 'closed',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Jan',
    },
    {
        id: 'tck-31',
        code: 'TCK-2026-009',
        title: 'تحديث بيانات الحساب في منصة سابر',
        status: 'closed',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Jan',
    },
    {
        id: 'tck-32',
        code: 'TCK-2026-010',
        title: 'طلب تفويض إلكتروني لمعاملات المرور',
        status: 'closed',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Jan',
    },
    {
        id: 'tck-33',
        code: 'TCK-2026-011',
        title: 'استئناف قرار التقييم الضريبي في هيئة الزكاة',
        status: 'reopened',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Jan',
    },

    // --- February 2026 (11 tickets: 5 Open, 6 Closed, 0 Reopened) ---
    {
        id: 'tck-34',
        code: 'TCK-2026-012',
        title: 'تفعيل خدمة التحقق من العنوان الوطني للمنشأة',
        status: 'open',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Feb',
    },
    {
        id: 'tck-35',
        code: 'TCK-2026-013',
        title: 'فحص استحقاق دعم صندوق الموارد البشرية (هدف)',
        status: 'open',
        client: 'نورة الغامدي',
        clientEn: 'Noura Al-Ghamdi',
        company: 'شركة علم لأمن المعلومات',
        companyEn: 'Elm Info Security',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Feb',
    },
    {
        id: 'tck-36',
        code: 'TCK-2026-014',
        title: 'تسوية مبالغ غرامات التأخير في التأمينات',
        status: 'open',
        client: 'سلطان الحربي',
        clientEn: 'Sultan Al-Harbi',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Feb',
    },
    {
        id: 'tck-37',
        code: 'TCK-2026-015',
        title: 'تعديل البريد الإلكتروني المعتمد في سداد',
        status: 'open',
        client: 'ريم الشهري',
        clientEn: 'Reem Al-Shehri',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Feb',
    },
    {
        id: 'tck-38',
        code: 'TCK-2026-016',
        title: 'إصدار بطاقة تشغيل مركبات النقل الثقيل',
        status: 'open',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Feb',
    },
    {
        id: 'tck-39',
        code: 'TCK-2026-017',
        title: 'تحديث بيانات شهادة الآيزو المعتمدة',
        status: 'closed',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Feb',
    },
    {
        id: 'tck-40',
        code: 'TCK-2026-018',
        title: 'استخراج بدل فاقد لشهادة رخصة البلدية',
        status: 'closed',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Feb',
    },
    {
        id: 'tck-41',
        code: 'TCK-2026-019',
        title: 'توثيق لائحة تنظيم العمل الداخلية',
        status: 'closed',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Feb',
    },
    {
        id: 'tck-42',
        code: 'TCK-2026-020',
        title: 'إلغاء تسجيل المنشأة لدى مصلحة الزكاة للفرع القديم',
        status: 'closed',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Feb',
    },
    {
        id: 'tck-43',
        code: 'TCK-2026-021',
        title: 'تجديد شهادة عضوية الغرفة التجارية',
        status: 'closed',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Feb',
    },
    {
        id: 'tck-44',
        code: 'TCK-2026-022',
        title: 'ربط بيانات المشتركين مع منصة صحتي',
        status: 'closed',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'شركة علم لأمن المعلومات',
        companyEn: 'Elm Info Security',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Feb',
    },

    // --- March 2026 (11 tickets: 6 Open, 4 Closed, 1 Reopened) ---
    {
        id: 'tck-45',
        code: 'TCK-2026-023',
        title: 'مشكلة في تحميل ملف حماية الأجور بصيغة SIF',
        status: 'open',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Mar',
    },
    {
        id: 'tck-46',
        code: 'TCK-2026-024',
        title: 'طلب تقسيط المستحقات الزكوية المتبقية',
        status: 'open',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Mar',
    },
    {
        id: 'tck-47',
        code: 'TCK-2026-025',
        title: 'استكمال بيانات المساهمين في السجل التجاري',
        status: 'open',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Mar',
    },
    {
        id: 'tck-48',
        code: 'TCK-2026-026',
        title: 'طلب تمديد مهلة تعديل الأوضاع في منصة قوى',
        status: 'open',
        client: 'نورة الغامدي',
        clientEn: 'Noura Al-Ghamdi',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Mar',
    },
    {
        id: 'tck-49',
        code: 'TCK-2026-027',
        title: 'تعديل البريد الرسمي لمستلمي إشعارات الحساب',
        status: 'open',
        client: 'سلطان الحربي',
        clientEn: 'Sultan Al-Harbi',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Mar',
    },
    {
        id: 'tck-50',
        code: 'TCK-2026-028',
        title: 'فحص توافق أرقام الآيبان للتحويلات الحكومية',
        status: 'open',
        client: 'ريم الشهري',
        clientEn: 'Reem Al-Shehri',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Mar',
    },
    {
        id: 'tck-51',
        code: 'TCK-2026-029',
        title: 'تحديث اشتراك مقيم لفرع الدمام',
        status: 'closed',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Mar',
    },
    {
        id: 'tck-52',
        code: 'TCK-2026-030',
        title: 'إنشاء حساب مستخدم إداري للمدير المالي',
        status: 'closed',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Mar',
    },
    {
        id: 'tck-53',
        code: 'TCK-2026-031',
        title: 'إصدار تصريح عمل للمهندسين الاستشاريين',
        status: 'closed',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Mar',
    },
    {
        id: 'tck-54',
        code: 'TCK-2026-032',
        title: 'تأكيد سلامة شهادة المنشأ للبضائع',
        status: 'closed',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'شركة علم لأمن المعلومات',
        companyEn: 'Elm Info Security',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Mar',
    },
    {
        id: 'tck-55',
        code: 'TCK-2026-033',
        title: 'إعادة فتح تذكرة مطابقة الرصيد التأميني بعد التحديث',
        status: 'reopened',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Mar',
    },

    // --- April 2026 (9 tickets: 5 Open, 3 Closed, 1 Reopened) ---
    {
        id: 'tck-56',
        code: 'TCK-2026-034',
        title: 'طلب إضافة مستخدم جديد لصلاحية سداد الفواتير',
        status: 'open',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Apr',
    },
    {
        id: 'tck-57',
        code: 'TCK-2026-035',
        title: 'تأخر وصول رمز التحقق عبر أبشر أعمال',
        status: 'open',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Apr',
    },
    {
        id: 'tck-58',
        code: 'TCK-2026-036',
        title: 'طلب استشارة بخصوص نظام المعاملات المدنية',
        status: 'open',
        client: 'محمد العتيبي',
        clientEn: 'Mohammed Al-Otaibi',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Apr',
    },
    {
        id: 'tck-59',
        code: 'TCK-2026-037',
        title: 'مراجعة عقود العمل الموسمية في موسم الحج والعمرة',
        status: 'open',
        client: 'خالد المطيري',
        clientEn: 'Khalid Al-Mutairi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Apr',
    },
    {
        id: 'tck-60',
        code: 'TCK-2026-038',
        title: 'طلب تفعيل واجهة برمجة التطبيقات (API) لمنصة عون',
        status: 'open',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedResource: null,
        assignedResourceEn: null,
        month: 'Apr',
    },
    {
        id: 'tck-61',
        code: 'TCK-2026-039',
        title: 'إنهاء إجراءات شطب السجل التجاري لفرع الخبر',
        status: 'closed',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'عمر الدوسري',
        assignedResourceEn: 'Omar Al-Dossary',
        month: 'Apr',
    },
    {
        id: 'tck-62',
        code: 'TCK-2026-040',
        title: 'استرداد مبالغ التعويض المالي عن الإجازات',
        status: 'closed',
        client: 'سارة الشمري',
        clientEn: 'Sarah Al-Shammari',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedResource: 'م. كريم وجدي',
        assignedResourceEn: 'Eng. Karim Wagdi',
        month: 'Apr',
    },
    {
        id: 'tck-63',
        code: 'TCK-2026-041',
        title: 'تأكيد سريان رخصة الدفاع المدني المركزية',
        status: 'closed',
        client: 'عبدالله القحطاني',
        clientEn: 'Abdullah Al-Qahtani',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedResource: 'فاطمة عبدالفتاح',
        assignedResourceEn: 'Fatima Abdelfattah',
        month: 'Apr',
    },
    {
        id: 'tck-64',
        code: 'TCK-2026-042',
        title: 'طلب إعادة تدقيق مطابقة حساب المنشأة لدى مدد',
        status: 'reopened',
        client: 'فهد الدوسري',
        clientEn: 'Fahad Al-Dossary',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedResource: 'أحمد السالم',
        assignedResourceEn: 'Ahmed Al-Salem',
        month: 'Apr',
    },
];

export interface TicketAttachment {
    name: string;
    size: number;
    type: string;
}

export interface TicketSelectOption {
    value: string;
    ar: string;
    en: string;
}

export type TicketLifecycleStatus = 'NEW' | 'OPEN' | 'IN PROGRESS' | 'SOLVED' | 'CLOSED';

export type TicketStatus =
    | TicketLifecycleStatus
    | 'open'
    | 'closed'
    | 'reopened';

export interface TableTicket {
    id: string;
    ticketId: string;
    subject: string;
    subjectEn: string;
    ticketType: string;
    ticketTypeEn: string;
    customer: string;
    customerEn: string;
    company: string;
    companyEn: string;
    assignedTo: string | null;
    assignedToEn: string | null;
    assignedBy: string;
    assignedByEn: string;
    replyStatus: 'replied' | 'waiting_customer' | 'pending_agent';
    status: TicketStatus;
    closedDate: string | null;
    priority: 'High' | 'Medium' | 'Low';
    createdDate: string;
    message?: string;
    messageEn?: string;
    attachment?: TicketAttachment | null;
}

export const DEMO_TABLE_TICKETS: TableTicket[] = [
    {
        id: 'tb-01',
        ticketId: 'TCK-2026-001',
        subject: 'طلب تفعيل ربط بوابة مقيم الإلكترونية',
        subjectEn: 'Muqeem API gateway activation request',
        ticketType: 'الدعم الفني',
        ticketTypeEn: 'Technical Support',
        customer: 'عبدالله القحطاني',
        customerEn: 'Abdullah Al-Qahtani',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedTo: 'م. كريم وجدي',
        assignedToEn: 'Eng. Karim Wagdi',
        assignedBy: 'التوجيه الآلي للمنظومة',
        assignedByEn: 'System Auto-Dispatch',
        replyStatus: 'replied',
        status: 'open',
        closedDate: null,
        priority: 'High',
        createdDate: '2026-03-24',
    },
    {
        id: 'tb-02',
        ticketId: 'TCK-2026-002',
        subject: 'استفسار بشأن اشتراك منصة قوى السنوي',
        subjectEn: 'Qiwa annual platform subscription inquiry',
        ticketType: 'الفواتير والمدفوعات',
        ticketTypeEn: 'Billing & Payments',
        customer: 'سارة الشمري',
        customerEn: 'Sarah Al-Shammari',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedTo: 'أحمد السالم',
        assignedToEn: 'Ahmed Al-Salem',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'waiting_customer',
        status: 'open',
        closedDate: null,
        priority: 'Medium',
        createdDate: '2026-03-22',
    },
    {
        id: 'tb-03',
        ticketId: 'TCK-2026-003',
        subject: 'خلل في مزامنة بيانات السجل التجاري',
        subjectEn: 'Commercial Registration sync failure',
        ticketType: 'الدعم الفني',
        ticketTypeEn: 'Technical Support',
        customer: 'محمد العتيبي',
        customerEn: 'Mohammed Al-Otaibi',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedTo: null,
        assignedToEn: null,
        assignedBy: 'التوجيه الآلي للمنظومة',
        assignedByEn: 'System Auto-Dispatch',
        replyStatus: 'pending_agent',
        status: 'open',
        closedDate: null,
        priority: 'High',
        createdDate: '2026-03-21',
    },
    {
        id: 'tb-04',
        ticketId: 'TCK-2026-004',
        subject: 'إصدار شهادة التوطين والمواءمة',
        subjectEn: 'Saudization & alignment certificate issuance',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'خالد المطيري',
        customerEn: 'Khalid Al-Mutairi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedTo: 'فاطمة عبدالفتاح',
        assignedToEn: 'Fatima Abdelfattah',
        assignedBy: 'م. كريم وجدي',
        assignedByEn: 'Eng. Karim Wagdi',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-25',
        priority: 'Medium',
        createdDate: '2026-03-18',
    },
    {
        id: 'tb-05',
        ticketId: 'TCK-2026-005',
        subject: 'تجديد ترخيص الاستثمار الأجنبي',
        subjectEn: 'Foreign investment license renewal request',
        ticketType: 'استفسار امتثال',
        ticketTypeEn: 'Compliance Inquiry',
        customer: 'فهد الدوسري',
        customerEn: 'Fahad Al-Dossary',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedTo: 'عمر الدوسري',
        assignedToEn: 'Omar Al-Dossary',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-23',
        priority: 'High',
        createdDate: '2026-03-15',
    },
    {
        id: 'tb-06',
        ticketId: 'TCK-2026-006',
        subject: 'تعديل الصلاحيات الإدارية على منصة بلدي',
        subjectEn: 'Balady portal admin permission adjustment',
        ticketType: 'الدعم الفني',
        ticketTypeEn: 'Technical Support',
        customer: 'نورة الغامدي',
        customerEn: 'Noura Al-Ghamdi',
        company: 'شركة علم لأمن المعلومات',
        companyEn: 'Elm Info Security',
        assignedTo: 'م. كريم وجدي',
        assignedToEn: 'Eng. Karim Wagdi',
        assignedBy: 'التوجيه الآلي للمنظومة',
        assignedByEn: 'System Auto-Dispatch',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-20',
        priority: 'Low',
        createdDate: '2026-03-14',
    },
    {
        id: 'tb-07',
        ticketId: 'TCK-2026-007',
        subject: 'سداد رسوم المقابل المالي للرخص المهنية',
        subjectEn: 'Professional license financial levy settlement',
        ticketType: 'الفواتير والمدفوعات',
        ticketTypeEn: 'Billing & Payments',
        customer: 'سلطان الحربي',
        customerEn: 'Sultan Al-Harbi',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedTo: 'أحمد السالم',
        assignedToEn: 'Ahmed Al-Salem',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-19',
        priority: 'Medium',
        createdDate: '2026-03-12',
    },
    {
        id: 'tb-08',
        ticketId: 'TCK-2026-008',
        subject: 'تحديث بيانات المفوض بالتوقيع في الغرفة التجارية',
        subjectEn: 'Chamber of commerce signatory update',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'ريم الشهري',
        customerEn: 'Reem Al-Shehri',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedTo: 'فاطمة عبدالفتاح',
        assignedToEn: 'Fatima Abdelfattah',
        assignedBy: 'م. كريم وجدي',
        assignedByEn: 'Eng. Karim Wagdi',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-17',
        priority: 'Low',
        createdDate: '2026-03-11',
    },
    {
        id: 'tb-09',
        ticketId: 'TCK-2026-009',
        subject: 'طباعة شهادة الزكاة وضريبة الدخل',
        subjectEn: 'Zakat & income tax certificate export',
        ticketType: 'استفسار امتثال',
        ticketTypeEn: 'Compliance Inquiry',
        customer: 'عبدالله القحطاني',
        customerEn: 'Abdullah Al-Qahtani',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedTo: 'عمر الدوسري',
        assignedToEn: 'Omar Al-Dossary',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-16',
        priority: 'Low',
        createdDate: '2026-03-10',
    },
    {
        id: 'tb-10',
        ticketId: 'TCK-2026-010',
        subject: 'طلب إعادة فحص مستندات الإلغاء بالسجل التجاري',
        subjectEn: 'CR cancellation document re-examination request',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'سارة الشمري',
        customerEn: 'Sarah Al-Shammari',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedTo: 'م. كريم وجدي',
        assignedToEn: 'Eng. Karim Wagdi',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'pending_agent',
        status: 'reopened',
        closedDate: null,
        priority: 'High',
        createdDate: '2026-03-08',
    },
    {
        id: 'tb-11',
        ticketId: 'TCK-2026-011',
        subject: 'إلغاء تأشيرة خروج وعودة غير مستخدمة',
        subjectEn: 'Unused exit re-entry visa cancellation',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'محمد العتيبي',
        customerEn: 'Mohammed Al-Otaibi',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedTo: 'أحمد السالم',
        assignedToEn: 'Ahmed Al-Salem',
        assignedBy: 'التوجيه الآلي للمنظومة',
        assignedByEn: 'System Auto-Dispatch',
        replyStatus: 'waiting_customer',
        status: 'open',
        closedDate: null,
        priority: 'Medium',
        createdDate: '2026-03-06',
    },
    {
        id: 'tb-12',
        ticketId: 'TCK-2026-012',
        subject: 'إضافة فرع جديد للمنشأة في التأمينات',
        subjectEn: 'Add new establishment branch in GOSI',
        ticketType: 'استفسار امتثال',
        ticketTypeEn: 'Compliance Inquiry',
        customer: 'خالد المطيري',
        customerEn: 'Khalid Al-Mutairi',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedTo: null,
        assignedToEn: null,
        assignedBy: 'التوجيه الآلي للمنظومة',
        assignedByEn: 'System Auto-Dispatch',
        replyStatus: 'pending_agent',
        status: 'open',
        closedDate: null,
        priority: 'High',
        createdDate: '2026-03-05',
    },
    {
        id: 'tb-13',
        ticketId: 'TCK-2026-013',
        subject: 'طلب ربط الحساب البنكي لنظام حماية الأجور',
        subjectEn: 'Bank account connection for WPS',
        ticketType: 'الفواتير والمدفوعات',
        ticketTypeEn: 'Billing & Payments',
        customer: 'فهد الدوسري',
        customerEn: 'Fahad Al-Dossary',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedTo: 'فاطمة عبدالفتاح',
        assignedToEn: 'Fatima Abdelfattah',
        assignedBy: 'م. كريم وجدي',
        assignedByEn: 'Eng. Karim Wagdi',
        replyStatus: 'replied',
        status: 'open',
        closedDate: null,
        priority: 'Medium',
        createdDate: '2026-03-04',
    },
    {
        id: 'tb-14',
        ticketId: 'TCK-2026-014',
        subject: 'تأكيد صحة عقد العمل الإلكتروني',
        subjectEn: 'Electronic employment contract validation',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'نورة الغامدي',
        customerEn: 'Noura Al-Ghamdi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedTo: 'عمر الدوسري',
        assignedToEn: 'Omar Al-Dossary',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'waiting_customer',
        status: 'open',
        closedDate: null,
        priority: 'Low',
        createdDate: '2026-03-02',
    },
    {
        id: 'tb-15',
        ticketId: 'TCK-2026-015',
        subject: 'تحديث هوية مقيم لموظفي المشاريع',
        subjectEn: 'Project personnel Muqeem ID update',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'سلطان الحربي',
        customerEn: 'Sultan Al-Harbi',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedTo: 'م. كريم وجدي',
        assignedToEn: 'Eng. Karim Wagdi',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-12',
        priority: 'Medium',
        createdDate: '2026-02-28',
    },
    {
        id: 'tb-16',
        ticketId: 'TCK-2026-016',
        subject: 'تعديل الاسم التجاري المسجل باللغة الإنجليزية',
        subjectEn: 'Registered English trade name amendment',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'ريم الشهري',
        customerEn: 'Reem Al-Shehri',
        company: 'شركة علم لأمن المعلومات',
        companyEn: 'Elm Info Security',
        assignedTo: 'أحمد السالم',
        assignedToEn: 'Ahmed Al-Salem',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-08',
        priority: 'Low',
        createdDate: '2026-02-26',
    },
    {
        id: 'tb-17',
        ticketId: 'TCK-2026-017',
        subject: 'تفعيل ملف المنشأة لدى وزارة التجارة',
        subjectEn: 'Ministry of Commerce establishment file activation',
        ticketType: 'استفسار امتثال',
        ticketTypeEn: 'Compliance Inquiry',
        customer: 'عبدالله القحطاني',
        customerEn: 'Abdullah Al-Qahtani',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedTo: 'فاطمة عبدالفتاح',
        assignedToEn: 'Fatima Abdelfattah',
        assignedBy: 'م. كريم وجدي',
        assignedByEn: 'Eng. Karim Wagdi',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-05',
        priority: 'High',
        createdDate: '2026-02-24',
    },
    {
        id: 'tb-18',
        ticketId: 'TCK-2026-018',
        subject: 'استرداد مبالغ سداد مقيم المعلقة',
        subjectEn: 'Pending Muqeem SADAD payment refund',
        ticketType: 'الفواتير والمدفوعات',
        ticketTypeEn: 'Billing & Payments',
        customer: 'سارة الشمري',
        customerEn: 'Sarah Al-Shammari',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedTo: 'عمر الدوسري',
        assignedToEn: 'Omar Al-Dossary',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-03-02',
        priority: 'Medium',
        createdDate: '2026-02-20',
    },
    {
        id: 'tb-19',
        ticketId: 'TCK-2026-019',
        subject: 'نقل خدمات وافد بموافقة المنشأة السابقة',
        subjectEn: 'Employee transfer with prior establishment approval',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'محمد العتيبي',
        customerEn: 'Mohammed Al-Otaibi',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedTo: 'م. كريم وجدي',
        assignedToEn: 'Eng. Karim Wagdi',
        assignedBy: 'التوجيه الآلي للمنظومة',
        assignedByEn: 'System Auto-Dispatch',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-02-28',
        priority: 'High',
        createdDate: '2026-02-18',
    },
    {
        id: 'tb-20',
        ticketId: 'TCK-2026-020',
        subject: 'إصدار تصريح عمل لموظف تحت التدريب',
        subjectEn: 'Trainee work permit issuance',
        ticketType: 'طلب إداري',
        ticketTypeEn: 'Administrative Request',
        customer: 'خالد المطيري',
        customerEn: 'Khalid Al-Mutairi',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedTo: 'أحمد السالم',
        assignedToEn: 'Ahmed Al-Salem',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-02-25',
        priority: 'Low',
        createdDate: '2026-02-15',
    },
    {
        id: 'tb-21',
        ticketId: 'TCK-2026-021',
        subject: 'تحميل بيان الرواتب الشهري في مدد',
        subjectEn: 'Upload monthly salary statement to Mudad',
        ticketType: 'الفواتير والمدفوعات',
        ticketTypeEn: 'Billing & Payments',
        customer: 'فهد الدوسري',
        customerEn: 'Fahad Al-Dossary',
        company: 'مؤسسة الرياض للحلول التقنية',
        companyEn: 'Riyadh Tech Solutions',
        assignedTo: null,
        assignedToEn: null,
        assignedBy: 'التوجيه الآلي للمنظومة',
        assignedByEn: 'System Auto-Dispatch',
        replyStatus: 'replied',
        status: 'closed',
        closedDate: '2026-02-20',
        priority: 'Medium',
        createdDate: '2026-02-10',
    },
    {
        id: 'tb-22',
        ticketId: 'TCK-2026-022',
        subject: 'اعتراض على مخالفة تأخير توثيق العقود',
        subjectEn: 'Objection against contract verification delay penalty',
        ticketType: 'استفسار امتثال',
        ticketTypeEn: 'Compliance Inquiry',
        customer: 'عبدالله القحطاني',
        customerEn: 'Abdullah Al-Qahtani',
        company: 'شركة الراجحي للصناعات',
        companyEn: 'Al Rajhi Industries',
        assignedTo: 'فاطمة عبدالفتاح',
        assignedToEn: 'Fatima Abdelfattah',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'waiting_customer',
        status: 'reopened',
        closedDate: null,
        priority: 'High',
        createdDate: '2026-02-08',
    },
    {
        id: 'tb-23',
        ticketId: 'TCK-2026-023',
        subject: 'طلب ترقية الباقة الشهرية للبوابة الرقمية',
        subjectEn: 'Digital portal monthly subscription upgrade',
        ticketType: 'الفواتير والمدفوعات',
        ticketTypeEn: 'Billing & Payments',
        customer: 'سارة الشمري',
        customerEn: 'Sarah Al-Shammari',
        company: 'مجموعة الفوزان القابضة',
        companyEn: 'Al Fozan Holding',
        assignedTo: 'م. كريم وجدي',
        assignedToEn: 'Eng. Karim Wagdi',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'replied',
        status: 'open',
        closedDate: null,
        priority: 'Medium',
        createdDate: '2026-02-05',
    },
    {
        id: 'tb-24',
        ticketId: 'TCK-2026-024',
        subject: 'تسجيل الدخول الموحد عبر النفاذ الوطني',
        subjectEn: 'SSO configuration via National Nafath',
        ticketType: 'الدعم الفني',
        ticketTypeEn: 'Technical Support',
        customer: 'محمد العتيبي',
        customerEn: 'Mohammed Al-Otaibi',
        company: 'شركة المراعي للتجارة',
        companyEn: 'Almarai Trading',
        assignedTo: 'أحمد السالم',
        assignedToEn: 'Ahmed Al-Salem',
        assignedBy: 'التوجيه الآلي للمنظومة',
        assignedByEn: 'System Auto-Dispatch',
        replyStatus: 'pending_agent',
        status: 'open',
        closedDate: null,
        priority: 'High',
        createdDate: '2026-02-02',
    },
    {
        id: 'tb-25',
        ticketId: 'TCK-2026-025',
        subject: 'فحص توافق أرقام الآيبان للتحويلات الحكومية',
        subjectEn: 'IBAN compatibility check for gov payments',
        ticketType: 'الفواتير والمدفوعات',
        ticketTypeEn: 'Billing & Payments',
        customer: 'فهد الدوسري',
        customerEn: 'Fahad Al-Dossary',
        company: 'شركة دار الأركان للتطوير',
        companyEn: 'Dar Al Arkan Dev',
        assignedTo: 'عمر الدوسري',
        assignedToEn: 'Omar Al-Dossary',
        assignedBy: 'مشرف العمليات',
        assignedByEn: 'Operations Supervisor',
        replyStatus: 'waiting_customer',
        status: 'reopened',
        closedDate: null,
        priority: 'Low',
        createdDate: '2026-01-29',
    },
];

export const TICKET_CUSTOMER_OPTIONS: TicketSelectOption[] = [
    { value: 'Abdullah Al-Qahtani', ar: 'عبدالله القحطاني', en: 'Abdullah Al-Qahtani' },
    { value: 'Sarah Al-Shammari', ar: 'سارة الشمري', en: 'Sarah Al-Shammari' },
    { value: 'Mohammed Al-Otaibi', ar: 'محمد العتيبي', en: 'Mohammed Al-Otaibi' },
    { value: 'Khalid Al-Mutairi', ar: 'خالد المطيري', en: 'Khalid Al-Mutairi' },
    { value: 'Fahad Al-Dossary', ar: 'فهد الدوسري', en: 'Fahad Al-Dossary' },
    { value: 'Noura Al-Ghamdi', ar: 'نورة الغامدي', en: 'Noura Al-Ghamdi' },
    { value: 'Sultan Al-Harbi', ar: 'سلطان الحربي', en: 'Sultan Al-Harbi' },
    { value: 'Reem Al-Shehri', ar: 'ريم الشهري', en: 'Reem Al-Shehri' },
];

export const TICKET_COMPANY_OPTIONS: TicketSelectOption[] = [
    { value: 'Al Rajhi Industries', ar: 'شركة الراجحي للصناعات', en: 'Al Rajhi Industries' },
    { value: 'Al Fozan Holding', ar: 'مجموعة الفوزان القابضة', en: 'Al Fozan Holding' },
    { value: 'Almarai Trading', ar: 'شركة المراعي للتجارة', en: 'Almarai Trading' },
    { value: 'Dar Al Arkan Dev', ar: 'شركة دار الأركان للتطوير', en: 'Dar Al Arkan Dev' },
    { value: 'Riyadh Tech Solutions', ar: 'مؤسسة الرياض للحلول التقنية', en: 'Riyadh Tech Solutions' },
    { value: 'Elm Info Security', ar: 'شركة علم لأمن المعلومات', en: 'Elm Info Security' },
];

export const TICKET_PRIORITY_OPTIONS: Array<'High' | 'Medium' | 'Low'> = [
    'High',
    'Medium',
    'Low',
];

export const TICKET_STATUS_OPTIONS: TicketLifecycleStatus[] = [
    'NEW',
    'OPEN',
    'IN PROGRESS',
    'SOLVED',
    'CLOSED',
];

const SOLVED_SEED_IDS = new Set(['tb-04', 'tb-05', 'tb-06', 'tb-07', 'tb-08']);

export function normalizeTicketStatus(
    ticketOrStatus: Pick<TableTicket, 'id' | 'status' | 'replyStatus' | 'assignedTo'> | string
): TicketLifecycleStatus {
    if (typeof ticketOrStatus === 'string') {
        const upper = ticketOrStatus.trim().toUpperCase();
        if (upper === 'NEW') return 'NEW';
        if (upper === 'OPEN') return 'OPEN';
        if (upper === 'IN PROGRESS' || upper === 'IN_PROGRESS' || upper === 'REOPENED') {
            return 'IN PROGRESS';
        }
        if (upper === 'SOLVED') return 'SOLVED';
        if (upper === 'CLOSED') return 'CLOSED';
        return 'OPEN';
    }

    const raw = (ticketOrStatus.status || '').trim();
    const upper = raw.toUpperCase();
    if (
        upper === 'NEW' ||
        upper === 'OPEN' ||
        upper === 'IN PROGRESS' ||
        upper === 'SOLVED' ||
        upper === 'CLOSED'
    ) {
        return upper as TicketLifecycleStatus;
    }

    if (raw === 'reopened') {
        return 'IN PROGRESS';
    }
    if (raw === 'closed') {
        return SOLVED_SEED_IDS.has(ticketOrStatus.id) ? 'SOLVED' : 'CLOSED';
    }
    // raw === 'open'
    if (!ticketOrStatus.assignedTo && ticketOrStatus.replyStatus === 'pending_agent') {
        return 'NEW';
    }
    if (ticketOrStatus.replyStatus === 'waiting_customer') {
        return 'IN PROGRESS';
    }
    return 'OPEN';
}

function normalizeTicketRecord(ticket: TableTicket): TableTicket {
    return {
        ...ticket,
        status: normalizeTicketStatus(ticket),
    };
}

const DEFAULT_TICKET_TYPE_OPTIONS: TicketSelectOption[] = [
    { value: 'Technical Support', ar: 'الدعم الفني', en: 'Technical Support' },
    { value: 'Billing & Payments', ar: 'الفواتير والمدفوعات', en: 'Billing & Payments' },
    { value: 'Administrative Request', ar: 'طلب إداري', en: 'Administrative Request' },
    { value: 'Compliance Inquiry', ar: 'استفسار امتثال', en: 'Compliance Inquiry' },
];

// --- Shared Types & Aliases for Full Ticketing Module Persistence ---

export type TicketRecord = TableTicket;

export interface TicketTypeRecord {
    id: string;
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    ticketsCount: number;
    status?: 'active' | 'inactive';
    createdBy: string;
    createdByAr?: string;
    createdAt: string;
}

export interface CannedReplyRecord {
    id: string;
    title: string;
    titleAr: string;
    reply: string;
    replyAr: string;
    category?: string;
    categoryAr?: string;
    createdBy: string;
    createdByAr?: string;
    createdAt: string;
}

export type TicketAuditAction = 'CREATED' | 'UPDATED' | 'DELETED';

export interface TicketAuditRecord {
    id: string;
    action: TicketAuditAction;
    resource: string;
    resourceAr?: string;
    resourceData: string;
    resourceDataAr?: string;
    performedBy: string;
    performedByAr?: string;
    dateTime: string;
    details?: string;
    detailsAr?: string;
}

export interface CreateTicketAuditRecordInput {
    id?: string;
    action: TicketAuditAction;
    resource: string;
    resourceAr?: string;
    resourceData: string;
    resourceDataAr?: string;
    performedBy?: string;
    performedByAr?: string;
    dateTime?: string;
    details?: string;
    detailsAr?: string;
}

// --- Seed Collections ---

export const INITIAL_TICKETS: TableTicket[] = DEMO_TABLE_TICKETS.map(normalizeTicketRecord);

export const INITIAL_TICKET_TYPES: TicketTypeRecord[] = [
    {
        id: 'tt-01',
        name: 'Technical Support',
        nameAr: 'الدعم الفني',
        description: 'Platform integration, API connectivity, SSO, and technical troubleshooting.',
        descriptionAr: 'دعم التكامل التقني وربط واجهات برمجة التطبيقات والدخول الموحد ومعالجة الأعطال.',
        ticketsCount: 8,
        status: 'active',
        createdBy: 'System Admin',
        createdByAr: 'مدير النظام',
        createdAt: '2026-01-10 09:00:00 AM',
    },
    {
        id: 'tt-02',
        name: 'Billing & Payments',
        nameAr: 'الفواتير والمدفوعات',
        description: 'SADAD bills, package subscriptions, fee refunds, and VAT/ZATCA invoices.',
        descriptionAr: 'فواتير سداد واشتراكات الباقات واسترداد الرسوم والفواتير الضريبية.',
        ticketsCount: 6,
        status: 'active',
        createdBy: 'System Admin',
        createdByAr: 'مدير النظام',
        createdAt: '2026-01-10 09:15:00 AM',
    },
    {
        id: 'tt-03',
        name: 'Administrative Request',
        nameAr: 'طلب إداري',
        description: 'Account permissions, commercial registration updates, and signatory changes.',
        descriptionAr: 'الصلاحيات الإدارية وتحديثات السجل التجاري وبيانات المفوضين بالتوقيع.',
        ticketsCount: 6,
        status: 'active',
        createdBy: 'Operations Supervisor',
        createdByAr: 'مشرف العمليات',
        createdAt: '2026-01-12 11:30:00 AM',
    },
    {
        id: 'tt-04',
        name: 'Compliance Inquiry',
        nameAr: 'استفسار امتثال',
        description: 'Nitaqat Saudization, Wage Protection System (WPS), and regulatory compliance.',
        descriptionAr: 'استفسارات التوطين ونطاقات ونظام حماية الأجور والالتزام التنظيمي.',
        ticketsCount: 5,
        status: 'active',
        createdBy: 'Operations Supervisor',
        createdByAr: 'مشرف العمليات',
        createdAt: '2026-01-14 02:20:00 PM',
    },
    {
        id: 'tt-05',
        name: 'Muqeem & Visa Services',
        nameAr: 'خدمات مقيم والتأشيرات',
        description: 'Iqama renewals, exit/re-entry visas, and expatriate sponsorship transfers.',
        descriptionAr: 'تجديد الإقامات وتأشيرات الخروج والعودة ونقل خدمات الوافدين عبر بوابة مقيم.',
        ticketsCount: 4,
        status: 'active',
        createdBy: 'Eng. Karim Wagdi',
        createdByAr: 'م. كريم وجدي',
        createdAt: '2026-01-18 10:05:00 AM',
    },
    {
        id: 'tt-06',
        name: 'Qiwa & Labor Contracts',
        nameAr: 'منصة قوى وعقود العمل',
        description: 'Employment contract authentication, work permits, and internal work policies.',
        descriptionAr: 'توثيق عقود العمل ورخص العمل ولوائح تنظيم العمل عبر منصة قوى.',
        ticketsCount: 5,
        status: 'active',
        createdBy: 'Fatima Abdelfattah',
        createdByAr: 'فاطمة عبدالفتاح',
        createdAt: '2026-01-22 01:45:00 PM',
    },
    {
        id: 'tt-07',
        name: 'Mudad & Wage Protection',
        nameAr: 'منصة مدد وحماية الأجور',
        description: 'SIF payroll file uploads, bank IBAN linking, and wage compliance justifications.',
        descriptionAr: 'رفع ملفات الرواتب بصيغة SIF وربط الآيبان البنكي وتبرير ملاحظات حماية الأجور.',
        ticketsCount: 3,
        status: 'active',
        createdBy: 'Ahmed Al-Salem',
        createdByAr: 'أحمد السالم',
        createdAt: '2026-02-01 03:10:00 PM',
    },
    {
        id: 'tt-08',
        name: 'ZATCA & Tax Compliance',
        nameAr: 'هيئة الزكاة والضريبة والجمارك',
        description: 'Zakat certificates, VAT filing support, and installment plan requests.',
        descriptionAr: 'شهادات الزكاة والإقرارات الضريبية وطلبات تقسيط المستحقات لدى هيئة الزكاة.',
        ticketsCount: 3,
        status: 'active',
        createdBy: 'Omar Al-Dossary',
        createdByAr: 'عمر الدوسري',
        createdAt: '2026-02-09 10:40:00 AM',
    },
];

export const INITIAL_CANNED_REPLIES: CannedReplyRecord[] = [
    {
        id: 'cr-01',
        title: 'Muqeem API Gateway Verification',
        titleAr: 'تأكيد فحص ربط بوابة مقيم الإلكترونية',
        reply: 'Dear Customer, we have reviewed your Muqeem gateway credentials and refreshed the integration token. Please retry the operation and confirm if the connection succeeds.',
        replyAr: 'عزيزنا العميل، تمت مراجعة بيانات الربط الخاصة ببوابة مقيم وتحديث رمز التكامل. يرجى إعادة المحاولة وتأكيد نجاح الاتصال.',
        category: 'Technical Support',
        categoryAr: 'الدعم الفني',
        createdBy: 'Eng. Karim Wagdi',
        createdByAr: 'م. كريم وجدي',
        createdAt: '2026-01-15 10:15:00 AM',
    },
    {
        id: 'cr-02',
        title: 'SADAD Payment Reconciliation Confirmation',
        titleAr: 'تأكيد مطابقة سداد الفاتورة الحكومية',
        reply: 'Dear Customer, your SADAD payment reference has been reconciled and reflected on your enterprise account. The updated invoice receipt is now available for download.',
        replyAr: 'عزيزنا العميل، تمت مطابقة مرجع سداد الفاتورة الحكومية وتحديث حالة الحساب بنجاح. يمكنكم الآن تحميل إيصال السداد المحدث.',
        category: 'Billing & Payments',
        categoryAr: 'الفواتير والمدفوعات',
        createdBy: 'Ahmed Al-Salem',
        createdByAr: 'أحمد السالم',
        createdAt: '2026-01-18 12:30:00 PM',
    },
    {
        id: 'cr-03',
        title: 'Qiwa Contract Authentication Follow-up',
        titleAr: 'متابعة توثيق عقود العمل في منصة قوى',
        reply: 'Dear Customer, the employment contracts have been submitted to Qiwa and are currently awaiting employee acceptance via Absher/Qiwa.',
        replyAr: 'عزيزنا العميل، تم رفع عقود العمل عبر منصة قوى وهي بانتظار اعتماد الموظف عبر حسابه في قوى أو أبشر.',
        category: 'Qiwa & Labor Contracts',
        categoryAr: 'منصة قوى وعقود العمل',
        createdBy: 'Fatima Abdelfattah',
        createdByAr: 'فاطمة عبدالفتاح',
        createdAt: '2026-01-22 02:00:00 PM',
    },
    {
        id: 'cr-04',
        title: 'Mudad SIF File Format Guidelines',
        titleAr: 'إرشادات تصحيح ملف حماية الأجور (SIF) في مدد',
        reply: 'Please ensure the SIF file uses UTF-8 encoding without BOM, valid 24-character Saudi IBANs starting with SA, and matches the GOSI active subscriber list.',
        replyAr: 'يرجى التأكد من حفظ ملف الرواتب بصيغة SIF بترميز UTF-8، ومطابقة أرقام الآيبان المكونة من 24 خانة والتي تبدأ بـ SA مع قائمة المشتركين النشطين في التأمينات.',
        category: 'Mudad & Wage Protection',
        categoryAr: 'منصة مدد وحماية الأجور',
        createdBy: 'Eng. Karim Wagdi',
        createdByAr: 'م. كريم وجدي',
        createdAt: '2026-01-28 09:45:00 AM',
    },
    {
        id: 'cr-05',
        title: 'Commercial Registration Sync Completed',
        titleAr: 'اكتمال مزامنة بيانات السجل التجاري',
        reply: 'Your Commercial Registration (CR) details and authorized signatory records have been synchronized with the Ministry of Commerce and Chamber of Commerce portals.',
        replyAr: 'تمت مزامنة بيانات السجل التجاري وقائمة المفوضين بالتوقيع بنجاح مع بوابة وزارة التجارة والغرفة التجارية.',
        category: 'Administrative Request',
        categoryAr: 'طلب إداري',
        createdBy: 'Omar Al-Dossary',
        createdByAr: 'عمر الدوسري',
        createdAt: '2026-02-03 11:20:00 AM',
    },
    {
        id: 'cr-06',
        title: 'Requesting Missing Authorization Documents',
        titleAr: 'طلب استكمال مستندات التفويض الرسمي',
        reply: 'To proceed with your administrative request, please attach the stamped Chamber of Commerce authorization letter and a valid National ID copy of the delegate.',
        replyAr: 'لاستكمال معالجة طلبكم الإداري، يرجى إرفاق خطاب التفويض المصدق من الغرفة التجارية وصورة الهوية الوطنية السارية للمفوض.',
        category: 'Administrative Request',
        categoryAr: 'طلب إداري',
        createdBy: 'Operations Supervisor',
        createdByAr: 'مشرف العمليات',
        createdAt: '2026-02-08 04:10:00 PM',
    },
    {
        id: 'cr-07',
        title: 'Nitaqat & Saudization Calculation Breakdown',
        titleAr: 'توضيح آلية احتساب نسبة التوطين في نطاقات',
        reply: 'We have attached the detailed Saudization compliance report showing active Saudi employees, GOSI registration weights, and your current Nitaqat tier.',
        replyAr: 'تم إرفاق تقرير الامتثال التفصيلي لنسبة التوطين والذي يوضح أوزان الموظفين السعوديين المسجلين في التأمينات الاجتماعية والنطاق الحالي للمنشأة.',
        category: 'Compliance Inquiry',
        categoryAr: 'استفسار امتثال',
        createdBy: 'Fatima Abdelfattah',
        createdByAr: 'فاطمة عبدالفتاح',
        createdAt: '2026-02-14 01:05:00 PM',
    },
    {
        id: 'cr-08',
        title: 'ZATCA Certificate Issuance Confirmation',
        titleAr: 'تأكيد إصدار شهادة الزكاة وضريبة الدخل',
        reply: 'Your ZATCA compliance certificate has been issued and archived in the Electronic Document Management System (EDMS).',
        replyAr: 'تم إصدار شهادة الالتزام الزكوي والضريبي من هيئة الزكاة والضريبة والجمارك وأرشفتها في نظام إدارة الوثائق الإلكترونية.',
        category: 'ZATCA & Tax Compliance',
        categoryAr: 'هيئة الزكاة والضريبة والجمارك',
        createdBy: 'Omar Al-Dossary',
        createdByAr: 'عمر الدوسري',
        createdAt: '2026-02-19 03:50:00 PM',
    },
];

export const INITIAL_AUDIT_LOGS: TicketAuditRecord[] = [
    {
        id: 'aud-01',
        action: 'CREATED',
        resource: 'Ticket',
        resourceAr: 'تذكرة',
        resourceData: 'TCK-2026-001 — Muqeem API gateway activation request',
        resourceDataAr: 'TCK-2026-001 — طلب تفعيل ربط بوابة مقيم الإلكترونية',
        performedBy: 'System Auto-Dispatch',
        performedByAr: 'التوجيه الآلي للمنظومة',
        dateTime: '2026-03-24 09:14:22 AM',
        details: 'Ticket created for Al Rajhi Industries (High Priority).',
        detailsAr: 'تم إنشاء التذكرة لشركة الراجحي للصناعات (أولوية عالية).',
    },
    {
        id: 'aud-02',
        action: 'UPDATED',
        resource: 'Ticket',
        resourceAr: 'تذكرة',
        resourceData: 'TCK-2026-002 — Qiwa annual platform subscription inquiry',
        resourceDataAr: 'TCK-2026-002 — استفسار بشأن اشتراك منصة قوى السنوي',
        performedBy: 'Ahmed Al-Salem',
        performedByAr: 'أحمد السالم',
        dateTime: '2026-03-23 02:40:10 PM',
        details: 'Assigned to Ahmed Al-Salem; status updated to waiting customer.',
        detailsAr: 'تم إسناد التذكرة إلى أحمد السالم وتحديث حالة الرد إلى بانتظار العميل.',
    },
    {
        id: 'aud-03',
        action: 'UPDATED',
        resource: 'Ticket',
        resourceAr: 'تذكرة',
        resourceData: 'TCK-2026-004 — Saudization & Nitaqat certificate issuance',
        resourceDataAr: 'TCK-2026-004 — إصدار شهادة التوطين والمواءمة',
        performedBy: 'Fatima Abdelfattah',
        performedByAr: 'فاطمة عبدالفتاح',
        dateTime: '2026-03-22 04:15:00 PM',
        details: 'Ticket resolved and status changed to closed.',
        detailsAr: 'تمت معالجة التذكرة وتغيير حالتها إلى مغلقة.',
    },
    {
        id: 'aud-04',
        action: 'UPDATED',
        resource: 'Ticket',
        resourceAr: 'تذكرة',
        resourceData: 'TCK-2026-010 — Re-inspection request for CR cancellation docs',
        resourceDataAr: 'TCK-2026-010 — طلب إعادة فحص مستندات الإلغاء بالسجل التجاري',
        performedBy: 'Support Manager',
        performedByAr: 'مدير الدعم الفني',
        dateTime: '2026-03-14 11:05:45 AM',
        details: 'Ticket reopened for additional compliance document verification.',
        detailsAr: 'تمت إعادة فتح التذكرة لاستكمال تدقيق مستندات الامتثال.',
    },
    {
        id: 'aud-05',
        action: 'CREATED',
        resource: 'Ticket Type',
        resourceAr: 'نوع تذكرة',
        resourceData: 'Mudad & Wage Protection',
        resourceDataAr: 'منصة مدد وحماية الأجور',
        performedBy: 'Ahmed Al-Salem',
        performedByAr: 'أحمد السالم',
        dateTime: '2026-02-01 03:10:00 PM',
        details: 'Created master ticket type for Mudad SIF & WPS support.',
        detailsAr: 'تمت إضافة نوع التذكرة لطلبات منصة مدد وحماية الأجور.',
    },
    {
        id: 'aud-06',
        action: 'CREATED',
        resource: 'Canned Reply',
        resourceAr: 'رد جاهز',
        resourceData: 'ZATCA Certificate Issuance Confirmation',
        resourceDataAr: 'تأكيد إصدار شهادة الزكاة وضريبة الدخل',
        performedBy: 'Omar Al-Dossary',
        performedByAr: 'عمر الدوسري',
        dateTime: '2026-02-19 03:50:00 PM',
        details: 'Added standardized bilingual reply template for ZATCA certificates.',
        detailsAr: 'تمت إضافة قالب رد جاهز ثنائي اللغة لشهادات هيئة الزكاة.',
    },
    {
        id: 'aud-07',
        action: 'DELETED',
        resource: 'Canned Reply',
        resourceAr: 'رد جاهز',
        resourceData: 'Legacy Portal Maintenance Notice (2025)',
        resourceDataAr: 'إشعار صيانة البوابة القديمة (٢٠٢٥)',
        performedBy: 'System Admin',
        performedByAr: 'مدير النظام',
        dateTime: '2026-01-20 05:00:12 PM',
        details: 'Removed deprecated canned reply template.',
        detailsAr: 'تم حذف قالب الرد الجاهز القديم لانتهاء العمل به.',
    },
];

// --- Versioned LocalStorage Keys ---

const LEGACY_TICKETS_STORAGE_KEY = 'awn_ticketing_custom_tickets_v1';
export const TICKETS_STORAGE_KEY_V2 = 'awn_ticketing_tickets_v2';
export const TICKET_TYPES_STORAGE_KEY = 'awn_ticketing_ticket_types_v1';
export const CANNED_REPLIES_STORAGE_KEY = 'awn_ticketing_canned_replies_v1';
export const TICKET_AUDIT_LOGS_STORAGE_KEY = 'awn_ticketing_audit_logs_v1';

// --- Defensive Storage Utilities ---

function hasLocalStorage(): boolean {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
        return false;
    }
}

function isValidTicketRecord(item: unknown): item is TableTicket {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        typeof candidate.ticketId === 'string' &&
        typeof candidate.subject === 'string'
    );
}

function isValidTicketTypeRecord(item: unknown): item is TicketTypeRecord {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        typeof candidate.name === 'string' &&
        typeof candidate.nameAr === 'string'
    );
}

function isValidCannedReplyRecord(item: unknown): item is CannedReplyRecord {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        typeof candidate.title === 'string' &&
        typeof candidate.reply === 'string'
    );
}

function isValidTicketAuditRecord(item: unknown): item is TicketAuditRecord {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        (candidate.action === 'CREATED' ||
            candidate.action === 'UPDATED' ||
            candidate.action === 'DELETED') &&
        typeof candidate.resource === 'string' &&
        typeof candidate.resourceData === 'string'
    );
}

export function formatNowTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${yyyy}-${mm}-${dd} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
}

// --- 1. Tickets Persistence Helpers ---

export function loadPersistedTickets(): TableTicket[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_TICKETS];
    }
    try {
        const rawV2 = window.localStorage.getItem(TICKETS_STORAGE_KEY_V2);
        if (rawV2 !== null) {
            const parsed = JSON.parse(rawV2);
            if (Array.isArray(parsed)) {
                const valid = parsed.filter(isValidTicketRecord).map(normalizeTicketRecord);
                // If parsed was a non-empty array with zero valid records, treat as corrupted
                if (parsed.length > 0 && valid.length === 0) {
                    return [...INITIAL_TICKETS];
                }
                return valid;
            }
            return [...INITIAL_TICKETS];
        }

        // Migrate legacy v1 custom tickets if present
        const rawV1 = window.localStorage.getItem(LEGACY_TICKETS_STORAGE_KEY);
        if (rawV1 !== null) {
            const parsedV1 = JSON.parse(rawV1);
            if (Array.isArray(parsedV1)) {
                const validV1 = parsedV1.filter(isValidTicketRecord);
                if (validV1.length > 0) {
                    const byId = new Map<string, TableTicket>();
                    for (const t of validV1) {
                        byId.set(t.id, t);
                    }
                    const merged = [
                        ...validV1.filter(
                            (t) => !INITIAL_TICKETS.some((seed) => seed.id === t.id)
                        ),
                        ...INITIAL_TICKETS.map((seed) => byId.get(seed.id) ?? seed),
                    ];
                    saveTickets(merged);
                    return merged;
                }
            }
        }

        return [...INITIAL_TICKETS];
    } catch {
        return [...INITIAL_TICKETS];
    }
}

export function loadTickets(): TableTicket[] {
    return loadPersistedTickets();
}

export function saveTickets(tickets: TableTicket[]): TableTicket[] {
    const safeList = Array.isArray(tickets)
        ? tickets.filter(isValidTicketRecord).map(normalizeTicketRecord)
        : [...INITIAL_TICKETS];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(TICKETS_STORAGE_KEY_V2, JSON.stringify(safeList));
        } catch {
            // Ignore quota or storage errors
        }
    }
    return safeList;
}

export function saveCustomTicket(ticket: TableTicket): TableTicket[] {
    if (!isValidTicketRecord(ticket)) {
        return loadPersistedTickets();
    }
    const current = loadPersistedTickets();
    const exists = current.some((item) => item.id === ticket.id);
    const next = exists
        ? current.map((item) => (item.id === ticket.id ? ticket : item))
        : [ticket, ...current];
    return saveTickets(next);
}

export function updateTicket(ticket: TableTicket): TableTicket[] {
    if (!isValidTicketRecord(ticket)) {
        return loadPersistedTickets();
    }
    const current = loadPersistedTickets();
    const exists = current.some((item) => item.id === ticket.id);
    const next = exists
        ? current.map((item) => (item.id === ticket.id ? ticket : item))
        : [ticket, ...current];
    return saveTickets(next);
}

export function deleteTicket(ticketId: string): TableTicket[] {
    const current = loadPersistedTickets();
    if (!ticketId || typeof ticketId !== 'string') {
        return current;
    }
    const next = current.filter(
        (item) => item.id !== ticketId && item.ticketId !== ticketId
    );
    return saveTickets(next);
}

// --- 2. Ticket Types Persistence Helpers ---

export function loadTicketTypes(): TicketTypeRecord[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_TICKET_TYPES];
    }
    try {
        const raw = window.localStorage.getItem(TICKET_TYPES_STORAGE_KEY);
        if (raw === null) {
            return [...INITIAL_TICKET_TYPES];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_TICKET_TYPES];
        }
        const valid = parsed.filter(isValidTicketTypeRecord);
        if (parsed.length > 0 && valid.length === 0) {
            return [...INITIAL_TICKET_TYPES];
        }
        return valid;
    } catch {
        return [...INITIAL_TICKET_TYPES];
    }
}

export function saveTicketTypes(types: TicketTypeRecord[]): TicketTypeRecord[] {
    const safeList = Array.isArray(types)
        ? types.filter(isValidTicketTypeRecord)
        : [...INITIAL_TICKET_TYPES];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(TICKET_TYPES_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

export function getActiveTicketTypeOptions(): TicketSelectOption[] {
    try {
        const types = loadTicketTypes().filter((t) => t.status !== 'inactive');
        if (types.length === 0) {
            return DEFAULT_TICKET_TYPE_OPTIONS;
        }
        return types.map((t) => ({
            value: t.name,
            ar: t.nameAr || t.name,
            en: t.name || t.nameAr,
        }));
    } catch {
        return DEFAULT_TICKET_TYPE_OPTIONS;
    }
}

// --- 3. Canned Replies Persistence Helpers ---

export function loadCannedReplies(): CannedReplyRecord[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_CANNED_REPLIES];
    }
    try {
        const raw = window.localStorage.getItem(CANNED_REPLIES_STORAGE_KEY);
        if (raw === null) {
            return [...INITIAL_CANNED_REPLIES];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_CANNED_REPLIES];
        }
        const valid = parsed.filter(isValidCannedReplyRecord);
        if (parsed.length > 0 && valid.length === 0) {
            return [...INITIAL_CANNED_REPLIES];
        }
        return valid;
    } catch {
        return [...INITIAL_CANNED_REPLIES];
    }
}

export function saveCannedReplies(replies: CannedReplyRecord[]): CannedReplyRecord[] {
    const safeList = Array.isArray(replies)
        ? replies.filter(isValidCannedReplyRecord)
        : [...INITIAL_CANNED_REPLIES];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(CANNED_REPLIES_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

// --- 4 & 5. Audit Logs Persistence & Normalization Helpers ---

function resolveAuditResourceAr(resource: string, explicitResourceAr?: string): string {
    if (explicitResourceAr && explicitResourceAr.trim()) {
        return explicitResourceAr.trim();
    }
    const normalized = resource.trim().toLowerCase();
    if (normalized === 'ticket') return 'تذكرة';
    if (normalized === 'ticket type') return 'نوع تذكرة';
    if (normalized === 'canned reply') return 'رد جاهز';
    return resource;
}

export function createTicketAuditRecord(
    input: CreateTicketAuditRecordInput
): TicketAuditRecord {
    const resource = input.resource?.trim() || 'Ticket';
    const performedBy = input.performedBy?.trim() || 'System Admin';
    const performedByAr =
        input.performedByAr?.trim() ||
        (performedBy === 'System Admin' || performedBy === 'Admin'
            ? 'مدير النظام'
            : performedBy);

    return {
        id:
            input.id?.trim() ||
            `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action: input.action,
        resource,
        resourceAr: resolveAuditResourceAr(resource, input.resourceAr),
        resourceData: input.resourceData?.trim() || '—',
        resourceDataAr:
            input.resourceDataAr?.trim() || input.resourceData?.trim() || '—',
        performedBy,
        performedByAr,
        dateTime: input.dateTime?.trim() || formatNowTimestamp(),
        details: input.details?.trim(),
        detailsAr: input.detailsAr?.trim(),
    };
}

export function loadTicketAuditLogs(): TicketAuditRecord[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_AUDIT_LOGS];
    }
    try {
        const raw = window.localStorage.getItem(TICKET_AUDIT_LOGS_STORAGE_KEY);
        if (raw === null) {
            return [...INITIAL_AUDIT_LOGS];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_AUDIT_LOGS];
        }
        const valid = parsed.filter(isValidTicketAuditRecord);
        if (parsed.length > 0 && valid.length === 0) {
            return [...INITIAL_AUDIT_LOGS];
        }
        return valid;
    } catch {
        return [...INITIAL_AUDIT_LOGS];
    }
}

export function saveTicketAuditLogs(logs: TicketAuditRecord[]): TicketAuditRecord[] {
    const safeList = Array.isArray(logs)
        ? logs.filter(isValidTicketAuditRecord)
        : [...INITIAL_AUDIT_LOGS];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(
                TICKET_AUDIT_LOGS_STORAGE_KEY,
                JSON.stringify(safeList)
            );
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

export function prependTicketAuditLog(
    log: TicketAuditRecord | CreateTicketAuditRecordInput
): TicketAuditRecord[] {
    const normalized = isValidTicketAuditRecord(log)
        ? log
        : createTicketAuditRecord(log);
    const current = loadTicketAuditLogs();
    const filtered = current.filter((item) => item.id !== normalized.id);
    const next = [normalized, ...filtered];
    return saveTicketAuditLogs(next);
}



