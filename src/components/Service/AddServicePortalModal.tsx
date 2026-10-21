import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { serviceApi } from "../../api/api";
import {
  servicePortalSchema,
  type ServicePortalFormValues,
} from "../../schemas/serviceSchema";
import { focusAndScrollToFirstError } from "../../utils/formValidation";
import { translateError } from "../../i18n";

interface AddServicePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: string;
    name?: string | null;
    url?: string | null;
    description?: string | null;
    contact_number?: string | number | null;
    email?: string | null;
  };
}

export const AddServicePortalModal: React.FC<AddServicePortalModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm<ServicePortalFormValues>({
    resolver: zodResolver(servicePortalSchema),
    mode: "onSubmit",
    defaultValues: {
      name: initialData?.name ?? "",
      url: initialData?.url ?? "",
      description: initialData?.description ?? "",
      contact_number:
        initialData?.contact_number == null
          ? ""
          : String(initialData.contact_number),
      email: initialData?.email ?? "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);
    reset({
      name: initialData?.name ?? "",
      url: initialData?.url ?? "",
      description: initialData?.description ?? "",
      contact_number:
        initialData?.contact_number == null
          ? ""
          : String(initialData.contact_number),
      email: initialData?.email ?? "",
    });
  }, [isOpen, initialData, reset]);

  const handleCloseModal = () => {
    reset({
      name: "",
      url: "",
      description: "",
      contact_number: "",
      email: "",
    });
    setCurrentStep(1);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: (data: ServicePortalFormValues) => {
      const payload = {
        ...data,
        // الـ URL اختياري في الـ DTO؛ لا نرسل نصًا فارغًا إلى @IsUrl.
        url: data.url?.trim() || undefined,
      };

      // عند التعديل نستخدم PATCH، وعند الإضافة نستخدم API الإنشاء.
      return initialData?.id
        ? serviceApi.updateServicePortal(initialData.id, payload)
        : serviceApi.createServicePortal(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePortals"] });
      queryClient.invalidateQueries({ queryKey: ["serviceTags"] });
      toast.success(
        initialData?.id
          ? t("common.updateSuccess", "Updated successfully")
          : t("common.createSuccess", "Created successfully")
      );
      handleCloseModal();
    },
    onError: (error: any) => {
      console.error("Failed to save service portal:", error);
      toast.error(
        error?.response?.data?.message ||
        t("common.saveError", "Failed to save service portal")
      );
    },
  });

  const handleNextStep = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();

    const isStep1Valid = await trigger([
      "name",
      "url",
      "description",
    ]);

    if (isStep1Valid) {
      setCurrentStep(2);
      return;
    }

    focusAndScrollToFirstError(errors);
  };

  const onSubmit = (data: ServicePortalFormValues) => {
    // ممنوع إرسال أي Request قبل الخطوة الأخيرة.
    if (currentStep !== 2 || mutation.isPending) {
      return;
    }

    mutation.mutate({
      ...data,
      url: data.url?.trim() || undefined,
      contact_number: String(data.contact_number).trim(),
    });
  };

  if (!isOpen) return null;

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border p-2.5 text-sm outline-none transition text-start ${hasError
      ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
      : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
    }`;

  const renderError = (message?: string) =>
    message ? (
      <p className="mt-1 text-xs text-[#B83232]">{translateError(t, message)}</p>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0D0D0D]/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#E5E0D8] bg-white text-start shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#0D0D0D]">
              {initialData ? t("portals.editTitle") : t("portals.addTitle")}
            </h2>
            <p className="mt-1 text-xs text-[#6E6862]">{t("portals.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            disabled={mutation.isPending}
            aria-label={t("common.close")}
            className="rounded-md p-1 text-xl font-bold leading-none text-[#8C847A] hover:bg-[#EFECE6] hover:text-[#0D0D0D] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8 flex items-center justify-center">
            <div className="flex items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep === 1
                  ? "bg-[#2D3F2C] text-white"
                  : "bg-[#EFECE6] text-[#8C847A]"
                  }`}
              >
                1
              </div>
              <span
                className={`ms-2 text-xs ${currentStep === 1
                  ? "font-semibold text-[#2D3F2C]"
                  : "font-medium text-[#8C847A]"
                  }`}
              >
                {t("portals.step1")}
              </span>
            </div>
            <div className="mx-4 h-px w-16 bg-[#D6CFC4]" />
            <div className="flex items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep === 2
                  ? "bg-[#2D3F2C] text-white"
                  : "bg-[#EFECE6] text-[#8C847A]"
                  }`}
              >
                2
              </div>
              <span
                className={`ms-2 text-xs ${currentStep === 2
                  ? "font-semibold text-[#2D3F2C]"
                  : "font-medium text-[#8C847A]"
                  }`}
              >
                {t("portals.step2")}
              </span>
            </div>
          </div>

          <form
            id="service-portal-form"
            noValidate
            onSubmit={handleSubmit(onSubmit, (formErrors) =>
              focusAndScrollToFirstError(formErrors),
            )}
            className="space-y-4"
          >
            <div className={currentStep === 1 ? "block space-y-4" : "hidden"}>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D0D0D]">
                  {t("portals.portalName")} <span className="text-[#B83232]">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="organization"
                  placeholder={t("portals.portalNamePlaceholder")}
                  {...register("name")}
                  className={inputClass(!!errors.name)}
                />
                {renderError(errors.name?.message)}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D0D0D]">
                  {t("portals.portalUrl")} <span className="text-xs font-normal text-[#8C847A]">({t("common.optional", { defaultValue: "اختياري" })})</span>
                </label>
                <input
                  type="url"
                  dir="ltr"
                  autoComplete="url"
                  placeholder={t("portals.portalUrlPlaceholder")}
                  {...register("url")}
                  className={inputClass(!!errors.url)}
                />
                {renderError(errors.url?.message)}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D0D0D]">
                  {t("portals.portalDescription")} <span className="text-[#B83232]">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={t("portals.portalDescriptionPlaceholder")}
                  {...register("description")}
                  className={inputClass(!!errors.description) + " resize-none"}
                />
                {renderError(errors.description?.message)}
              </div>
            </div>

            <div className={currentStep === 2 ? "block space-y-4" : "hidden"}>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D0D0D]">
                  {t("portals.contactNumber")} <span className="text-[#B83232]">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  autoComplete="tel"
                  placeholder={t("portals.contactNumberPlaceholder")}
                  {...register("contact_number")}
                  className={inputClass(!!errors.contact_number)}
                />
                {renderError(errors.contact_number?.message)}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#0D0D0D]">
                  {t("portals.emailAddress")} <span className="text-[#B83232]">*</span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder={t("portals.emailAddressPlaceholder")}
                  {...register("email")}
                  className={inputClass(!!errors.email)}
                />
                {renderError(errors.email?.message)}
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4">
          {currentStep === 1 ? (
            <>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={mutation.isPending}
                className="rounded-lg border border-[#D6CFC4] bg-white px-6 py-2 text-sm font-medium text-[#45413C] transition hover:bg-[#F5F2EC] disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleNextStep(event);
                }}
                className="rounded-lg bg-[#2D3F2C] px-6 py-2 text-sm font-medium text-[#FAF8F5] transition hover:bg-[#1F2C1E]"
              >
                {t("common.next")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={mutation.isPending}
                className="rounded-lg border border-[#D6CFC4] bg-white px-6 py-2 text-sm font-medium text-[#45413C] transition hover:bg-[#F5F2EC] disabled:opacity-50"
              >
                {t("common.back")}
              </button>
              <button
                type="submit"
                form="service-portal-form"
                disabled={mutation.isPending}
                className="rounded-lg bg-[#2D3F2C] px-6 py-2 text-sm font-medium text-[#FAF8F5] transition hover:bg-[#1F2C1E] disabled:opacity-50"
              >
                {mutation.isPending ? t("common.submitting") : t("common.submit")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};