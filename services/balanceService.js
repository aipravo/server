import { Balance } from '../models/models.js';

class BalanceService {

	async updateBalance(userId, value) {
		try {

			const old = await Balance.findOne({ where: { userId } });

			const newBalance = Number(old.value) + Number(value)
			if (newBalance < 0) {
				throw new Error('Недостаточно средств')
			}

			await Balance.update({ value: newBalance }, { where: { userId } });

			return await Balance.findOne({ where: { userId } });

		} catch (e) {
			throw e
		}
	}

	async getBalance(userId) {
		try {
			return await Balance.findOne({ where: { userId } })
		} catch (e) {
			throw e
		}
	}

	async setBalance(userId, value) {
		try {
			await Balance.update({ value }, { where: { userId } });
			return await Balance.findOne({ where: { userId } })
		} catch (e) {
			throw e
		}
	}
}

export default new BalanceService()