import fs from 'fs/promises';
import path from 'path';
import { Op } from 'sequelize';
import { Message } from '../models/models.js';

const PROCESSED_FOLDER = path.resolve('processed');

class CleanService {
	/**
	 * Очистка папки processed
	 */
	async cleanProcessedFolder() {
		try {
			const files = await fs.readdir(PROCESSED_FOLDER); // Чтение файлов в папке
			for (const file of files) {
				const filePath = path.join(PROCESSED_FOLDER, file);
				await fs.unlink(filePath); // Удаление каждого файла
			}
			console.log('Папка processed очищена');
		} catch (error) {
			console.error('Ошибка при очистке папки processed:', error.message);
			throw error
		}
	}

	/**
	 * Очистка поля files в таблице Message
	 */
	async cleanMessageFiles() {
		try {
			const result = await Message.update(
				{ files: [] }, // Установить files как пустой массив
				{ where: { files: { [Op.not]: [] } } } // Только для записей с непустым полем files
			);
			console.log(`Очищено записей в таблице Message: ${result[0]}`);
		} catch (error) {
			console.error('Ошибка при очистке поля files в таблице Message:', error.message);
			throw error
		}
	}

	/**
	 * Выполнить обе задачи очистки
	 */
	async cleanAll() {
		console.log('Начало задачи очистки...');
		await this.cleanProcessedFolder();
		await this.cleanMessageFiles();
		console.log('Задача очистки завершена');
	}


}
export default new CleanService();
