import nodemailer from 'nodemailer'
import dotenv from 'dotenv';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dotenv.config();

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: Number(process.env.EMAIL_PORT),
			secure: true, // 465 = secure:true
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS
			},
			logger: true,
			debug: true
		});
	}

	async sendEmail(to, subject, html) {
		try {
			const info = await this.transporter.sendMail({
				from: `"AIПраво" <${process.env.EMAIL_USER}>`,
				to,
				subject,
				html,
			});
			console.log('Email sent:', info.messageId);
		} catch (error) {
			console.error('Error sending email:', error);
		}
	}
}

export default new MailService();