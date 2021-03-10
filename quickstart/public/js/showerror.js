'use strict';
import { getUserFriendlyError } from './userfriendlyerror.js';
/**
 * Show the given error.
 * @param $modal - modal for showing the error.
 * @param error - Error to be shown.
 */
export function showError($modal, error) {
    // Add the appropriate error message to the alert.
    $('div.alert', $modal).html(getUserFriendlyError(error));
    $modal.modal({
        backdrop: 'static',
        focus: true,
        keyboard: false,
        show: true
    });
    $('#show-error-label', $modal).text(`${error.name}${error.message
        ? `: ${error.message}`
        : ''}`);
}
//# sourceMappingURL=showerror.js.map