import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class MailService {
	async sendEmail(to, subject, html) {
		const msg = {
			to,
			from: process.env.SENDGRID_FROM,
			subject,
			html,
		};

		try {
			const response = await sgMail.send(msg);
			console.log('Email sent via SendGrid:', response[0].statusCode);
		} catch (error) {
			console.error('SendGrid error:', error.response?.body || error.message);
		}
	}
}

export default new MailService();