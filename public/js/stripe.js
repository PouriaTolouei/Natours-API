/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const strip = Stripe(
  'pk_test_51SIHIOLDI8nIryAbM78bnkVwhq9Gr6PN3q3qNPyeHZe75hkTkUrM4WVKyXRxlysc4GcRz5FDwMZwG1YqYAXDgzBZ0019qF7Nxk',
);

/**
 * Loads checkout page for booking a tour
 * @param tourId: id of the tour to be booked
 */
export const bookTour = async (tourId) => {
  try {
    // Gets checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // Creates checkout form + charges credit card
    const checkoutUrl = session.data.session.url;
    window.location.assign(checkoutUrl);
  } catch (err) {
    // Shows error popup if getting the checkout session fails
    console.error(err);
    showAlert('error', err);
  }
};
