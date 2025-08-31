const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: '"Bug Tracker" <sarthakkamblesk3132@gmail.com>', // can customize sender
    to,
    subject,
    html: htmlContent,
  };

  let info = await transporter.sendMail(mailOptions);

  console.log('Message sent: %s', info.messageId);

  return info;
};

module.exports = {
  sendEmail,
};
