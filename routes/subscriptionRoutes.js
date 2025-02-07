import { Router } from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import subscriptionController from '../controllers/subscriptionController.js'

const router = new Router()

router.get('/get', authMiddleware, subscriptionController.getByUserId)

export default router
