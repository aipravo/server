import { Balance, Message, Request } from '../models/models.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import ApiError from '../error/ApiError.js';
import balanceService from './balanceService.js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs'
import fse from 'fs-extra/esm'
import mammoth from 'mammoth';
// import WordExtractor from 'word-extractor';
import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_KEY,
});

class RequestService {

	async getRequests(userId) {
		try {
			return await Request.findAll({ where: { userId } })
		} catch (e) {
			throw e
		}
	}

	async createRequest(userId) {
		try {

			const balance = await Balance.findOne({ where: { userId } })

			if (!balance) {
				throw ApiError.notFound('balance')
			}

			if (balance.value === 0) {
				throw ApiError.badRequest('Недостаточно средств')
			}

			const thread_id = (await openai.beta.threads.create()).id;

			if (!thread_id) {
				throw ApiError.notFound('thread_id')
			}

			await balanceService.updateBalance(userId, -1)

			const request = await Request.create({ thread_id, userId })

			return request

		} catch (e) {
			throw e
		}
	}

	async createVipRequest(userId) {
		try {

			const thread_id = (await openai.beta.threads.create()).id;

			if (!thread_id) {
				throw ApiError.notFound('thread_id')
			}

			const request = await Request.create({ thread_id, userId })

			return request

		} catch (e) {
			throw e
		}
	}

	async createTrainRequest() {
		try {

			const thread_id = (await openai.beta.threads.create()).id;

			if (!thread_id) {
				throw ApiError.notFound('thread_id')
			}

			return thread_id

		} catch (e) {
			throw e
		}
	}

	async updateAttempts(thread_id, userId) {
		try {
			const request = await Request.findOne({ where: { thread_id } });

			const { attempts } = request;

			if (attempts === 0) {
				// Deduct balance if attempts are exhausted
				await balanceService.updateBalance(userId, -1);
				// Reset attempts to 3
				await request.update({ attempts: 3 }, { where: { thread_id } });
				return request.attempts; // Return the reset attempts value
			}

			// Decrease attempts by 1
			const newAttempts = attempts - 1;
			await request.update({ attempts: newAttempts }, { where: { thread_id } });

			return newAttempts;

		} catch (e) {
			console.error(`Error updating attempts: ${e.message}`);
			throw e;
		}
	}


	async getRequest(id) {
		try {
			return await Request.findByPk(id)
		} catch (e) {
			throw e
		}
	}

	async createAdminMessage(thread_id, content, id, files) {
		try {
			const fileIds = [];
			const filePaths = [];
			let fileContent = '';

			if (files.length > 0) {


				for (const file of files) {
					const readingContent = await this.readFileContent(file);
					fileContent += `\n--- Содержимое файла:\n${readingContent}\n`;

					const extension = path.extname(file.originalname);
					const fileName = `${uuidv4()}${extension}`;
					const filePath = path.join("processed", fileName);

					// Загружаем файл в OpenAI
					await fse.move(file.path, filePath);

					const fileStream = fs.createReadStream(filePath);
					const uploadedFile = await openai.files.create({
						file: fileStream,
						purpose: "assistants",
					});

					fileIds.push(uploadedFile.id);
					filePaths.push(filePath);
				}


				const vectorStoreId = process.env.OPENAI_VS || 'vs_67aa63b760dc819183cdb03a16b40e18';
				const batch = await openai.beta.vectorStores.fileBatches.create(vectorStoreId, { file_ids: fileIds });

				await this.pollFileBatchStatus(vectorStoreId, batch.id);
			}

			const assistant = await openai.beta.assistants.retrieve(
				process.env.OPENAI_ASS
			);

			console.log(assistant);


			await openai.beta.threads.messages.create(thread_id, {
				role: "user",
				content: fileContent ? `${fileContent}\n ${content}` : content
			});

			// Запускаем ассистента
			const run = await openai.beta.threads.runs.create(thread_id, {
				assistant_id: process.env.OPENAI_ASS,
			});

			// Ждем завершения работы ассистента
			let runStatus;
			do {
				runStatus = await openai.beta.threads.runs.retrieve(thread_id, run.id);
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Ждем 2 секунды
			} while (runStatus.status !== "completed");

			// Получаем ответ ассистента
			const messages = await openai.beta.threads.messages.list(thread_id);
			const aiMessage = messages.data.find((msg) => msg.role === "assistant");

			// Сохраняем в БД
			await Message.create({ role: "user", files: filePaths, content, requestId: id });
			await Message.create({ role: "assistant", content: aiMessage.content[0].text.value, requestId: id });

			return aiMessage.content[0].text.value.replace(/\【.*?\】/g, '');
		} catch (e) {
			console.error(e);
			throw e;
		}
	}

