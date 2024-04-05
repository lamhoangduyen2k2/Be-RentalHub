/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { NextFunction, Request, Response } from "express";
import { AuthenMiddWare } from "../../auth/auth.middleware";
import { AuthController } from "../../auth/auth.controller";
import Container from "typedi";
import { UserMiddleWare } from "../user.middleware";
import { UserController } from "../user.controller";
import { ImageMiddleWare } from "../../image/image.middleware";

const routerUser = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const authController = Container.get(AuthController);
const userMiddleWare = Container.get(UserMiddleWare);
const userController = Container.get(UserController);
const imageMiddleWare = Container.get(ImageMiddleWare);

//Authentication API
routerUser.post(
  "/accounts/login",
  authMiddleware.checkValidation,
  authController.loginController
);
routerUser.post(
  "/accounts/logout",
  authMiddleware.checkResetToken,
  authController.logoutController
);
routerUser.post(
  "/accounts/reset-token",
  authMiddleware.checkResetToken,
  authController.resetTokenController
);
routerUser.post(
  "/accounts/registor",
  userMiddleWare.checkValidationCreateUser,
  userController.registor
);
routerUser.post(
  "/accounts/registor-user",
  userMiddleWare.checkValidationCreateUser,
  userController.registorUser
);
routerUser.post("/accounts/verify-user", userController.verifyUser);

//API for User
routerUser.post(
  "/accounts/active-host",
  authMiddleware.authorizedUser,
  userController.activeHost
);
routerUser.post(
  "/accounts/verify-host",
  authMiddleware.authorizedUser,
  userController.verifyHost
);
routerUser.post(
  "/verify-indentity",
  imageMiddleWare.upload.fields([{ name: "image_front", maxCount: 1 }, { name: "image_back", maxCount: 1 }]),
  authMiddleware.authorizedUser,
  userController.verifyIndentity
);
routerUser.post(
  "/accounts/reset-otp",
  authMiddleware.authorizedUser,
  userController.resetOtp
);
// routerUser.post(
//   "/accounts/forgot-pass",
//   userMiddleWare.checkValidationForgotPass,
//   userController.resetPassword
// );
// routerUser.get(
//   "/accounts/forgot-password",
//   (req: Request, res: Response, next: NextFunction) => {
//     res.render("forgot-password");
//   }
// );

routerUser.post(
  "/accounts/forgot-password",
  userMiddleWare.checkValidationForgotPass,
  userController.forgotPassword
);

// routerUser.get(
//   "/accounts/reset-password/:id/:token",
//   (req: Request, res: Response, next: NextFunction) => {
//     res.render("reset-password");
//   }
// );

routerUser.post(
  "/accounts/reset-password/:id/:token",
  userController.resetPassword
);
///////////////////////
routerUser.get(
  "/get-profile",
  authMiddleware.authorizedUser,
  userController.getUserById
);
routerUser.patch(
  "/update-profile",
  authMiddleware.authorized,
  userMiddleWare.checkValidationUpdateUser,
  userController.updateUserProfile
);
routerUser.patch(
  "/update-avatar",
  imageMiddleWare.upload.single("_avatar"),
  imageMiddleWare.checkUploadAvatar,
  authMiddleware.authorized,
  userController.updateUserAvatar
);
routerUser.patch(
  "/update-login-info",
  authMiddleware.authorized,
  userMiddleWare.checkValidationUpdateEmailOrPass,
  userController.updateEmailOrPass
);
routerUser.get(
  "/get-users-list",
  authMiddleware.authorizedAdmin,
  userController.getUserList
);
routerUser.get(
  "/get-inspectors-list",
  authMiddleware.authorizedAdmin,
  userController.getInspectorList
);

// routerUser.post(
//   "/send-sms",
//   userController.sendSMS
// );
// routerUser.post(
//   "/verify-sms",
//   userController.verifySMS
// );


export default routerUser;
