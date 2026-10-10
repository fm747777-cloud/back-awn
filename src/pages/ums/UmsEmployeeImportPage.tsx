import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    ArrowRight,
    UploadCloud,
    FileSpreadsheet,
    FileArchive,
    FileText,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Download,
    Sparkles,
    Trash2,
    ChevronDown,
    ChevronUp,
    Building2,
    Briefcase,
    MapPin,
    ShieldCheck,
    BookOpen,
    Users,
    Check,
    ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import {
    loadEmployees,
    loadDepartments,
    loadDesignations,
    loadBranches,
    loadRoles,
    loadCustomAddons,
    EMPLOYEE_IMPORT_REQUIRED_HEADERS,
    EMPLOYEE_IMPORT_ALL_HEADERS,
    validateEmployeeImportBatch,
    commitEmployeeImportBatch,
    generateEmployeeSampleCsvContent,
    generateEmployeeValidationRulesDocument,
    generateEmployeeSampleZipBytes,
    extractCsvFromZipBytes,
    type EmployeeImportValidationSummary,
    type EmployeeImportCommitResult,
} from './umsMockData';

const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatSarCurrency(amount: number, isRtl: boolean): string {
    const formatted = Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    return isRtl ? `${formatted} ر.س` : `SAR ${formatted}`;
}

type PreviewFilterTab = 'all' | 'valid' | 'invalid';