	async createMessage(thread_id, content, id, files) {
		try {
			const fileIds = [];
			const filePaths = [];
			let fileContent = '';

			if (files.length > 0) {


				for (const file of files) {

					const readingContent = await this.readFileContent(file);
					fileContent += `\n--- Содержимое файла:\n${readingContent}\n`;

					await fse.ensureDir('processed');
					const extension = path.extname(file.originalname);
					const fileName = `${uuidv4()}${extension}`;
					const filePath = path.join("processed", fileName);

					// Загружаем файл в OpenAI
					await fse.move(file.path, filePath);

					const fileStream = fs.createReadStream(filePath);
					const uploadedFile = await openai.files.create({
						file: fileStream,
						purpose: "assistants",
					});

					fileIds.push(uploadedFile.id);
					filePaths.push(filePath);
				}


				// const vectorStoreId = 'vs_67aa5327eb388191baf9006737340acf';
				// const batch = await openai.beta.vectorStores.fileBatches.create(vectorStoreId, { file_ids: fileIds });

				// await this.pollFileBatchStatus(vectorStoreId, batch.id);
			}

			await openai.beta.threads.messages.create(thread_id, {
				role: "user",
				content: fileContent ? `${fileContent}\n ${content}` : content
			});

			// Запускаем ассистента
			const run = await openai.beta.threads.runs.create(thread_id, {
				assistant_id: process.env.OPENAI_ASS,
			});

			// Ждем завершения работы ассистента
			let runStatus;
			do {
				runStatus = await openai.beta.threads.runs.retrieve(thread_id, run.id);
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Ждем 2 секунды
			} while (runStatus.status !== "completed");

			// Получаем ответ ассистента
			const messages = await openai.beta.threads.messages.list(thread_id);
			const aiMessage = messages.data.find((msg) => msg.role === "assistant");

			// Сохраняем в БД
			await Message.create({ role: "user", files: filePaths, content, requestId: id });
			await Message.create({ role: "assistant", content: aiMessage.content[0].text.value, requestId: id });

			return aiMessage.content[0].text.value.replace(/\【.*?\】/g, '');
		} catch (e) {
			console.error(e);
			throw e;
		}
	}

	async pollFileBatchStatus(vectorStoreId, batchId) {
		let batchStatus;
		do {
			batchStatus = await openai.beta.vectorStores.fileBatches.retrieve(vectorStoreId, batchId);
			console.log(`Индексация файлов: ${batchStatus.status}`);
			await new Promise(resolve => setTimeout(resolve, 1000)); // Ждать 3 сек
		} while (batchStatus.status !== "completed");
	}

	// async createMessage(thread_id, content, id, files) {
	// 	try {

	// 		const messages = [];
	// 		const filePaths = [];
	// 		let fileContent = '';

	// 		// Если есть только текст
	// 		if (files.length === 0) {
	// 			messages.push({
	// 				role: 'user',
	// 				content,
	// 			});
	// 			fileContent += content;
	// 		}

	// 		await fse.ensureDir('processed');

	// 		// Обрабатываем файлы
	// 		for (const file of files) {
	// 			// Чтение содержимого файла
	// 			const readingContent = await this.readFileContent(file);
	// 			fileContent += `\n--- Содержимое файла:\n${readingContent}\n`;

	// 			const extension = path.extname(file.originalname);
	// 			const fileName = `${uuidv4()}${extension}`;
	// 			const filePath = path.join('processed', fileName);


	// 			await fse.move(file.path, filePath);

	// 			filePaths.push(filePath);
	// 		}

	// 		// Добавляем контент в сообщение
	// 		messages.push({
	// 			role: 'user',
	// 			content: `${content}\n\n\n${fileContent}`,
	// 		});



	// 		const assistant = await openai.beta.assistants.retrieve(
	// 			process.env.OPENAI_ASS
	// 		);

	// 		const thread = await openai.beta.threads.retrieve(
	// 			thread_id
	// 		);

