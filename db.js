import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
	process.env.DB_NAME, // Название БД
	process.env.DB_USER, // Пользователь
	process.env.DB_PASSWORD, // ПАРОЛЬ
	{
		dialect: 'postgres',
		host: process.env.DB_HOST, // Хост
		port: process.env.DB_PORT, // Порт
	}
);



export default sequelize;