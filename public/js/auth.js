/* eslint-disable */

import axios from 'axios';

import { showAlert } from './alerts';

/**
 * Signs up a user in by making a signup request to the api using the given details.
 * @param email: user's name
 * @param email: user's email
 * @param password: user's password
 * @param passwordConfirm: user's password confirmation
 */
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    // Sends a sign up request to the API
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      // Shows success popup upon successful sign up
      showAlert('success', 'Signed up succesfully!');
      // Sends user to the home page after 1.5 seconds
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // Shows error popup upon unsuccessful login
    console.error(err);
    showAlert('error', err.response.data.message);
  }
};

/**
 * Logs a user in by making a login request to the api using the given email and password.
 * @param email: user's email
 * @param password: user's password
 */
export const login = async (email, password) => {
  try {
    // Sends a login request to the API
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      // Shows success popup upon successful login
      showAlert('success', 'Logged in succesfully!');
      // Sends user to the home page after 1.5 seconds
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // Shows error popup upon unsuccessful login
    console.error(err);
    showAlert('error', err.response.data.message);
  }
};

/**
 * Logs out a currently logged in user.
 */
export const logout = async () => {
  // Sends a logout request to the API
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (res.data.status === 'success') {
      // Redirects user to the home page if they are on the account page
      if (location.pathname === '/me') {
        location.assign('/');
      }
      // Otherwise, reloads the same page from the server to update the header
      else {
        location.reload(true);
      }
    }
  } catch (err) {
    // Shows error popup in case something goes wrong while logging out
    console.error(err);
    showAlert('error', 'Error logging out. Try again.');
  }
};
