import {
    type EmployeeRecord,
    type IqamaStatus,
    type EmployeeInvitationStatus,
    type EmployeeProfileCompletionResult,
} from './umsMockData';

export function getInitials(nameEn: string, nameAr: string): string {
    const cleanEn = (nameEn || '').trim();
    if (cleanEn) {
        const parts = cleanEn.split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return cleanEn.slice(0, 2).toUpperCase();
    }
    const cleanAr = (nameAr || '').trim();
    if (cleanAr) {
        const parts = cleanAr.split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`;
        }
        return cleanAr.slice(0, 2);
    }
    return 'EM';
}

export function formatSarCurrency(amount: number, isRtl: boolean): string {
    const formatted = Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return isRtl ? `${formatted} ر.س` : `SAR ${formatted}`;
}

export function computeIqamaStatus(expiryDateStr?: string): {
    status: IqamaStatus;
    label: string;
    tone: 'success' | 'warning' | 'danger';
} {
    if (!expiryDateStr) {
        return { status: 'Valid', label: 'N/A', tone: 'success' };
    }
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: 'Expired', label: 'Expired', tone: 'danger' };
    }
    if (diffDays <= 30) {
        return { status: 'Critical', label: `Expires in ${diffDays}d`, tone: 'danger' };
    }
    if (diffDays <= 90) {
        return { status: 'Warning', label: `Expires in ${diffDays}d`, tone: 'warning' };
    }
    return { status: 'Valid', label: 'Valid', tone: 'success' };
}

export function computeEmployeeInvitationStatus(emp: EmployeeRecord): {
    status: EmployeeInvitationStatus;
    label: string;
    tone: 'success' | 'warning' | 'neutral';
} {
    if (!emp.workEmail && !emp.email) {
        return { status: 'Not Sent', label: 'No Email', tone: 'neutral' };
    }
    // Mock determination based on status or code
    if (emp.status === 'Active') {
        return { status: 'Accepted', label: 'Accepted', tone: 'success' };
    }
    return { status: 'Pending', label: 'Invite Pending', tone: 'warning' };
}

export function computeEmployeeProfileCompletion(emp: EmployeeRecord): {
    percentage: number;
    missingFields: string[];
} {
    const totalFields = 6;
    let completed = 0;
    const missing: string[] = [];

    if (emp.firstNameEn || emp.nameEn) completed++;
    else missing.push('Name');

    if (emp.workEmail || emp.email) completed++;
    else missing.push('Email');

    if (emp.phone) completed++;
    else missing.push('Phone');

    if (emp.departmentId) completed++;
    else missing.push('Department');

    if (emp.designationId) completed++;
    else missing.push('Designation');

    if (emp.salaryDetails) completed++;
    else missing.push('Salary');

    const percentage = Math.round((completed / totalFields) * 100);
    return { percentage, missingFields: missing };
}
