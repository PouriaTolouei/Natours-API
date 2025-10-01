const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Creates a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    logger: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Defines email options
  const mailOptions = {
    from: 'Pouria Tolouei <pouria81.t@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Sends the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
