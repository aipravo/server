import ApiError from '../error/ApiError.js';
import subscriptionService from '../services/subscriptionService.js';

class SubscriptionController {

	async getByUserId(req, res, next) {
		try {

			const userId = req.user.id

			const subscription = await subscriptionService.getByUserId(userId)

			return res.json(subscription);
		} catch (e) {
			next(ApiError.badRequest(e))
		}
	}

}

export default new SubscriptionController()