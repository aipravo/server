import cron from 'node-cron';
import cleanService from './services/cleanService.js'; // Подключение CleanService

// Запуск задачи очистки каждые 30 дней (1 числа каждого месяца в 00:00)
cron.schedule('0 0 1 * *', async () => {
	try {
		await cleanService.cleanAll(); // Выполнить полную очистку
	} catch (error) {
		console.error('Ошибка при выполнении cron-задачи очистки:', error.message);
	}
});
