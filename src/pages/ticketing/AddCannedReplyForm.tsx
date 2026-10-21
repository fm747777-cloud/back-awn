import { useActionState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface CannedReply {
    id: string;
    codeName: string;
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
    onSubmit: (data: { subject: string; message: string }) => void | Promise<void>;
}

interface FormErrors {
    subject?: string;
    message?: string;
}

export const CannedReplyForm = ({ isOpen, mode, reply, isLoading = false, onClose, onSubmit }: CannedReplyFormProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const isView = mode === 'view';

    const [errors, formAction, isSubmitting] = useActionState(
        async (_prevState: FormErrors, formData: FormData): Promise<FormErrors> => {
            const subject = (formData.get('subject') as string)?.trim() ?? '';
            const message = (formData.get('message') as string)?.trim() ?? '';

            const nextErrors: FormErrors = {};
            if (!subject) nextErrors.subject = 'Subject is required.';
            if (!message) nextErrors.message = 'Message is required.';

            if (Object.keys(nextErrors).length > 0) {
                return nextErrors;
            }

            await onSubmit({ subject, message });
            return {};
        },
        {}
    );

    // مزامنة حالة isOpen مع الـ HTMLDialogElement الأصلي
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else {
            if (dialog.open) {
                dialog.close();
            }
        }
    }, [isOpen]);

    const isBusy = isLoading || isSubmitting;

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onClick={(e) => {
                // إغلاق عند النقر على الـ Backdrop الأصلي
                if (e.target === dialogRef.current && !isBusy) {
                    onClose();
                }
            }}
            className="m-0 ms-auto h-full max-h-none w-full max-w-xl bg-transparent p-0 shadow-2xl backdrop:bg-slate-950/35 backdrop:backdrop-blur-[2px] open:flex open:flex-col"
        >
            <div className="flex h-full w-full flex-col bg-white text-start">
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-5">
                    <div>
                        <h2 id="canned-reply-drawer-title" className="text-lg font-bold text-[#0D0D0D]">
                            {mode === 'create'
                                ? 'Add Canned Reply'
                                : mode === 'edit'
                                    ? 'Edit Canned Reply'
                                    : 'Canned Reply Details'}
                        </h2>
                        <p className="mt-1 text-xs text-[#6E6862]">
                            {mode === 'create'
                                ? 'Create a reusable response for your tickets.'
                                : mode === 'edit'
                                    ? 'Update the saved response details.'
                                    : 'View the saved response details.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        aria-label="Close"
                        className="rounded-lg p-2 text-[#6E6862] transition hover:bg-[#EDE9E2] hover:text-[#0D0D0D] disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>
                </header>

                {/* Form using React 19 Action */}
                <form action={formAction} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-5 overflow-y-auto p-6">
                        {reply?.id && mode !== 'create' && (
                            <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-3">
                                <span className="block text-[11px] text-[#6E6862]">Canned Reply Code</span>
                                <span className="font-mono text-sm font-bold text-[#2D3F2C]" dir="ltr">
                                    {reply.id}
                                </span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="canned-reply-subject" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D]">
                                Subject <span className="text-red-600">*</span>
                            </label>
                            <input
                                id="canned-reply-subject"
                                name="subject"
                                defaultValue={reply?.subject ?? ''}
                                key={`subject-${reply?.id ?? 'new'}-${isOpen}`}
                                readOnly={isView}
                                placeholder="Enter reply subject"
                                className={`w-full rounded-lg border px-3.5 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#2D3F2C]/15 ${errors.subject ? 'border-red-400' : 'border-[#D6CFC4] focus:border-[#2D3F2C]'
                                    } ${isView ? 'cursor-default bg-[#F7F6F3]' : 'bg-white'}`}
                            />
                            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                        </div>

                        <div>
                            <label htmlFor="canned-reply-message" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D]">
                                Message <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                id="canned-reply-message"
                                name="message"
                                defaultValue={reply?.message ?? ''}
                                key={`message-${reply?.id ?? 'new'}-${isOpen}`}
                                readOnly={isView}
                                rows={8}
                                placeholder="Write your canned reply message..."
                                className={`w-full resize-y rounded-lg border px-3.5 py-3 text-sm leading-6 outline-none transition focus:ring-2 focus:ring-[#2D3F2C]/15 ${errors.message ? 'border-red-400' : 'border-[#D6CFC4] focus:border-[#2D3F2C]'
                                    } ${isView ? 'cursor-default bg-[#F7F6F3]' : 'bg-white'}`}
                            />
                            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                        </div>
                    </div>

                    <footer className="flex shrink-0 justify-end gap-3 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                            className="rounded-lg border border-[#D6CFC4] bg-white px-4 py-2.5 text-xs font-semibold text-[#45413C] transition hover:bg-[#F1EEE8] disabled:opacity-50"
                        >
                            {isView ? 'Close' : 'Cancel'}
                        </button>
                        {!isView && (
                            <button
                                type="submit"
                                disabled={isBusy}
                                className="rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#223121] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isBusy ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Reply'}
                            </button>
                        )}
                    </footer>
                </form>
            </div>
        </dialog>
    );
};