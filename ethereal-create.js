const nodemailer = require('nodemailer');

nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to create Ethereal account', err);
    return;
  }
  console.log('Ethereal account created');
  console.log('User:', account.user);
  console.log('Pass:', account.pass);
  console.log('SMTP Host:', account.smtp.host);
  console.log('SMTP Port:', account.smtp.port);
  console.log('SMTP Secure:', account.smtp.secure);
});
