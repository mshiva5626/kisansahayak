const twilio = require('twilio');

const sendOTP = async (phone, otp) => {
    // If Twilio credentials are provided, use them. Otherwise, mock the send.
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
                body: `Your Kisan Sahayak verification code is: ${otp}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone
            });
            console.log(`OTP ${otp} sent to ${phone} via Twilio`);
            return true;
        } catch (error) {
            console.error('Twilio Error:', error.message);
            // Fallback to mock if Twilio fails during development
        }
    }

    // Mock Send
    console.log('--- MOCK SMS ---');
    console.log(`To: ${phone}`);
    console.log(`Message: Your Kisan Sahayak verification code is: ${otp}`);
    console.log('----------------');
    return true;
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOTP, generateOTP };
