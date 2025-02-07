
import dotenv from 'dotenv';
import ApiError from '../error/ApiError.js';
import balanceService from '../services/balanceService.js';
dotenv.config();

class BalanceController {

	async updateBalance(req, res, next) {
		try {
			const userId = req.user.id
			const { value } = req.body

			if (!value) {
				return next(ApiError.badRequest('Укажите баланс!'))
			}

			return res.json(await balanceService.updateBalance(userId, value));

		} catch (e) {
			next(e)
		}
	}

	async getBalance(req, res, next) {
		try {
			const userId = req.user.id

			const balance = await balanceService.getBalance(userId)

			return res.json(balance.value);

		} catch (e) {
			next(e)
		}

	}

	async setBalance(req, res, next) {
		try {
			const { userId, value } = req.body

			if (!value) {
				return next(ApiError.badRequest('Укажите баланс!'))
			}

			return res.json(await balanceService.setBalance(userId, value));

		} catch (e) {
			next(e)
		}
	}
}

export default new BalanceController()