import { DataTypes } from 'sequelize';
import sequelize from '../db.js';
import bcrypt from 'bcryptjs'

export const User = sequelize.define('user', {
	id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
	password: { type: DataTypes.STRING, allowNull: false },
	role: { type: DataTypes.ENUM('USER', 'ADMIN'), defaultValue: 'USER' },
})

export const Subscription = sequelize.define('subscription', {
	id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
	start_date: { type: DataTypes.DATE, defaultValue: null },
	period: { type: DataTypes.INTEGER, defaultValue: null },
})

export const Balance = sequelize.define('balance', {
	id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	value: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, validate: { min: 0 } },
})

export const Request = sequelize.define('request', {
	id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	attempts: { type: DataTypes.INTEGER, defaultValue: 3, allowNull: false, validate: { min: 0 } },
	thread_id: { type: DataTypes.STRING }
})

export const Message = sequelize.define('message', {
	id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	role: { type: DataTypes.ENUM('user', 'assistant'), allowNull: false },
	files: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
	content: { type: DataTypes.TEXT }
})

export const Payment = sequelize.define('payment', {
	id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	value: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
})

export const Tariff = sequelize.define('tariff', {
	id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	type: { type: DataTypes.STRING, defaultValue: null },
	cost: { type: DataTypes.INTEGER, defaultValue: null },
	count_requests: { type: DataTypes.INTEGER, defaultValue: null },
	count_days: { type: DataTypes.INTEGER, defaultValue: null }
})

User.hasOne(Subscription)
Subscription.belongsTo(User)

User.hasOne(Balance)
Balance.belongsTo(User)

User.hasMany(Payment)
Payment.belongsTo(User)

User.hasMany(Request)
Request.belongsTo(User)

Request.hasMany(Message)
Message.belongsTo(Request)

const models = {
	User,
	Subscription,
	Balance,
	Request,
	Message,
	Payment,
	Tariff,
};

export const createAdminUser = async () => {
	try {
		await User.sync(); // Создает таблицу, если её нет (или обновляет схему)

		const adminExists = await User.findOne({ where: { email: 'ikim.trader@gmail.com' } });

		if (!adminExists) {
			const hashedPassword = await bcrypt.hash('Kimxan110784', 10); // Хешируем пароль
			await User.create({
				email: 'ikim.trader@gmail.com',
				password: hashedPassword,
				role: 'ADMIN',
			});

			console.log('✅ Админ создан: ikim.trader@gmail.com');
		} else {
			console.log('⚠️ Админ уже существует');
		}
	} catch (error) {
		console.error('❌ Ошибка при создании админа:', error);
	}
}

export default models