import { Balance, Message, Request } from '../models/models.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import ApiError from '../error/ApiError.js';
import balanceService from './balanceService.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs'
import fse from 'fs-extra/esm'
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_KEY || "ВАШ_API_KEY",
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

	async createMessage(thread_id, content, id, files = []) {
		try {
			const messages = [];
			const filePaths = [];
			let fileContent = '';

			if (files.length === 0 || !files) {
				messages.push({ role: 'user', content });
				fileContent += content;
			} else {
				await fse.ensureDir('processed');

				// Обработка файлов
				for (const file of files) {
					try {
						const readingContent = await this.readFileContent(file);
						fileContent += readingContent ? `\n--- Содержимое файла:\n${readingContent}\n` : '';

						const extension = path.extname(file.originalname);
						const fileName = `${uuidv4()}${extension}`;
						const filePath = path.join('processed', fileName);

						await fse.move(file.path, filePath);
						filePaths.push(filePath);
					} catch (error) {
						console.error(`Ошибка обработки файла ${file.originalname}:`, error);
					}
				}

				messages.push({
					role: 'user',
					content: `Данные из файлов: \n${fileContent}.\n\n\nМой вопрос, требование или указание: ${content}`,
				});
			}

			const assistant = await openai.beta.assistants.retrieve(
				process.env.OPENAI_ASS
			);

			const thread = await openai.beta.threads.retrieve(
				thread_id
			);

			await openai.beta.threads.messages.create(
				thread.id,
				...messages
			);

			const run = await openai.beta.threads.runs.create(
				thread.id,
				{ assistant_id: assistant.id }
			);


			const resp = await this.checkStatus(thread.id, run.id);
			let aiContent;
			// После завершения статуса completed
			if (resp.status === 'completed') {
				const messages = await openai.beta.threads.messages.list(
					run.thread_id
				);
				for (const message of messages.data.reverse()) {
					if (message.role === 'assistant') {
						aiContent = message.content[0].text.value
					}
				}
			}

			if (!aiContent) {
				throw ApiError.badRequest('Ошибка ответа от AI')
			} else {
				await Message.create({ role: "user", files: filePaths, content, requestId: id });
				await Message.create({ role: "assistant", content: aiContent, requestId: id });
			}

			return aiContent

		} catch (error) {
			console.error(`Ошибка в createMessage: ${error.message}`);
			throw error;
		}
	}


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
			const filePath = file.path;

			if (fileType === ".pdf") {
				const pdfBuffer = await fs.promises.readFile(filePath);
				const pdfData = await pdfParse(pdfBuffer);
				return pdfData.text.trim() || null;
			}

			if (fileType === ".docx") {
				const docxBuffer = await fs.promises.readFile(filePath);
				const result = await mammoth.extractRawText({ buffer: docxBuffer });
				return result.value.trim() || null;
			}

			if (fileType === ".doc") {
				const extractor = new WordExtractor();
				const doc = await extractor.extract(filePath);
				return doc.getBody().trim() || null;
			}

			if ([".txt", ".csv", ".json"].includes(fileType)) {
				const content = await fs.promises.readFile(filePath, "utf-8");
				return content.trim() || null;
			}

			return "Неподдерживаемый формат файла";

		} catch (error) {
			console.error(`Ошибка при чтении файла ${file.originalname}:`, error);
			return null;
		}
	}


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