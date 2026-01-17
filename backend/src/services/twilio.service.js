const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


const sendOTP = async (mobileNumber, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobileNumber,
    });

    console.log(`✅ OTP sent to ${mobileNumber}, SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('❌ Twilio Error:', error.message);
    throw new Error('Failed to send OTP. Please check your mobile number.');
  }
};

module.exports = { sendOTP };
