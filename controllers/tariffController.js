
import dotenv from 'dotenv';
import ApiError from '../error/ApiError.js';
import tariffService from '../services/tariffService.js';
dotenv.config();

class TariffController {

	async create(req, res, next) {
		try {

			const { type, cost, count_requests, count_days } = req.body

			if (!type) {
				return next(ApiError.badRequest('Укажите тип тарифа'))
			}

			if (!cost) {
				return next(ApiError.badRequest('Укажите стоимость'))
			}


			if (type === 'fixed' && !count_requests) {
				return next(ApiError.badRequest('Укажите кол-во запросов'))
			}


			if (type === 'subscription' && !count_days) {
				return next(ApiError.badRequest('Укажите кол-во дней'))
			}

			const tariff = await tariffService.create(type, cost, count_requests, count_days)

			return res.json(tariff);
		} catch (e) {
			next(ApiError.badRequest(e))
		}
	}

	async getAll(req, res, next) {
		try {

			const tariffs = await tariffService.getAll()

			return res.json(tariffs);
		} catch (e) {
			next(ApiError.badRequest(e))
		}
	}

	async deleteTariffById(req, res, next) {
		try {
			const { id } = req.params

			return res.json(await tariffService.deleteTariffById(id));
		} catch (e) {
			next(ApiError.badRequest(e))
		}
	}

}

export default new TariffController()