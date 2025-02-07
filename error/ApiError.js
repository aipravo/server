class ApiError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}

	static badRequest(message) {
		return new ApiError(400, message);
	}

	static unauthorized(message = 'Не авторизован') {
		return new ApiError(401, message);
	}

	static forbidden(message = 'Доступ запрещен') {
		return new ApiError(403, message);
	}

	static notFound(message = 'Ресурс не найден') {
		return new ApiError(404, message);
	}
}

export default ApiError;
