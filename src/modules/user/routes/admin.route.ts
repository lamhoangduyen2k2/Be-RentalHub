import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../../auth/auth.middleware";
import { AuthController } from "../../auth/auth.controller";
import { UserController } from "../user.controller";
import { UserMiddleWare } from "../user.middleware";

const adminRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const authController = Container.get(AuthController);
const userController = Container.get(UserController);
const userMiddleWare = Container.get(UserMiddleWare);

//GET API
adminRoute.get(
  "/get-users-list",
  authMiddleware.authorizedAdmin,
  userController.getUserList
);
adminRoute.get(
  "/get-inspectors-list",
  authMiddleware.authorizedAdmin,
  userController.getInspectorList
);
adminRoute.get(
  "/get-inspector-by-id",
  authMiddleware.authorizedAdmin,
  userController.getInspectorById
);

//POST API
adminRoute.post(
  "/login-admin",
  authMiddleware.checkValidation,
  authController.loginAdminController
);
adminRoute.post(
  "/create-inspector",
  authMiddleware.authorizedAdmin,
  userMiddleWare.checkValidationCreateUser,
  userController.createInspector
);

adminRoute.post(
  "/block-inspector",
  authMiddleware.authorizedAdmin,
  userController.blockInspector
);

//PATCH API
adminRoute.patch(
  "/update-inspector-pass",
  authMiddleware.authorizedAdmin,
  userMiddleWare.checkValidationUpdatePassInspector,
  userController.updateInspectorPass
);

export default adminRoute;
