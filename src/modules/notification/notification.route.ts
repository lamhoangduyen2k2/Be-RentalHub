import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { NotificationController } from "./notification.controller";

const notifiRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare);
const notifiController = Container.get(NotificationController);

notifiRoute.get(
  "/",
  authMiddleware.authorizedUser,
  notifiController.getNotificationsList
);

export default notifiRoute;
