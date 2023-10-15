import express from "express"
import { AuthenMiddWare } from "../auth/auth.middleware"
import { AuthController } from "../auth/auth.controller"
import Container from "typedi"

const routerUser = express.Router()
const authMiddleware = Container.get(AuthenMiddWare)
const authController = Container.get(AuthController)

routerUser.post("/accounts/login", authMiddleware.checkValidation,  authController.loginController)
routerUser.post("/accounts/reset-token", authMiddleware.checkResetToken,  authController.resetTokenController)

export default routerUser