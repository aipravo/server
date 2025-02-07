import { Router } from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import checkRole from '../middleware/checkRoleMiddleware.js'
import tariffController from '../controllers/tariffController.js'

const router = new Router()

router.post('/create', authMiddleware, checkRole('ADMIN'), tariffController.create)
router.get('/get', authMiddleware, tariffController.getAll)
router.delete('/delete/:id', authMiddleware, tariffController.deleteTariffById)

export default router