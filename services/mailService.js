import nodemailer from 'nodemailer'
import dotenv from 'dotenv';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dotenv.config();

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,              // ✅ 587 предпочтительнее, чем 465
			secure: false,          // ✅ обязательно false для 587
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD, // должен быть пароль приложения!
			},
			tls: {
				rejectUnauthorized: false, // временно можно оставить true, если будет ошибка сертификата
			},
			logger: true,
			debug: true,
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