import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
	if (req.method === 'OPTIONS') {
		return next();
	}

	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ message: 'Не авторизован' });
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		req.user = decoded

		next();
	} catch (error) {
		console.error('Ошибка авторизации:', error.message);
		res.status(401).json({ message: 'Не авторизован' });
	}
};


export default authMiddleware;
