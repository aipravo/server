import { Router } from 'express'
import balanceController from '../controllers/balanceController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import checkRole from '../middleware/checkRoleMiddleware.js'

const router = new Router()

router.post('/set', authMiddleware, checkRole('ADMIN'), balanceController.setBalance)
router.post('/update', authMiddleware, balanceController.updateBalance)
router.get('/get', authMiddleware, balanceController.getBalance)

export default router
