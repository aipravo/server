import { Router } from 'express'
import userControllers from '../controllers/userControllers.js'
import authMiddleware from '../middleware/authMiddleware.js'
import checkRole from '../middleware/checkRoleMiddleware.js'

const router = new Router()

router.post('/registration', userControllers.registration)
router.post('/login', userControllers.login)
router.get('/confirm/:token', userControllers.confirm)
router.get('/auth', authMiddleware, userControllers.check)
router.post('/reset', userControllers.reset)
router.post('/set-new-pass', userControllers.setNewPassword)

router.post('/change-pass', authMiddleware, userControllers.changePassword)
router.post('/change-admin-pass', authMiddleware, checkRole('ADMIN'), userControllers.changeAdminPassword)
router.post('/create-admin', authMiddleware, checkRole('ADMIN'), userControllers.createAdmin)
router.post('/update', authMiddleware, checkRole('ADMIN'), userControllers.updateUser)
router.delete('/remove-user/:id', authMiddleware, checkRole('ADMIN'), userControllers.removeUser)
router.get('/get-all', authMiddleware, checkRole('ADMIN'), userControllers.getUsers)
router.get('/get-all-info', authMiddleware, checkRole('ADMIN'), userControllers.getUsersInfo)
router.get('/get/:id', authMiddleware, checkRole('ADMIN'), userControllers.getUser)
router.get('/get-admins', authMiddleware, checkRole('ADMIN'), userControllers.getAdmins)

export default router
