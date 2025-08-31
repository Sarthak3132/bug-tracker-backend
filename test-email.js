require('dotenv').config();  // if you use dotenv to load .env
const { sendEmail } = require('./src/services/email.service'); // adjust the path as needed

async function testSend() {
  try {
    const info = await sendEmail(
      'recipient@example.com', // replace with your email or any test email
      'Test Email from Bug Tracker',
      '<p>This is a test email sent using Ethereal SMTP and Nodemailer.</p>'
    );
    console.log('Test email sent successfully.');
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testSend();
