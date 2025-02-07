import jwt from 'jsonwebtoken'
import ApiError from '../error/ApiError.js';

const checkRole = (role) => {
	return function (req, res, next) {

		if (req.method === "OPTIONS") {
			next()
		}

		try {
			const token = req.headers.authorization.split(' ')[1] // Bearer asfasnfkajsfnjk
			if (!token) {
				return res.status(401).json({ message: "Нет токена" })
			}
			const decoded = jwt.verify(token, process.env.JWT_SECRET)
			if (decoded.role !== role) {
				return next(ApiError.forbidden('Нет доступа'))
			}
			req.user = decoded;
			next()
		} catch (e) {
			next(e);
		}
	};
}

export default checkRole