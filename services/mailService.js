import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
// import client from '@sendgrid/client';

dotenv.config();

class MailService {
	constructor() {
		// client.setDataResidency('global');
		sgMail.setApiKey(process.env.SENDGRID_API_KEY);
		// sgMail.setClient(client);
	}

	async sendEmail(to, subject, html) {
		const msg = {
			to,
			from: process.env.SENDGRID_FROM, // ← должен быть подтверждён
			subject,
			text: html.replace(/<[^>]*>/g, ''),
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