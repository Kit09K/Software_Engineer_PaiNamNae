const nodemailer = require("nodemailer");

class EmailService {

    constructor() {
        // Create a transporter using Ethereal for testing
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendEmail({to, subject, text,attachments}) {
        try {
            const mailOptions = {
                from: `"painamnae Team" <${process.env.EMAIL_USER}>`,
                to: to, 
                subject: subject, 
                text: text,
                attachments: attachments
            };
            await this.transporter.sendMail(mailOptions);
        }
        catch (error) {
            console.error("Error sending email:", error);
            throw new Error("Failed to send email");
        }
    }
}

module.exports = new EmailService();