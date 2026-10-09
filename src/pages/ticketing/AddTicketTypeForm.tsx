import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

export interface CreateTicketTypeDto {
    name: string;
    description?: string;
}

interface AddTicketTypeFormProps {
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTicketTypeDto) => void;
}

export const AddTicketTypeForm: React.FC<AddTicketTypeFormProps> = ({ isOpen, isLoading, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<{ name?: string }>({});

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setName("");
            setDescription("");
            setErrors({});
        }
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextErrors: { name?: string } = {};

        if (!name.trim()) {
            nextErrors.name = t("ticketing.ticketTypes.validation.nameRequired", { defaultValue: "Name is required" });
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        onSubmit({
            name: name.trim(),
            ...(description.trim() ? { description: description.trim() } : {}),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <button type="button" aria-label={t("ticketing.form.close")} onClick={onClose} className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]" />

            <div className="fixed top-0 end-0 flex h-full w-full max-w-lg flex-col bg-white text-start shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-[#E5E0D8] px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D]">{t("ticketing.ticketTypes.drawer.createTitle", { defaultValue: "Create Ticket Type" })}</h2>
                        <p className="mt-0.5 text-xs text-[#6E6862]">{t("ticketing.ticketTypes.drawer.createSubtitle", { defaultValue: "Add a new ticket type" })}</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={isLoading} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#857E74] transition hover:bg-[#F8F6F2] hover:text-[#0D0D0D] disabled:opacity-50" aria-label={t("ticketing.form.close")}>
                        <X size={18} />
                    </button>
                </div>

                <form id="add-ticket-type-form" onSubmit={handleSubmit} noValidate className="flex-1 space-y-5 overflow-y-auto p-6">
                    <div>
                        <label htmlFor="ticket-type-name" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D]">
                            {t("ticketing.ticketTypes.drawer.name", { defaultValue: "Name" })} <span className="text-[#A23B2A]">*</span>
                        </label>
                        <input
                            id="ticket-type-name"
                            type="text"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                if (event.target.value.trim()) setErrors((previous) => ({ ...previous, name: undefined }));
                            }}
                            placeholder={t("ticketing.ticketTypes.drawer.namePlaceholder", { defaultValue: "Enter ticket type name" })}
                            disabled={isLoading}
                            aria-invalid={Boolean(errors.name)}
                            className={`w-full rounded-lg border px-3.5 py-2.5 text-xs text-[#0D0D0D] outline-none transition focus:ring-2 ${errors.name ? "border-red-400 focus:ring-red-400/20" : "border-[#E5E0D8] bg-[#FAF8F5] focus:border-[#2D3F2C] focus:ring-[#2D3F2C]/20"}`}
                        />
                        {errors.name && <span className="mt-1 block text-[11px] font-medium text-red-500">{errors.name}</span>}
                    </div>

                    <div>
                        <label htmlFor="ticket-type-description" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D]">
                            {t("ticketing.ticketTypes.drawer.description", { defaultValue: "Description" })} <span className="font-normal text-[#857E74]">{t("common.optional", { defaultValue: "Optional" })}</span>
                        </label>
                        <textarea
                            id="ticket-type-description"
                            rows={3}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder={t("ticketing.ticketTypes.drawer.descriptionPlaceholder", { defaultValue: "Enter description" })}
                            disabled={isLoading}
                            className="w-full resize-y rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-[#0D0D0D] outline-none transition focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/20 disabled:opacity-60"
                        />
                    </div>
                </form>

                <div className="flex shrink-0 justify-end gap-2.5 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4">
                    <button type="button" onClick={onClose} disabled={isLoading} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#595550] transition hover:bg-[#F8F6F2] disabled:opacity-50">
                        {t("ticketing.form.cancel", { defaultValue: "Cancel" })}
                    </button>
                    <button type="submit" form="add-ticket-type-form" disabled={isLoading} className="rounded-lg bg-[#2D3F2C] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#233222] disabled:cursor-not-allowed disabled:opacity-60">
                        {isLoading ? t("common.loading", { defaultValue: "Saving..." }) : t("ticketing.form.saveCreate", { defaultValue: "Create" })}
                    </button>
                </div>
            </div>
        </div>
    );
};