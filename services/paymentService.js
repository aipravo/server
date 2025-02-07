import ApiError from '../error/ApiError.js';
import { Balance, Payment, Subscription } from '../models/models.js';

class PaymentService {

	async getPayments(userId) {
		try {
			const payments = await Payment.findAll({ where: { userId } })

			if (!payments) {
				return 'Платежей нет'
			}

			return payments
		} catch (e) {
			throw e
		}
	}

	async addPayment(userId, cost, type, count_days, count_requests) {
		try {
			// Создание платежа
			const payment = await Payment.create({ userId, value: cost });

			// Найти или создать подписку
			const [subscription] = await Subscription.findOrCreate({ where: { userId } });

			// Обновление подписки
			if (type === 'subscription') {
				subscription.is_active = true;
				subscription.start_date = new Date();
				subscription.period = count_days;
			} else {
				subscription.is_active = false;
				subscription.start_date = null;
				subscription.period = null;

				const balance = await Balance.findOne({ where: { userId } });
				const newBalance = Number(balance.value) + Number(count_requests);

				if (newBalance < 0) {
					throw ApiError.badRequest('Insufficient funds');
				}

				balance.value = newBalance;
				await balance.save();
			}
			await subscription.save();

			return payment;
		} catch (e) {
			throw new Error(`Error in addPayment: ${e.message}`);
		}
	}

}

export default new PaymentService()