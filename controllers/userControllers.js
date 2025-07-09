import ApiError from '../error/ApiError.js';
import { User } from '../models/models.js';
import mailService from '../services/mailService.js';
import userService from '../services/userService.js';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();

const generateJwt = (id, email, role) => {
	return jwt.sign(
		{ id, email, role },
		process.env.JWT_SECRET,
		{ expiresIn: '24h' }
	);
};


class UserController {

	async registration(req, res, next) {
		try {
			const { email, password, confirmPassword } = req.body;



			const existingUser = await User.findOne({ where: { email } });
			if (existingUser) {
				return next(ApiError.badRequest('Email уже зарегистрирован!'))
			}

			if (!email) {
				return next(ApiError.badRequest('Введите email!'))
			}

			if (!password) {
				return next(ApiError.badRequest('Введите пароль!'))
			}

			if (!confirmPassword) {
				return next(ApiError.badRequest('Подтвердите пароль!'))
			}

			if (password !== confirmPassword) {
				return next(ApiError.badRequest('Пароли не совпадают!'))
			}

			const html = await userService.registration(email, password)


			// await mailService.sendEmail(email, 'Подтверждение регистрации', html)

			return res.json({ message: "Пожалуйста, перейдите по ссылке, отправленной на вашу электронную почту, чтобы завершить регистрацию" })
		} catch (e) {
			next(ApiError.badRequest(e))
		}
	}

	async reset(req, res, next) {
		try {
			const { email } = req.body;

			if (!email) {
				return next(ApiError.badRequest('Введите email!'))
			}

			const html = await userService.reset(email)

			await mailService.sendEmail(email, 'Сброс пароля', html)

			return res.json({ message: "Пожалуйста, перейдите по ссылке, отправленной на вашу электронную почту, чтобы сбросить пароль" })
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async setNewPassword(req, res, next) {
		try {
			const { token, password, confirmPassword } = req.body;

			if (token === 'undefined') {
				return res.redirect(process.env.CLIENT_URL_ERROR_CONFIRM);
			}

			if (!password) {
				return next(ApiError.badRequest('Введите пароль!'))
			}

			if (!confirmPassword) {
				return next(ApiError.badRequest('Подтвердите пароль!'))
			}

			if (password !== confirmPassword) {
				return next(ApiError.badRequest('Пароли не совпадают!'))
			}

			await userService.setNewPassword(token, password)

			return res.json({ message: "Пароль успешно изменен" })
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async confirm(req, res, next) {
		try {
			const token = req.params.token

			if (token === 'undefined') {
				return res.redirect(process.env.CLIENT_URL_ERROR_CONFIRM);
			}

			const result = await userService.confirm(token)

			if (!result) {
				return res.redirect(process.env.CLIENT_URL_ERROR_CONFIRM);
			}

			return res.redirect(process.env.CLIENT_URL_SUCCESS_CONFIRM);
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async login(req, res, next) {
		try {
			const { email, password } = req.body;

			const user = await User.findOne({ where: { email } });
			if (!user) {
				return next(ApiError.badRequest('Неверный или незарегистрированный email!'))
			}

			let comparePassword = bcrypt.compareSync(password, user.password)
			if (!comparePassword) {
				return next(ApiError.badRequest('Указан неверный пароль'))
			}

			if (!email) {
				return next(ApiError.badRequest('Введите email!'))
			}

			if (!password) {
				return next(ApiError.badRequest('Введите пароль!'))
			}

			const { token, role } = await userService.login(email);

			return res.json({ token, role });
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async check(req, res, next) {
		try {
			const token = generateJwt(req.user.id, req.user.email, req.user.role);
			return res.json({ token, role: req.user.role });
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async createAdmin(req, res, next) {
		try {
			const { email, password } = req.body;

			if (!email) {
				return next(ApiError.badRequest('Введите email!'))
			}

			if (!password) {
				return next(ApiError.badRequest('Введите пароль!'))
			}

			const admin = await userService.createAdmin(email, password);

			return res.json(admin)
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async removeUser(req, res, next) {
		try {
			const id = req.params.id;

			await userService.removeUser(id);

			return res.json({ message: `Пользователь с ID: ${id} успешно удален` })
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async getUsers(req, res, next) {
		try {

			const users = await userService.getUsers();
			if (!users) {
				return next(ApiError.badRequest('Пользователи отсутствуют!'))
			}

			return res.json(users)
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async getUsersInfo(req, res, next) {
		try {

			const users = await userService.getUsersInfo();
			if (!users) {
				return next(ApiError.badRequest('Пользователи отсутствуют!'))
			}

			return res.json(users)
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async getUser(req, res, next) {
		try {
			const id = req.params.id

			const user = await userService.getUser(id);
			if (!user) {
				return next(ApiError.badRequest('Пользователь отсутствует!'))
			}

			return res.json(user)
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async getAdmins(req, res, next) {
		try {

			const id = req.user.id

			const admins = await userService.getAdmins(id);

			return res.json(admins)
		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async updateUser(req, res, next) {
		try {

			const { id, password, role } = req.body

			if (!password && !role) {
				return next(ApiError.badRequest('Заполните поля!'))
			}

			if (password && !role) {
				const user = await userService.updateUser(id, password, null);
				return res.json(user)
			}

			if (!password && role) {
				const user = await userService.updateUser(id, null, role);
				return res.json(user)
			}

			const user = await userService.updateUser(id, password, role);
			return res.json(user)


		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}

	async changePassword(req, res, next) {
		try {

			const id = req.user.id
			const { password, confirmPassword } = req.body;

			if (!password) {
				return next(ApiError.badRequest('Введите пароль!'))
			}

			if (!confirmPassword) {
				return next(ApiError.badRequest('Подтвердите пароль!'))
			}

			if (password !== confirmPassword) {
				return next(ApiError.badRequest('Пароли не совпадают!'))
			}

			await userService.changePassword(password, id)

			return res.json({ message: "Пароль успешно изменен" })

		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}


	async changeAdminPassword(req, res, next) {
		try {

			const { email, password } = req.body;

			if (!password) {
				return next(ApiError.badRequest('Введите пароль!'))
			}

			const admin = await userService.changeAdminPassword(email, password)

			return res.json(admin)

		} catch (e) {
			next(ApiError.badRequest(e.message))
		}
	}
}

export default new UserController();
