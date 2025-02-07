import { Tariff } from '../models/models.js'


class TariffService {

	async create(type, cost, count_requests, count_days) {
		try {

			const tariffData = {
				type,
				cost,
				count_requests: type === 'fixed' ? count_requests : null,
				count_days: type === 'subscription' ? count_days : null,
			};

			const tariff = await Tariff.create(tariffData);

			return tariff;
		} catch (e) {
			throw e
		}
	}



	async getAll() {
		try {

			const tariffs = await Tariff.findAll();

			return tariffs;
		} catch (e) {
			throw e
		}
	}

	async deleteTariffById(id) {
		try {

			const tariff = await Tariff.findByPk(id);

			tariff.destroy()

			return { message: "Тариф удален" };
		} catch (e) {
			throw e
		}
	}

}

export default new TariffService()