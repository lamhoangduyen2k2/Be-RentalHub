import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../../auth/auth.middleware";
import { AuthController } from "../../auth/auth.controller";

const adminRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const authController = Container.get(AuthController);

adminRoute.post(
  "/login-admin",
  authMiddleware.checkValidation,
  authController.loginAdminController
);

export default adminRoute;
