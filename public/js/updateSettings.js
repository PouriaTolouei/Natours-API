/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

/**
 * Updates a user's data by making an update request to the api using the given new data
 * @param data: user data to be updated
 * @param type: type of data to be updated, either 'data' or 'password'
 */
export const updateSettings = async (data, type) => {
  try {
    // Sets the request url depending on if user is updating regular data or password
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    // Sends an update request to the API
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      // Shows success popup upon successful update
      showAlert(
        'success',
        `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`,
      );
      // Reloads the page to reflect the changes
      window.setTimeout(() => {
        location.reload(true);
      }, 1500);
    }
  } catch (err) {
    // Shows error popup upon unsuccessful update
    console.error(err);
    showAlert('error', err.response.data.message);
  }
};
