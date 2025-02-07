import cron from 'node-cron';
import { Subscription } from './models/models.js';

// Функция для проверки подписок
const checkSubscriptions = async () => {
	try {
		const now = new Date(); // Текущая дата
		console.log(`[${now.toISOString()}] Запуск проверки подписок...`);

		// Ищем активные подписки
		const subscriptions = await Subscription.findAll({
			where: { is_active: true }
		});

		for (const sub of subscriptions) {
			if (sub.start_date && sub.period) {
				// Вычисляем дату окончания подписки
				const endDate = new Date(sub.start_date);
				endDate.setDate(endDate.getDate() + sub.period);

				// Если подписка истекла
				if (endDate <= now) {
					console.log(`Подписка ID ${sub.id} истекла, отключаем...`);
					await sub.update({
						is_active: false,
						start_date: null,
						period: null
					});
				}
			}
		}

		console.log('Проверка подписок завершена.');
	} catch (error) {
		console.error('Ошибка при проверке подписок:', error);
	}
};

// Запускаем cron-задание каждый день в 3:00 ночи по GMT+5
cron.schedule('0 22 * * *', async () => {
	console.log('Запуск задачи проверки подписок');
	await checkSubscriptions();
}, {
	timezone: "Etc/GMT-5" // Указываем часовой пояс для cron
});


console.log('Cron-задача запущена: проверка подписок каждый день в 3:00 GMT+5.');
