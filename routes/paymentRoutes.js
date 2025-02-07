import { Router } from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import checkRole from '../middleware/checkRoleMiddleware.js'
import paymentController from '../controllers/paymentController.js'

const router = new Router()

router.get('/get-all/:userId', authMiddleware, checkRole('ADMIN'), paymentController.getPayments)
router.post('/create', authMiddleware, paymentController.addPayment)


export default router
