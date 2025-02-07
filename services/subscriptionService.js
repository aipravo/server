import { Subscription } from '../models/models.js'

class SubscriptionService {

	async getByUserId(userId) {

		try {
			const subscription = await Subscription.findOne({ where: { userId } })

			return subscription

		} catch (e) {
			throw e
		}

	}

};
export default new SubscriptionService()