import { Router } from 'express'
import userRoutes from './userRoutes.js'
import paymentRoutes from './paymentRoutes.js'
import requestRoutes from './requestRoutes.js'
import tariffRoutes from './tariffRoutes.js'
import balanceRoutes from './balanceRoutes.js'
import subscriptionRoutes from './subscriptionRoutes.js'

const router = new Router()

router.use('/user', userRoutes)
router.use('/payment', paymentRoutes)
router.use('/request', requestRoutes)
router.use('/tariff', tariffRoutes)
router.use('/balance', balanceRoutes)
router.use('/subscription', subscriptionRoutes)

export default router