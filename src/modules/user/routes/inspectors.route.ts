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

export default inspectorRoute;
