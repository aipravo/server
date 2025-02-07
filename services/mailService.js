import nodemailer from 'nodemailer'
import dotenv from 'dotenv';
dotenv.config();

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			secure: true,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD
			}
		})
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