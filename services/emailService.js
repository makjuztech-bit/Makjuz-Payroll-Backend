
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, attachments = []) => {
    try {
        // Create reusable transporter object using the default SMTP transport
        // For now using a placeholder. User will need to configure env variables.
        const transporter = nodemailer.createTransport({
            service: 'gmail', // or use host/port
            auth: {
                user: process.env.SMTP_USER || 'your-email@gmail.com',
                pass: process.env.SMTP_PASS || 'your-app-password'
            }
        });

        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER || '"Levivaan HR" <hr@levivaan.com>', // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            attachments: attachments
        });

        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
