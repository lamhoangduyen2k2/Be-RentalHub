import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../../auth/auth.middleware";
import { AuthController } from "../../auth/auth.controller";

const inspectorRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const authController = Container.get(AuthController);

inspectorRoute.post(
  "/login-inspector",
  authMiddleware.checkValidation,
  authController.loginInspectorController
);

export default inspectorRoute;
