/* eslint-disable */

/**
 * Hides an alert
 */
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

/**
 * Shows a success or error alert with the given message.
 * @param type: type of the alert, either success or error
 * @param msg : message to be shown on the alert
 */
export const showAlert = (type, msg) => {
  // Hide any alerts currently visible
  hideAlert();
  // Build message HTML content
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  // Add the alert to the page
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  // Hide it automatically after 5 seconds
  window.setTimeout(hideAlert, 5000);
};
