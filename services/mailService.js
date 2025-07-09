import nodemailer from 'nodemailer'
import dotenv from 'dotenv';
dotenv.config();

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true, // true — для 465
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
			tls: {
				// временно для отладки
				rejectUnauthorized: false
			},
			logger: true,
			debug: true
		});

	}

	async sendEmail(to, subject, html) {
		await this.transporter.sendMail({
			from: `"AIПраво" <${process.env.EMAIL_USER}>`,
			to,
			subject,
			html,
		});
	}
}

export default new MailService();