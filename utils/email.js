const path = require('path');
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Pouria Tolouei <${process.env.EMAIL_FROM}>`;
  }

  /**
   * Creates a new transport for sending out the email depending on the environemnt
   * @returns created transport
   */
  newTransport() {
    // For development, use sendgrid
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    // For development, use mailtrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      logger: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Sends the actual email
   * @param template: template of the email to be sent
   * @param subject: subject of the email to be sent
   */
  async send(template, subject) {
    // Renders HTML based a pug template
    const html = pug.renderFile(
      path.join(__dirname, `../views/email/${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // Defines email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
    };

    // Creates a transport and send the email
    await this.newTransport().sendMail(mailOptions);
  }

  /**
   * Sends a welcome email to newly registred users
   */
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 mins)',
    );
  }
};
