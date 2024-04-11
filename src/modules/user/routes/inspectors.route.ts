import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../../auth/auth.middleware";
import { AuthController } from "../../auth/auth.controller";
import { UserMiddleWare } from "../user.middleware";
import { UserController } from "../user.controller";
import { ImageMiddleWare } from "../../image/image.middleware";

const inspectorRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const authController = Container.get(AuthController);
const userMiddleWare = Container.get(UserMiddleWare);
const userController = Container.get(UserController);
const imageMiddleWare = Container.get(ImageMiddleWare);

inspectorRoute.post(
  "/login-inspector",
  authMiddleware.checkValidation,
  authController.loginInspectorController
);
inspectorRoute.get(
  "/get-profile",
  authMiddleware.authorizedInspector,
  userController.getInspectorById
);
inspectorRoute.patch(
  "/update-profile",
  authMiddleware.authorizedInspector,
  userMiddleWare.checkValidationUpdateUser,
  userController.updateInspectorProfile
);
inspectorRoute.patch(
  "/update-avatar",
  imageMiddleWare.upload.single("_avatar"),
  imageMiddleWare.checkUploadAvatar,
  authMiddleware.authorizedInspector,
  userController.updateInspectorAvatar
);
inspectorRoute.patch(
  "/update-password",
  authMiddleware.authorizedInspector,
  userMiddleWare.checkValidationUpdatePassowdInspector,
  userController.updateInspectorPassword
);
inspectorRoute.post(
  "/forgot-password",
  userMiddleWare.checkValidationForgotPass,
  userController.forgotPassword
);
inspectorRoute.post(
  "/reset-password/:id/:token",
  userController.resetPassword
);
inspectorRoute.get(
  "/get-active-host",
  authMiddleware.authorizedInspector,
  userController.getActiveHostInspector
);
inspectorRoute.get(
  "/get-active-host-by-id",
  authMiddleware.authorizedInspector,
  userController.getActiveHostByIdInspector
);
inspectorRoute.patch(
  "/sensor-active-host",
  authMiddleware.authorizedInspector,
  userMiddleWare.checkValidationSensor,
  userController.sensorActiveHostRequest
);
inspectorRoute.get(
  "/get-register-address",
  authMiddleware.authorizedInspector,
  userController.getAddressRequestsByStatusInspector
);
inspectorRoute.get(
  "/get-register-address-by-id",
  authMiddleware.authorizedInspector,
  userController.getAddressRequestByIdInspector
);
inspectorRoute.patch(
  "/sensor-register-address",
  authMiddleware.authorizedInspector,
  userMiddleWare.checkValidationSensor,
  userController.sensorAddressRequestInspector
);

export default inspectorRoute;