export const UmsEmployeeImportPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar');
    const currentUser = useAuthStore((s) => s.user);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Master datasets for reference guide & live validation
    const [existingEmployees, setExistingEmployees] = useState(() => loadEmployees());
    const [departments] = useState(() => loadDepartments());
    const [designations] = useState(() => loadDesignations());
    const [branches] = useState(() => loadBranches());
    const [roles] = useState(() => loadRoles());
    const [customAddons] = useState(() => loadCustomAddons());

    // File & Validation State
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [selectedFileSizeKb, setSelectedFileSizeKb] = useState<number>(0);
    const [csvRawContent, setCsvRawContent] = useState<string>('');
    const [previewTab, setPreviewTab] = useState<PreviewFilterTab>('all');
    const [showReferenceCodes, setShowReferenceCodes] = useState<boolean>(false);
    const [commitResult, setCommitResult] = useState<EmployeeImportCommitResult | null>(null);

    const validationSummary: EmployeeImportValidationSummary | null = useMemo(() => {
        if (!csvRawContent) return null;
        return validateEmployeeImportBatch(csvRawContent, {
            existingEmployees,
            departments,
            designations,
            branches,
            roles,
            customAddons,
            actorName: currentUser?.fullName || 'Karim Wagdi',
        });
    }, [
        csvRawContent,
        existingEmployees,
        departments,
        designations,
        branches,
        roles,
        customAddons,
        currentUser?.fullName,
    ]);

    const filteredRows = useMemo(() => {
        if (!validationSummary) return [];
        if (previewTab === 'valid') {
            return validationSummary.rows.filter((r) => r.status === 'valid');
        }
        if (previewTab === 'invalid') {
            return validationSummary.rows.filter((r) => r.status === 'invalid');
        }
        return validationSummary.rows;
    }, [validationSummary, previewTab]);

    const optionalHeaders = useMemo(() => {
        const reqSet = new Set<string>(EMPLOYEE_IMPORT_REQUIRED_HEADERS);
        return EMPLOYEE_IMPORT_ALL_HEADERS.filter((h) => !reqSet.has(h));
    }, []);

    // Download helpers
    const triggerBrowserDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadSampleZip = () => {
        const zipBytes = generateEmployeeSampleZipBytes();
        const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
            type: 'application/zip',
        });
        triggerBrowserDownload(blob, 'AWN_Employees_Import_Sample_Package.zip');
        toast.success(t('ums.employees.import.feedback.sampleZipDownloaded'));
    };

    const handleDownloadCsvTemplate = () => {
        const csvContent = generateEmployeeSampleCsvContent();
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        triggerBrowserDownload(blob, 'AWN_Employees_Import_Template.csv');
        toast.success(t('ums.employees.import.feedback.sampleCsvDownloaded'));
    };

    const handleDownloadRulesTxt = () => {
        const rulesText = generateEmployeeValidationRulesDocument();
        const blob = new Blob([rulesText], {
            type: 'text/plain;charset=utf-8;',
        });
        triggerBrowserDownload(blob, 'AWN_Employees_Validation_Rules.txt');
        toast.success(t('ums.employees.import.feedback.rulesTxtDownloaded'));
    };

    const handleLoadSampleBatchPreview = () => {
        const sampleCsv = generateEmployeeSampleCsvContent();
        setSelectedFileName('AWN_Employees_Import_Template.csv');
        setSelectedFileSizeKb(
            Math.max(1, Math.round((new TextEncoder().encode(sampleCsv).length / 1024) * 10) / 10)
        );
        setCsvRawContent(sampleCsv);
        setPreviewTab('all');
        setCommitResult(null);
        toast.success(t('ums.employees.import.feedback.sampleLoaded'));
    };

    const processUploadedFile = (file: File) => {
        const lowerName = file.name.toLowerCase();
        const isCsv =
            lowerName.endsWith('.csv') ||
            file.type === 'text/csv' ||
            file.type === 'application/vnd.ms-excel';
        const isZip =
            lowerName.endsWith('.zip') ||
            file.type === 'application/zip' ||
            file.type === 'application/x-zip-compressed';

        if (!isCsv && !isZip) {
            toast.error(t('ums.employees.import.feedback.invalidFileType'));
            return;
        }

        if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
            toast.error(t('ums.employees.import.feedback.fileTooLarge'));
            return;
        }

        const reader = new FileReader();
        if (isZip) {
            reader.onload = () => {
                if (!(reader.result instanceof ArrayBuffer)) {
                    toast.error(t('ums.employees.import.feedback.fileReadError'));
                    return;
                }
                const extracted = extractCsvFromZipBytes(new Uint8Array(reader.result));
                if (!extracted.found || !extracted.csvContent) {
                    toast.error(
                        (isRtl ? extracted.errorAr : extracted.errorEn) ||
                            t('ums.employees.import.feedback.invalidFileType')
                    );
                    return;
                }
                setSelectedFileName(`${file.name} (${extracted.fileName})`);
                setSelectedFileSizeKb(Math.max(1, Math.round((file.size / 1024) * 10) / 10));
                setCsvRawContent(extracted.csvContent);
                setPreviewTab('all');
                setCommitResult(null);
            };
            reader.onerror = () => {
                toast.error(t('ums.employees.import.feedback.fileReadError'));
            };
            reader.readAsArrayBuffer(file);
            return;
        }

        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            setSelectedFileName(file.name);
            setSelectedFileSizeKb(Math.max(1, Math.round((file.size / 1024) * 10) / 10));
            setCsvRawContent(text);
            setPreviewTab('all');
            setCommitResult(null);
        };
        reader.onerror = () => {
            toast.error(t('ums.employees.import.feedback.fileReadError'));
        };
        reader.readAsText(file, 'utf-8');
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processUploadedFile(file);
        }
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processUploadedFile(file);
        }
    };

    const handleClearFile = () => {
        setSelectedFileName('');
        setSelectedFileSizeKb(0);
        setCsvRawContent('');
        setPreviewTab('all');
        setCommitResult(null);
    };

    const handleCommitImport = () => {
        if (
            !validationSummary ||
            !validationSummary.fileValid ||
            validationSummary.validRowsCount === 0
        ) {
            toast.error(t('ums.employees.import.feedback.noValidRows'));
            return;
        }

        const result = commitEmployeeImportBatch({
            validationSummary,
            fileName: selectedFileName || 'batch_import.csv',
            actorName: currentUser?.fullName || 'Karim Wagdi',
            actorEmail: 'karim@awn.sa',
        });

        setExistingEmployees(loadEmployees());
        setCommitResult(result);

        if (result.importedCount > 0) {
            toast.success(
                t('ums.employees.import.feedback.importSuccess', {
                    count: result.importedCount,
                })
            );
        } else {
            toast.error(t('ums.employees.import.feedback.noValidRows'));
        }
    };

    return (
        <div className="space-y-6 text-start pb-10">
            {/* Top Navigation & Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees')}
                        className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs shrink-0"
                    >
                        {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                        <span>{t('ums.employees.import.backToDirectory')}</span>
                    </button>

                    <div>
                        <h1 className="text-xl font-bold text-[#0D0D0D] tracking-tight">
                            {t('ums.employees.import.title')}
                        </h1>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('ums.employees.import.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Primary Sample Download Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleLoadSampleBatchPreview}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                    >
                        <Sparkles size={14} />
                        <span>{t('ums.employees.import.loadSamplePreview')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDownloadCsvTemplate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer"
                    >
                        <FileSpreadsheet size={14} className="text-[#1B4D3E]" />
                        <span>{t('ums.employees.import.downloadCsvOnly')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDownloadRulesTxt}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer"
                    >
                        <FileText size={14} className="text-[#6E6862]" />
                        <span>{t('ums.employees.import.downloadRulesOnly')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDownloadSampleZip}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <FileArchive size={14} />
                        <span>{t('ums.employees.import.downloadSampleZip')}</span>
                    </button>
                </div>
            </div>

            {/* Post-Import Completion Banner */}
            {commitResult && (
                <div className="bg-[#EAF3EC] border border-[#265938]/30 rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#265938] text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('ums.employees.import.resultBanner.title')}
                                </h2>
                                <p className="text-xs text-[#265938] font-medium mt-0.5">
                                    {t('ums.employees.import.resultBanner.summary', {
                                        imported: commitResult.importedCount,
                                        rejected: commitResult.rejectedCount,
                                        skipped: commitResult.skippedCount,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClearFile}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer"
                            >
                                <UploadCloud size={13} />
                                <span>{t('ums.employees.import.resultBanner.importAnother')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/ums/employees')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <Users size={13} />
                                <span>{t('ums.employees.import.resultBanner.viewDirectory')}</span>
                            </button>
                        </div>
                    </div>

                    {commitResult.importedEmployees.length > 0 && (
                        <div className="pt-3 border-t border-[#265938]/20 flex flex-wrap items-center gap-2">
                            {commitResult.importedEmployees.map((emp) => (
                                <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => navigate(`/ums/employees/${emp.id}`)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] hover:border-[#2D3F2C] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                                >
                                    <span className="font-mono text-[#2D3F2C]">{emp.code}</span>
                                    <span>{isRtl ? emp.nameAr : emp.nameEn}</span>
                                    <ExternalLink size={11} className="text-[#857E74]" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* File Upload Dropzone Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs space-y-4">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,.zip,application/zip"
                    onChange={handleFileInputChange}
                    className="hidden"
                />

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                        isDragging
                            ? 'border-[#2D3F2C] bg-[#EAF3EC]/50'
                            : 'border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#2D3F2C]/50'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] mx-auto shadow-2xs">
                        <UploadCloud size={22} />
                    </div>
                    <h2 className="text-sm font-bold text-[#0D0D0D] mt-3">
                        {t('ums.employees.import.dropzoneTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862] mt-1 max-w-xl mx-auto">
                        {t('ums.employees.import.dropzoneHint')}
                    </p>

                    <div
                        className="mt-4 flex flex-wrap items-center justify-center gap-2.5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                        >
                            <FileSpreadsheet size={14} />
                            <span>
                                {selectedFileName
                                    ? t('ums.employees.import.replaceFileBtn')
                                    : t('ums.employees.import.selectFileBtn')}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadSampleZip}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer"
                        >
                            <Download size={14} />
                            <span>{t('ums.employees.import.downloadSampleZip')}</span>
                        </button>
                    </div>
                </div>

                {/* Selected File Info Bar + Upload & Import Action */}
                {selectedFileName && (
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E0D8] flex items-center justify-center text-[#1B4D3E] shrink-0">
                                <FileSpreadsheet size={18} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#0D0D0D]">
                                        {selectedFileName}
                                    </span>
                                    <span className="text-[11px] font-mono text-[#6E6862]">
                                        ({selectedFileSizeKb} KB)
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                    {validationSummary?.fileValid
                                        ? `${validationSummary.validRowsCount} / ${validationSummary.totalRows} ${t('ums.employees.import.kpi.validRows')}`
                                        : isRtl
                                        ? validationSummary?.fileErrorAr
                                        : validationSummary?.fileErrorEn}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClearFile}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FEE2E2]/50 border border-[#E5E0D8] text-xs font-semibold text-[#DC2626] transition-colors cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>{t('ums.employees.import.clearFileBtn')}</span>
                            </button>

                            <button
                                type="button"
                                disabled={
                                    !validationSummary ||
                                    !validationSummary.fileValid ||
                                    validationSummary.validRowsCount === 0 ||
                                    Boolean(commitResult)
                                }
                                onClick={handleCommitImport}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
                                    validationSummary &&
                                    validationSummary.fileValid &&
                                    validationSummary.validRowsCount > 0 &&
                                    !commitResult
                                        ? 'bg-[#2D3F2C] hover:bg-[#223121] text-white cursor-pointer'
                                        : 'bg-[#E5E0D8] text-[#857E74] cursor-not-allowed'
                                }`}
                            >
                                <Check size={14} />
                                <span>
                                    {validationSummary && validationSummary.validRowsCount > 0
                                        ? t('ums.employees.import.commitValidRows', {
                                              count: validationSummary.validRowsCount,
                                          })
                                        : t('ums.employees.import.uploadAndImport')}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Master-Data Reference Codes & Required Columns Guide */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                            <BookOpen size={17} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-[#0D0D0D]">
                                {t('ums.employees.import.referenceGuideTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t('ums.employees.import.referenceGuideDesc')}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowReferenceCodes((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer shrink-0"
                    >
                        {showReferenceCodes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>
                            {showReferenceCodes
                                ? t('ums.employees.import.hideReferenceCodes')
                                : t('ums.employees.import.showReferenceCodes')}
                        </span>
                    </button>
                </div>

                {/* Required & Optional Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-[#E5E0D8]">
                    <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                        <span className="text-xs font-bold text-[#0D0D0D] block">
                            {t('ums.employees.import.requiredColumnsTitle')}
                        </span>
                        <div className="flex flex-wrap gap-1.5" dir="ltr">
                            {EMPLOYEE_IMPORT_REQUIRED_HEADERS.map((col) => (
                                <span
                                    key={col}
                                    className="px-2 py-1 rounded bg-white border border-[#2D3F2C]/30 text-[11px] font-mono font-semibold text-[#2D3F2C]"
                                >
                                    {col}*
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                        <span className="text-xs font-bold text-[#0D0D0D] block">
                            {t('ums.employees.import.optionalColumnsTitle')} (
                            {optionalHeaders.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto" dir="ltr">
                            {optionalHeaders.map((col) => (
                                <span
                                    key={col}
                                    className="px-2 py-0.5 rounded bg-white border border-[#E5E0D8] text-[11px] font-mono text-[#6E6862]"
                                >
                                    {col}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {showReferenceCodes && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-3 border-t border-[#E5E0D8] text-xs">
                        {/* Branches */}
                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <span className="font-bold text-[#0D0D0D] flex items-center gap-1.5">
                                <MapPin size={13} className="text-[#2D3F2C]" />
                                {t('ums.employees.import.branchesRef')} ({branches.length})
                            </span>
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                                {branches.map((b) => (
                                    <div
                                        key={b.id}
                                        className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-[#E5E0D8]"
                                    >
                                        <span className="font-mono font-bold text-[#2D3F2C]">
                                            {b.code}
                                        </span>
                                        <span className="text-[#45413C] truncate">
                                            {isRtl ? b.nameAr : b.nameEn}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Departments */}
                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <span className="font-bold text-[#0D0D0D] flex items-center gap-1.5">
                                <Building2 size={13} className="text-[#2D3F2C]" />
                                {t('ums.employees.import.departmentsRef')} ({departments.length})
                            </span>
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                                {departments.map((d) => (
                                    <div
                                        key={d.id}
                                        className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-[#E5E0D8]"
                                    >
                                        <span className="font-mono font-bold text-[#2D3F2C]">
                                            {d.code}
                                        </span>
                                        <span className="text-[#45413C] truncate">
                                            {isRtl ? d.nameAr : d.nameEn}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Designations */}
                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <span className="font-bold text-[#0D0D0D] flex items-center gap-1.5">
                                <Briefcase size={13} className="text-[#2D3F2C]" />
                                {t('ums.employees.import.designationsRef')} ({designations.length})
                            </span>
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                                {designations.map((d) => (
                                    <div
                                        key={d.id}
                                        className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-[#E5E0D8]"
                                    >
                                        <span className="font-mono font-bold text-[#2D3F2C]">
                                            {d.code}
                                        </span>
                                        <span className="text-[#45413C] truncate">
                                            {isRtl ? d.titleAr : d.titleEn}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Roles */}
                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <span className="font-bold text-[#0D0D0D] flex items-center gap-1.5">
                                <ShieldCheck size={13} className="text-[#2D3F2C]" />
                                {t('ums.employees.import.rolesRef')} ({roles.length})
                            </span>
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                                {roles.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-[#E5E0D8]"
                                    >
                                        <span className="font-mono font-bold text-[#2D3F2C]">
                                            {r.code}
                                        </span>
                                        <span className="text-[#45413C] truncate">
                                            {isRtl ? r.nameAr : r.nameEn}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Addons */}
                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2 md:col-span-2">
                            <span className="font-bold text-[#0D0D0D] flex items-center gap-1.5">
                                <FileText size={13} className="text-[#2D3F2C]" />
                                {t('ums.employees.import.addonsRef')} ({customAddons.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                                {customAddons.map((a) => (
                                    <div
                                        key={a.id}
                                        className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-[#E5E0D8]"
                                    >
                                        <span className="font-mono font-bold text-[#2D3F2C]">
                                            {a.code} ({a.type})
                                        </span>
                                        <span className="text-[#45413C] truncate">
                                            {isRtl ? a.nameAr : a.nameEn}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* File-level Error Alert (if missing required headers or malformed CSV) */}
            {validationSummary && !validationSummary.fileValid && (
                <div className="bg-[#FEE2E2]/40 border border-[#DC2626]/40 rounded-xl p-5 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                        <XCircle size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#0D0D0D]">
                            {isRtl
                                ? validationSummary.fileErrorAr
                                : validationSummary.fileErrorEn}
                        </h3>
                        {validationSummary.missingRequiredHeaders.length > 0 && (
                            <p className="text-xs text-[#6E6862] mt-1 font-mono" dir="ltr">
                                Missing: {validationSummary.missingRequiredHeaders.join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Validation Summary KPI Cards + Preview Table */}
            {validationSummary && validationSummary.fileValid && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-[#6E6862] block">
                                    {t('ums.employees.import.kpi.totalRows')}
                                </span>
                                <span className="text-2xl font-mono font-bold text-[#0D0D0D] mt-1 block">
                                    {validationSummary.totalRows}
                                </span>
                                <span className="text-[11px] text-[#857E74]">
                                    {t('ums.employees.import.kpi.totalRowsSub')}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                                <FileSpreadsheet size={18} />
                            </div>
                        </div>

                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-[#6E6862] block">
                                    {t('ums.employees.import.kpi.validRows')}
                                </span>
                                <span className="text-2xl font-mono font-bold text-[#265938] mt-1 block">
                                    {validationSummary.validRowsCount}
                                </span>
                                <span className="text-[11px] text-[#265938]">
                                    {t('ums.employees.import.kpi.validRowsSub')}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#EAF3EC] text-[#265938] flex items-center justify-center">
                                <CheckCircle2 size={18} />
                            </div>
                        </div>

                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-[#6E6862] block">
                                    {t('ums.employees.import.kpi.invalidRows')}
                                </span>
                                <span className="text-2xl font-mono font-bold text-[#DC2626] mt-1 block">
                                    {validationSummary.invalidRowsCount}
                                </span>
                                <span className="text-[11px] text-[#6E6862]">
                                    {t('ums.employees.import.kpi.invalidRowsSub')}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                                <XCircle size={18} />
                            </div>
                        </div>

                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-[#6E6862] block">
                                    {t('ums.employees.import.kpi.totalErrors')}
                                </span>
                                <span className="text-2xl font-mono font-bold text-[#C28E3A] mt-1 block">
                                    {validationSummary.allErrors.length}
                                </span>
                                <span className="text-[11px] text-[#6E6862]">
                                    {t('ums.employees.import.kpi.totalErrorsSub')}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#C28E3A] flex items-center justify-center">
                                <AlertTriangle size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Preview Table Card */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                        {/* Filter Bar */}
                        <div className="p-4 border-b border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5]">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        previewTab === 'all'
                                            ? 'bg-[#2D3F2C] text-white'
                                            : 'bg-white text-[#45413C] border border-[#E5E0D8] hover:bg-[#EFECE6]'
                                    }`}
                                >
                                    {t('ums.employees.import.tabs.all', {
                                        count: validationSummary.totalRows,
                                    })}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('valid')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        previewTab === 'valid'
                                            ? 'bg-[#265938] text-white'
                                            : 'bg-white text-[#265938] border border-[#E5E0D8] hover:bg-[#EAF3EC]'
                                    }`}
                                >
                                    {t('ums.employees.import.tabs.valid', {
                                        count: validationSummary.validRowsCount,
                                    })}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('invalid')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        previewTab === 'invalid'
                                            ? 'bg-[#DC2626] text-white'
                                            : 'bg-white text-[#DC2626] border border-[#E5E0D8] hover:bg-[#FEE2E2]/40'
                                    }`}
                                >
                                    {t('ums.employees.import.tabs.invalid', {
                                        count: validationSummary.invalidRowsCount,
                                    })}
                                </button>
                            </div>

                            {validationSummary.validRowsCount > 0 && !commitResult && (
                                <button
                                    type="button"
                                    onClick={handleCommitImport}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                                >
                                    <Check size={14} />
                                    <span>
                                        {t('ums.employees.import.commitValidRows', {
                                            count: validationSummary.validRowsCount,
                                        })}
                                    </span>
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-start border-collapse">
                                <thead>
                                    <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862] font-semibold">
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.rowNumber')}
                                        </th>
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.status')}
                                        </th>
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.code')}
                                        </th>
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.employeeName')}
                                        </th>
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.emails')}
                                        </th>
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.phone')}
                                        </th>
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.organization')}
                                        </th>
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.joiningDate')}
                                        </th>
                                        <th className="py-3 px-3 text-start whitespace-nowrap">
                                            {t('ums.employees.import.table.grossSalary')}
                                        </th>
                                        <th className="py-3 px-3 text-start">
                                            {t('ums.employees.import.table.validationDetails')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E0D8]">
                                    {filteredRows.map((row) => {
                                        const emp = row.employeeRecord;
                                        const isValid = row.status === 'valid';
                                        const branchObj = branches.find(
                                            (b) => b.id === emp.branchId
                                        );
                                        const deptObj = departments.find(
                                            (d) => d.id === emp.departmentId
                                        );
                                        const desigObj = designations.find(
                                            (d) => d.id === emp.designationId
                                        );

                                        return (
                                            <tr
                                                key={row.rowNumber}
                                                className={
                                                    isValid
                                                        ? 'hover:bg-[#FAF8F5]'
                                                        : 'bg-[#FEE2E2]/20 hover:bg-[#FEE2E2]/30'
                                                }
                                            >
                                                <td className="py-3 px-3 font-mono font-bold text-[#45413C]">
                                                    #{row.rowNumber}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    {isValid ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EAF3EC] text-[#265938] font-semibold">
                                                            <CheckCircle2 size={12} />
                                                            {t(
                                                                'ums.employees.import.table.validBadge'
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] font-semibold">
                                                            <XCircle size={12} />
                                                            {t(
                                                                'ums.employees.import.table.invalidBadge'
                                                            )}{' '}
                                                            ({row.errors.length})
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    className="py-3 px-3 font-mono font-bold text-[#2D3F2C] whitespace-nowrap"
                                                    dir="ltr"
                                                >
                                                    {emp.code}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-[#0D0D0D]">
                                                        {emp.nameEn || '—'}
                                                    </div>
                                                    <div
                                                        className="text-[11px] text-[#6E6862]"
                                                        dir="rtl"
                                                    >
                                                        {emp.nameAr || '—'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 font-mono" dir="ltr">
                                                    <div className="text-[#0D0D0D]">
                                                        {emp.workEmail || '—'}
                                                    </div>
                                                    <div className="text-[11px] text-[#6E6862]">
                                                        {emp.email || '—'}
                                                    </div>
                                                </td>
                                                <td
                                                    className="py-3 px-3 font-mono text-[#0D0D0D] whitespace-nowrap"
                                                    dir="ltr"
                                                >
                                                    {emp.phone || '—'}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="font-semibold text-[#0D0D0D]">
                                                        {deptObj
                                                            ? isRtl
                                                                ? deptObj.nameAr
                                                                : deptObj.nameEn
                                                            : row.rawValues.department || '—'}
                                                    </div>
                                                    <div className="text-[11px] text-[#6E6862]">
                                                        {desigObj
                                                            ? isRtl
                                                                ? desigObj.titleAr
                                                                : desigObj.titleEn
                                                            : row.rawValues.designation || '—'}{' '}
                                                        ·{' '}
                                                        {branchObj
                                                            ? isRtl
                                                                ? branchObj.nameAr
                                                                : branchObj.nameEn
                                                            : row.rawValues.branch || '—'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 font-mono text-[#0D0D0D] whitespace-nowrap">
                                                    {row.rawValues.joiningDate || emp.joiningDate}
                                                </td>
                                                <td className="py-3 px-3 font-mono font-semibold text-[#265938] whitespace-nowrap">
                                                    {formatSarCurrency(
                                                        emp.salaryDetails?.grossSalary || 0,
                                                        isRtl
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 min-w-[240px]">
                                                    {isValid ? (
                                                        <span className="text-[#265938] font-medium">
                                                            {t(
                                                                'ums.employees.import.table.readyToImport'
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <ul className="space-y-1 text-[#DC2626]">
                                                            {row.errors.map((err, idx) => (
                                                                <li
                                                                    key={`${err.rowNumber}-${err.field}-${idx}`}
                                                                    className="text-[11px]"
                                                                >
                                                                    <span className="font-mono font-bold">
                                                                        [{err.field}]
                                                                    </span>{' '}
                                                                    {isRtl
                                                                        ? err.messageAr
                                                                        : err.messageEn}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Detailed Field Validation Error Report */}
                    {validationSummary.allErrors.length > 0 && (
                        <div className="bg-white border border-[#DC2626]/30 rounded-xl p-5 shadow-2xs space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        {t('ums.employees.import.errorsPanel.title', {
                                            count: validationSummary.allErrors.length,
                                        })}
                                    </h3>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {t('ums.employees.import.errorsPanel.subtitle')}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-[#E5E0D8] rounded-lg">
                                <table className="w-full text-xs text-start border-collapse">
                                    <thead>
                                        <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862] font-semibold">
                                            <th className="py-2.5 px-3 text-start">
                                                {t('ums.employees.import.errorsPanel.colRow')}
                                            </th>
                                            <th className="py-2.5 px-3 text-start">
                                                {t('ums.employees.import.errorsPanel.colField')}
                                            </th>
                                            <th className="py-2.5 px-3 text-start">
                                                {t('ums.employees.import.errorsPanel.colValue')}
                                            </th>
                                            <th className="py-2.5 px-3 text-start">
                                                {t('ums.employees.import.errorsPanel.colReason')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E0D8]">
                                        {validationSummary.allErrors.map((err, index) => (
                                            <tr key={`${err.rowNumber}-${err.field}-${index}`}>
                                                <td className="py-2 px-3 font-mono font-bold text-[#0D0D0D]">
                                                    #{err.rowNumber}
                                                </td>
                                                <td
                                                    className="py-2 px-3 font-mono font-semibold text-[#2D3F2C]"
                                                    dir="ltr"
                                                >
                                                    {err.field}
                                                </td>
                                                <td
                                                    className="py-2 px-3 font-mono text-[#DC2626]"
                                                    dir="ltr"
                                                >
                                                    {err.rejectedValue}
                                                </td>
                                                <td className="py-2 px-3 text-[#45413C]">
                                                    {isRtl ? err.messageAr : err.messageEn}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default UmsEmployeeImportPage;
