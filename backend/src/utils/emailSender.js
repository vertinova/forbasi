const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"FORBASI" <${process.env.SMTP_FROM || 'noreply@forbasi.or.id'}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
};

module.exports = { sendEmail };
