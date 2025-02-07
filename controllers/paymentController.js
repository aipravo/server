
import dotenv from 'dotenv';
import ApiError from '../error/ApiError.js';
import paymentService from '../services/paymentService.js';
dotenv.config();

class PaymentController {

	async getPayments(req, res, next) {
		try {
			const userId = req.params.userId

			const payments = await paymentService.getPayments(userId)

			return res.json(payments);

		} catch (e) {
			next(e)
		}

	}

	async addPayment(req, res, next) {
		try {
			const { cost, type, count_days, count_requests } = req.body
			const userId = req.user.id

			const payment = await paymentService.addPayment(userId, cost, type, count_days, count_requests)

			return res.json(payment);

		} catch (e) {
			next(e)
		}

	}
}

export default new PaymentController()