const POPUP_WIDTH = 440;
const POPUP_HEIGHT = 720;

export function openPaymentPopup(url, windowName = 'geniebiz_payment') {
  if (typeof window === 'undefined') {
    return { success: false, blocked: true, popup: null };
  }

  const left = Math.max(0, window.screenX + (window.outerWidth - POPUP_WIDTH) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2);

  const features = [
    'popup=yes',
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
    'scrollbars=yes',
    'resizable=yes',
    'toolbar=no',
    'menubar=no',
    'location=yes',
    'status=no',
  ].join(',');

  const popup = window.open(url, windowName, features);

  if (!popup || popup.closed) {
    return { success: false, blocked: true, popup: null };
  }

  try {
    popup.focus();
  } catch {
    // ignore cross-origin focus errors
  }

  return { success: true, blocked: false, popup };
}

export function paymentPopupStorageKey(orderId) {
  return `geniebiz_popup_opened_${orderId}`;
}

export function markPaymentPopupOpened(orderId) {
  try {
    sessionStorage.setItem(paymentPopupStorageKey(orderId), '1');
  } catch {
    // ignore
  }
}

export function wasPaymentPopupOpened(orderId) {
  try {
    return sessionStorage.getItem(paymentPopupStorageKey(orderId)) === '1';
  } catch {
    return false;
  }
}
