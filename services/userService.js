import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv';
import { Balance, Message, Payment, Request, Subscription, User } from '../models/models.js';
import ApiError from '../error/ApiError.js';
import { Op } from 'sequelize';
dotenv.config();

const generateJwt = (id, email, role) => {
	return jwt.sign(
		{ id, email, role },
		process.env.JWT_SECRET,
		{ expiresIn: '24h' }
	)
}

class UserService {

	async registration(email, password) {
		try {
			const hashedPassword = await bcrypt.hash(password, 10);

			const token = jwt.sign({ email, hashedPassword }, process.env.JWT_SECRET, {
				expiresIn: "24h",
			});

			const confirmLink = `https://aipravo.kz/user/confirm/${token}`;

			const html = `
				<table
					style="
						width: 100%;
						height: 100%;
						min-height: 300px;
						text-align: center;
						background-color: #f3f3f3;
					"
				>
					<tr>
						<td
							style="
								text-align: center;
								vertical-align: middle;
								padding: 20px;
							"
						>
							<a
								href="${confirmLink}"
								style="
									display: inline-block;
									width: 280px;
									height: 48px;
									border: 1px solid #424242;
									background-color: #424242;
									color: #ffffff;
									font-size: 16px;
									line-height: 48px;
									text-align: center;
									text-decoration: none;
									border-radius: 4px;
								"
							>
								Подтвердите ваш Email
							</a>
						</td>
					</tr>
				</table>
			`

			return html
		} catch (e) {
			throw e
		}
	}

	async reset(email) {
		try {
			const userExisting = await User.findOne({ where: { email } });
			if (!userExisting) {
				throw new Error('Пользователь не зарегистрирован');
			}

			const token = jwt.sign({ email }, process.env.JWT_SECRET, {
				expiresIn: "1h",
			});

			const confirmLink = `${process.env.CLIENT_URL}/reset/${token}`;

			const html = `
				<table
					style="
						width: 100%;
						height: 100%;
						min-height: 300px;
						text-align: center;
						background-color: #f3f3f3;
					"
				>
					<tr>
						<td
							style="
								text-align: center;
								vertical-align: middle;
								padding: 20px;
							"
						>
							<a
								href="${confirmLink}"
								style="
									display: inline-block;
									width: 280px;
									height: 48px;
									border: 1px solid #424242;
									background-color: #424242;
									color: #ffffff;
									font-size: 16px;
									line-height: 48px;
									text-align: center;
									text-decoration: none;
									border-radius: 4px;
								"
							>
								Сбросить пароль
							</a>
						</td>
					</tr>
				</table>
			`

			return html
		} catch (e) {
			throw e
		}
	}

	async setNewPassword(token, password) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			const { email } = decoded;

			const user = await User.findOne({ where: { email } });
			if (!user) {
				throw new Error('Пользователь не зарегистрирован!')
			}

			const hashedPassword = await bcrypt.hash(password, 10);

			user.update({ password: hashedPassword })

			return user
		} catch (e) {
			throw e
		}
	}

	async confirm(token) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			const { email, hashedPassword } = decoded;

			const userExisting = await User.findOne({ where: { email } });
			if (userExisting) {
				return false;
			}

			const user = await User.create({
				email,
				password: hashedPassword
			});

			await Balance.create({
				userId: user.id
			})

			await Subscription.create({
				userId: user.id
			})

			return true
		} catch (e) {
			throw e
		}
	}

	async login(email) {
		try {

			const user = await User.findOne({ where: { email } });

			if (!user) {
				throw ApiError.BadRequest('Пользователь не зарегистрирован');
			}

			const token = generateJwt(user.id, user.email, user.role)


			return { token, role: user.role }

		} catch (e) {
			throw e
		}
	}

	async createAdmin(email, password) {
		try {
			const existAdmin = await User.findOne({ where: { email } })
			if (existAdmin) {
				throw new Error('Email уже зарегистрирован');
			}
			const hashedPassword = await bcrypt.hash(password, 10);

			const admin = await User.create({
				email,
				role: 'ADMIN',
				password: hashedPassword
			});

			return admin
		} catch (e) {
			throw e
		}
	}

	async removeUser(id) {
		if (id === undefined || id === null) {
			console.error('ID пользователя не указан');
			return;
		}
		try {
			const user = await User.findByPk(id);
			if (user) {
				await user.destroy();
			}

			const balance = await Balance.findOne({ where: { userId: id } });
			if (balance) {
				await balance.destroy();
			}

			const subscription = await Subscription.findOne({ where: { userId: id } });
			if (subscription) {
				await subscription.destroy();
			}

			// Удаление всех платежей пользователя
			const payments = await Payment.findAll({ where: { userId: id } });
			if (payments.length) {
				await Promise.all(payments.map(payment => payment.destroy()));
			}

			// Удаление всех запросов и связанных с ними сообщений
			const requests = await Request.findAll({ where: { userId: id } });
			if (requests.length) {
				await Promise.all(
					requests.map(async (request) => {
						const messages = await Message.findAll({ where: { requestId: request.id } });
						if (messages.length) {
							await Promise.all(messages.map(message => message.destroy()));
						}
						await request.destroy();
					})
				);
			}

			console.log(`Пользователь с ID ${id} и все его данные успешно удалены.`);
		} catch (e) {
			console.error('Error removeUser:', e.message);
		}
	}

	async getUsers() {
		try {

			return await User.findAll({ where: { role: 'USER' } });
		} catch (e) {
			throw e
		}
	}

	async getUsersInfo() {
		try {
			const users = await User.findAll({ where: { role: 'USER' } });

			const usersData = await Promise.all(users.map(async (user) => {

				const [balance, subscription, payments] = await Promise.all([
					Balance.findOne({ where: { userId: user.id } }) ?? {},
					Subscription.findOne({ where: { userId: user.id } }) ?? {},
					Payment.findAll({ where: { userId: user.id } }) ?? [],
				]);

				return {
					id: user.id,
					email: user.email,
					balance,
					subscription,
					payments
				};
			}));

			return usersData;
		} catch (e) {
			throw e;
		}
	}



	async getUser(id) {
		try {
			return await User.findOne({ where: { id } });
		} catch (e) {
			throw e
		}
	}

	async getAdmins(id) {
		try {
			const admins = await User.findAll({
				where: {
					role: 'ADMIN',
					email: { [Op.ne]: 'ikim.trader@gmail.com' },
					id: { [Op.ne]: id }
				}
			});

			return admins;
		} catch (e) {
			throw e
		}
	}

	async updateUser(id, password, role) {
		try {

			if (password && !role) {
				const hashedPassword = await bcrypt.hash(password, 10);
				await User.update({ password: hashedPassword }, { where: { id } });

				return await User.findOne({ where: { id } })
			}

			if (!password && role) {
				await User.update({ role }, { where: { id } });

				return await User.findOne({ where: { id } })
			}

			const hashedPassword = await bcrypt.hash(password, 10);
			await User.update({ role, password: hashedPassword }, { where: { id } });

			return await User.findOne({ where: { id } })

		} catch (e) {
			throw e
		}
	}

	async changePassword(pass, id) {
		try {
			const password = await bcrypt.hash(pass, 10);
			return await User.update({ password }, { where: { id } });
		} catch (e) {
			throw e
		}
	}

	async changeAdminPassword(email, pass) {
		try {
			const user = await User.findOne({ where: { email } })
			if (!user) {
				throw ApiError.badRequest('Пользователь не найден')
			}

			const password = await bcrypt.hash(pass, 10);

			user.update({ password })

			return user
		} catch (e) {
			throw e
		}
	}

}

export default new UserService();