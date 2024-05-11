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
  notifiController.getNotificationsUnreadedList
);
notifiRoute.get(
  "/get-notifi-inspector",
  authMiddleware.authorizedInspector,
  notifiController.getNotificationsInspector
);
notifiRoute.get(
  "/read-notification-id",
  authMiddleware.authorized,
  notifiController.getNotificationById
);
notifiRoute.get(
  "/read-all-notification",
  authMiddleware.authorized,
  notifiController.readNotification
);
export default notifiRoute;
