
import dotenv from 'dotenv';
import ApiError from '../error/ApiError.js';
import requestService from '../services/requestService.js';
dotenv.config();

class RequestController {

	async getRequests(req, res, next) {
		try {
			const userId = req.user.id

			if (!userId) {
				return next(ApiError.notFound())
			}

			const requests = await requestService.getRequests(userId)

			return res.json(requests);

		} catch (e) {
			next(e)
		}

	}

	async getRequestsByUserId(req, res, next) {
		try {
			const userId = req.params.userid

			if (!userId) {
				return next(ApiError.notFound())
			}

			const requests = await requestService.getRequests(userId)

			return res.json(requests);

		} catch (e) {
			next(e)
		}

	}

	async getRequest(req, res, next) {
		try {
			const { id } = req.params

			if (!id) {
				return next(ApiError.notFound())
			}

			const request = await requestService.getRequest(id)

			return res.json(request);

		} catch (e) {
			next(e)
		}

	}

	async createRequest(req, res, next) {
		try {

			const userId = req.user.id

			const request = await requestService.createRequest(userId)

			return res.json(request);

		} catch (e) {
			next(e)
		}
	}



	async createVipRequest(req, res, next) {
		try {

			const userId = req.user.id

			const request = await requestService.createVipRequest(userId)

			return res.json(request);

		} catch (e) {
			next(e)
		}
	}

	async updateAttempts(req, res, next) {
		try {

			const userId = req.user.id

			const { thread_id } = req.body

			const attempts = await requestService.updateAttempts(thread_id, userId)

			return res.json(attempts);

		} catch (e) {
			next(e)
		}
	}


	async createMessage(req, res, next) {
		try {

			const files = req.files

			const { thread_id, content, id } = req.body

			return res.json(await requestService.createMessage(thread_id, content, id, files));

		} catch (e) {
			next(e)
		}
	}


	async getMessages(req, res, next) {
		try {

			const { requestId } = req.params

			return res.json(await requestService.getMessages(requestId));

		} catch (e) {
			next(e)
		}
	}


	async getFirstMessage(req, res, next) {
		try {
			const { requestId } = req.params

			return res.json(await requestService.getFirstMessage(requestId));

		} catch (e) {
			next(e)
		}
	}

	async deleteRequestById(req, res, next) {
		try {
			const { id } = req.params;

			return res.json(await requestService.deleteRequestById(id));

		} catch (e) {
			next(e)
		}
	}

	async deleteRequestsByUserId(req, res, next) {
		try {
			const userId = req.user.id;

			return res.json(await requestService.deleteRequestsByUserId(userId));

		} catch (e) {
			next(e)
		}
	}
}

export default new RequestController()