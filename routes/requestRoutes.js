import { Router } from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import requestController from '../controllers/requestController.js'
import multer from 'multer'
import checkRole from '../middleware/checkRoleMiddleware.js'

const router = new Router()
const upload = multer({ dest: 'uploads/' });

router.post('/create', authMiddleware, requestController.createRequest)
router.post('/createvip', authMiddleware, requestController.createVipRequest)
router.post('/update', authMiddleware, requestController.updateAttempts)
router.get('/get/:id', authMiddleware, requestController.getRequest)
router.get('/get', authMiddleware, requestController.getRequests)
router.get('/getby/:userid', checkRole('ADMIN'), authMiddleware, requestController.getRequestsByUserId)
router.delete('/delete/:id', checkRole('ADMIN'), authMiddleware, requestController.deleteRequestById)
router.delete('/delete', checkRole('ADMIN'), authMiddleware, requestController.deleteRequestsByUserId)

router.post('/send', authMiddleware, upload.array('files'), requestController.createMessage)
router.get('/messages/:requestId', authMiddleware, requestController.getMessages)
router.get('/message/:requestId', authMiddleware, requestController.getFirstMessage)

export default router