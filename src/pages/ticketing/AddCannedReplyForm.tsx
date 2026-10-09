
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface CannedReply {
    id: string;
    subject: string;
    message: string;
    createdAt?: string;
    createdBy?: string;
}

interface CannedReplyFormProps {
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    reply?: CannedReply | null;
    isLoading?: boolean;
    onClose: () => void;
    onSubmit: (data: { subject: string; message: string }) => void;
}

export const CannedReplyForm = ({ isOpen, mode, reply, isLoading = false, onClose, onSubmit }: CannedReplyFormProps) => {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});
    const isView = mode === 'view';

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setSubject(reply?.subject ?? '');
            setMessage(reply?.message ?? '');
            setErrors({});
            const frame = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(frame);
        }
        setVisible(false);
        const timeout = window.setTimeout(() => setMounted(false), 300);
        return () => window.clearTimeout(timeout);
    }, [isOpen, reply, mode]);

    useEffect(() => {
        if (!mounted) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isLoading) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [mounted, isLoading, onClose]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isView || isLoading) return;
        const nextErrors: { subject?: string; message?: string } = {};
        if (!subject.trim()) nextErrors.subject = 'Subject is required.';
        if (!message.trim()) nextErrors.message = 'Message is required.';
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({ subject: subject.trim(), message: message.trim() });
    };

    if (!mounted) return null;

    return createPortal(
        <div className={`fixed inset-0 z-[100] ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!visible}>
            <button type="button" aria-label="Close drawer" tabIndex={visible ? 0 : -1} onClick={onClose} className={`absolute inset-0 w-full h-full bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`} />
            <aside role="dialog" aria-modal="true" aria-labelledby="canned-reply-drawer-title" className={`absolute end-0 top-0 flex h-full w-full max-w-xl flex-col bg-white text-start shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
                <header className="flex shrink-0 items-center justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-5">
                    <div>
                        <h2 id="canned-reply-drawer-title" className="text-lg font-bold text-[#0D0D0D]">{mode === 'create' ? 'Add Canned Reply' : mode === 'edit' ? 'Edit Canned Reply' : 'Canned Reply Details'}</h2>
                        <p className="mt-1 text-xs text-[#6E6862]">{mode === 'create' ? 'Create a reusable response for your tickets.' : mode === 'edit' ? 'Update the saved response details.' : 'View the saved response details.'}</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={isLoading} aria-label="Close" className="rounded-lg p-2 text-[#6E6862] transition hover:bg-[#EDE9E2] hover:text-[#0D0D0D] disabled:opacity-50"><X size={19} /></button>
                </header>

                <form id="canned-reply-form" onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-5 overflow-y-auto p-6">
                        {reply?.id && mode !== 'create' && <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-3"><span className="block text-[11px] text-[#6E6862]">Canned Reply Code</span><span className="font-mono text-sm font-bold text-[#2D3F2C]" dir="ltr">{reply.id}</span></div>}
                        <div>
                            <label htmlFor="canned-reply-subject" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D]">Subject <span className="text-red-600">*</span></label>
                            <input id="canned-reply-subject" value={subject} onChange={(event) => { setSubject(event.target.value); setErrors((prev) => ({ ...prev, subject: undefined })); }} readOnly={isView} placeholder="Enter reply subject" className={`w-full rounded-lg border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#2D3F2C]/15 ${errors.subject ? 'border-red-400' : 'border-[#D6CFC4] focus:border-[#2D3F2C]'} ${isView ? 'cursor-default bg-[#F7F6F3]' : 'bg-white'}`} />
                            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                        </div>
                        <div>
                            <label htmlFor="canned-reply-message" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D]">Message <span className="text-red-600">*</span></label>
                            <textarea id="canned-reply-message" value={message} onChange={(event) => { setMessage(event.target.value); setErrors((prev) => ({ ...prev, message: undefined })); }} readOnly={isView} rows={8} placeholder="Write your canned reply message..." className={`w-full resize-y rounded-lg border px-3.5 py-3 text-sm leading-6 outline-none transition focus:ring-2 focus:ring-[#2D3F2C]/15 ${errors.message ? 'border-red-400' : 'border-[#D6CFC4] focus:border-[#2D3F2C]'} ${isView ? 'cursor-default bg-[#F7F6F3]' : 'bg-white'}`} />
                            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                        </div>
                    </div>
                    <footer className="flex shrink-0 justify-end gap-3 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4">
                        <button type="button" onClick={onClose} disabled={isLoading} className="rounded-lg border border-[#D6CFC4] bg-white px-4 py-2.5 text-xs font-semibold text-[#45413C] transition hover:bg-[#F1EEE8] disabled:opacity-50">{isView ? 'Close' : 'Cancel'}</button>
                        {!isView && <button type="submit" disabled={isLoading} className="rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#223121] disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Reply'}</button>}
                    </footer>
                </form>
            </aside>
        </div>,
        document.body,
    );
};