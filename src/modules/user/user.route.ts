import express from "express"
import { AuthenMiddWare } from "../auth/auth.middleware"
import { AuthController } from "../auth/auth.controller"
import Container from "typedi"
import { UserMiddleWare } from "./user.middleware"
import { UserController } from "./user.controller"

const routerUser = express.Router()
const authMiddleware = Container.get(AuthenMiddWare)
const authController = Container.get(AuthController)
const userMiddleWare = Container.get(UserMiddleWare)
const userController = Container.get(UserController)

//Authentication API
routerUser.post("/accounts/login", authMiddleware.checkValidation,  authController.loginController)
routerUser.post("/accounts/logout", authMiddleware.checkResetToken,  authController.logoutController)
routerUser.post("/accounts/reset-token", authMiddleware.checkResetToken,  authController.resetTokenController)
routerUser.post("/accounts/registor", userMiddleWare.checkValidationCreateUser,  userController.registor)

//API for User
routerUser.post("/accounts/active-host", authMiddleware.authorizedUser, userController.activeHost)
routerUser.post("/accounts/verify-host", authMiddleware.authorizedUser, userController.verifyHost)
routerUser.post("/accounts/reset-otp", authMiddleware.authorizedUser, userController.resetOtp)

///////////////////////
routerUser.get("/get-profile/:uId", authMiddleware.authorizedUser, userController.getUserById)

export default routerUser