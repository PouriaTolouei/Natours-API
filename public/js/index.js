/* eslint-disable */

// To support older browsers
import 'regenerator-runtime/runtime';
import 'core-js/stable';

import { displayMap } from './mapbox';
import { signup, login, logout } from './auth';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM ELEMENTS

const mapBox = document.getElementById('map');
const signupForm = document.querySelector('.form--signup');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const savePasswordBtn = document.querySelector('.btn--save-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION

// Check if a map placeholder exists first
if (mapBox) {
  // Parse in the locations data
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations,
  );

  // Displays a bounded map with the tour locations marked on the map
  displayMap(locations);
}

// Checks if the signup form exists
if (signupForm) {
  // Listen for the submit event on the form
  signupForm.addEventListener('submit', (e) => {
    // Prevents form from loading any other page
    e.preventDefault();

    // Gets the form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // Sends the sign up request
    signup(name, email, password, passwordConfirm);
  });
}

// Checks if the login form exists
if (loginForm) {
  // Listen for the submit event on the form
  loginForm.addEventListener('submit', (e) => {
    // Prevents form from loading any other page
    e.preventDefault();

    // Gets the form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Sends the login request
    login(email, password);
  });
}

// Checks if the logout button exists
if (logoutBtn) {
  // Logs out when button is clicked
  logoutBtn.addEventListener('click', logout);
}

// Checks if the data update form exists
if (userDataForm) {
  // Listen for the submit event on the form
  userDataForm.addEventListener('submit', (e) => {
    // Prevents form from loading any other page
    e.preventDefault();

    // Create multi-part form
    const form = new FormData();
    // Gets the form values
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    // Sends the update request
    updateSettings(form, 'data');
  });
}

// Checks if the password update form exists
if (userPasswordForm) {
  // Listen for the submit event on the form
  userPasswordForm.addEventListener('submit', async (e) => {
    // Prevents form from loading any other page
    e.preventDefault();

    // Gets the form values
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // Updates save button text to indicate progress
    savePasswordBtn.textContent = 'Updating...';

    // Sends the update request
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    // Resets the form's password fields
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';

    // Restores save button text
    savePasswordBtn.textContent = 'Save password';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
