import dotenv from 'dotenv';
import express from 'express';
import path from 'path'
import { fileURLToPath } from 'url';
import cors from 'cors';
import sequelize from './db.js';
import router from './routes/index.js';
import errorHandler from './middleware/errorMiddleware.js';
import './cleaner.js'
import './checkSubscriptions.js'
import { createAdminUser } from './models/models.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api', router);

app.use('/processed', express.static(path.join(__dirname, 'processed')))

app.use(errorHandler)

const start = async () => {
	try {

		await sequelize.authenticate();

		await sequelize.sync();

		await createAdminUser();

		app.listen(process.env.SERVER_PORT || 5000, () => {
			console.log(`Server starting on port ${process.env.SERVER_PORT || 5000}`);
		});

	} catch (e) {
		console.error('Error starting server:', e);
	}
};

start();
