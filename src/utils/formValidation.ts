import type { FieldErrors } from 'react-hook-form';

/**
 * Focuses and smoothly scrolls to the first invalid field in a form.
 * Works with native inputs, textareas, selects, and custom button triggers.
 */
export function focusAndScrollToFirstError(
    errors: FieldErrors<any> | Record<string, any>,
    fieldOrder?: string[],
    containerRef?: HTMLElement | null
) {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;

    // Determine the first key according to the DOM/visual field order if provided
    let firstKey = errorKeys[0];
    if (fieldOrder && fieldOrder.length > 0) {
        const found = fieldOrder.find((key) => errors[key]);
        if (found) {
            firstKey = found;
        }
    }

    setTimeout(() => {
        const container = containerRef || document;
        const selector = `[name="${firstKey}"], #${firstKey}, [data-field="${firstKey}"], button[data-name="${firstKey}"]`;
        const el = container.querySelector<HTMLElement>(selector);

        if (el) {
            // If the element itself is focusable, focus it
            if (typeof el.focus === 'function') {
                el.focus({ preventScroll: true });
            }
            // Smoothly scroll to center so the field and its inline error message are clearly visible
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 60);
}