	// 		await openai.beta.threads.messages.create(
	// 			thread.id,
	// 			...messages
	// 		);

	// 		const run = await openai.beta.threads.runs.create(
	// 			thread.id,
	// 			{ assistant_id: assistant.id }
	// 		);


	// 		const resp = await this.checkStatus(thread.id, run.id);
	// 		let aiContent;
	// 		// После завершения статуса completed
	// 		if (resp.status === 'completed') {
	// 			const messages = await openai.beta.threads.messages.list(
	// 				run.thread_id
	// 			);
	// 			for (const message of messages.data.reverse()) {
	// 				if (message.role === 'assistant') {
	// 					aiContent = message.content[0].text.value
	// 				}
	// 			}
	// 		}

	// 		if (!aiContent) {
	// 			throw ApiError.badRequest('Ошибка ответа от AI')
	// 		} else {
	// 			await Message.create({ role: "user", files: filePaths, content, requestId: id });
	// 			await Message.create({ role: "assistant", content: aiContent, requestId: id });
	// 		}

	// 		return aiContent

	// 	} catch (e) {
	// 		throw e
	// 	}
	// }


	async checkStatus(thread_id, run_id) {
		let status = '';
		let resp; // Переменная объявлена здесь, чтобы быть доступной вне блока do-while
		do {
			resp = await openai.beta.threads.runs.retrieve(
				thread_id,
				run_id
			);
			status = resp.status;
			// console.log(`Current status: ${status}`);
			if (status !== 'completed') {
				await new Promise(resolve => setTimeout(resolve, 1000)); // Ждать 1 секунду перед повторной проверкой
			}
		} while (status !== 'completed');

		return resp;
	}

	async readFileContent(file) {
		try {
			const fileType = path.extname(file.originalname).toLowerCase();
			const fileBuffer = fs.readFileSync(file.path);

			if (fileType === ".pdf") {
				const pdfData = await pdfParse(fileBuffer);
				return pdfData.text;
			} else if (fileType === ".docx") {
				const result = await mammoth.extractRawText({ buffer: fileBuffer });
				return result.value;
			} else {
				throw new Error(`Unsupported file type: ${fileType}`);
			}
		} catch (error) {
			console.error(`Error reading file ${file.originalname}:`, error);
			throw new Error(`Failed to read file: ${file.originalname}`);
		}
	}
	// async readFileContent(file) {
	// 	const fileType = path.extname(file.originalname).toLowerCase();
	// 	return new Promise((resolve, reject) => {
	// 		try {
	// 			if (fileType === ".pdf") {
	// 				fs.readFile(file.path, async (err, pdfBuffer) => {
	// 					if (err) {
	// 						return reject(`Error reading file ${file.originalname}: ${err}`);
	// 					}
	// 					const pdfData = await pdfParse(pdfBuffer);
	// 					resolve(pdfData.text);
	// 				});
	// 			} else if (fileType === ".docx") {
	// 				fs.readFile(file.path, async (err, docxBuffer) => {
	// 					if (err) {
	// 						return reject(`Error reading file ${file.originalname}: ${err}`);
	// 					}
	// 					const result = await mammoth.extractRawText({ buffer: docxBuffer });
	// 					resolve(result.value);
	// 				});
	// 			} else {
	// 				reject(`Unsupported file type: ${fileType}`);
	// 			}
	// 		} catch (error) {
	// 			console.error(`Error reading file ${file.originalname}:`, error);
	// 			reject(`Failed to read file: ${file.originalname}`);
	// 		}
	// 	});
	// }


	async getMessages(requestId) {
		try {
			return await Message.findAll({
				where: { requestId },
				order: [['id', 'ASC']],
			});
		} catch (e) {
			throw e
		}
	}

	async getFirstMessage(requestId) {
		try {
			const message = await Message.findOne({
				where: { requestId, role: "user" },
				order: [["id", "ASC"]],
			});

			return message ? message.dataValues.content : 'Пустой запрос';

		} catch (e) {
			throw e
		}
	}

	async deleteRequestById(id) {
		try {
			const request = await Request.findByPk(id)

			request.destroy()

			return { message: "Запрос удален" }

		} catch (e) {
			throw e
		}
	}

	async deleteRequestsByUserId(userId) {
		try {
			await Request.destroy({ where: { userId } })

			return { message: "Запросы удален" }

		} catch (e) {
			throw e
		}
	}

}

export default new RequestService()