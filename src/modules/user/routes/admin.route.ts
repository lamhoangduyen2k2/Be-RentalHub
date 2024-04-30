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
  userController.getInspectorByIdAdmin
);

adminRoute.get(
  "/get-active-host",
  authMiddleware.authorizedAdmin,
  userController.getActiveHostInspector
);

adminRoute.get(
  "/get-active-host-by-id",
  authMiddleware.authorizedAdmin,
  userController.getActiveHostByIdInspector
);

adminRoute.get(
  "/get-register-address",
  authMiddleware.authorizedAdmin,
  userController.getAddressRequestsByStatusInspector
);

adminRoute.get(
  "/get-register-address-by-id",
  authMiddleware.authorizedAdmin,
  userController.getAddressRequestByIdInspector
);

adminRoute.get(
  "/get-user-keyword",
  authMiddleware.authorizedAdmin,
  userController.getUserByEmailOrId
);

adminRoute.get(
  "/get-user-blocked-keyword",
  authMiddleware.authorizedAdmin,
  userController.getUserBlockedByEmailOrId
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

adminRoute.patch(
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

adminRoute.patch(
  "/sensor-active-host",
  authMiddleware.authorizedAdmin,
  userMiddleWare.checkValidationSensor,
  userController.sensorActiveHostRequestAdmin
);

adminRoute.patch(
  "/sensor-register-address",
  authMiddleware.authorizedAdmin,
  userMiddleWare.checkValidationSensor,
  userController.sensorAddressRequestAdmin
);

export default adminRoute;
