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
  "/get-noti-readed",
  authMiddleware.authorizedUser,
  notifiController.getNotificationsReadedList
);
notifiRoute.get(
  "/get-notifi-unreaded-inspector",
  authMiddleware.authorizedInspector,
  notifiController.getNotificationsUnreadedInspector
);
notifiRoute.get(
  "/get-notifi-readed-inspector",
  authMiddleware.authorizedInspector,
  notifiController.getNotificationsReadedInspector
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
