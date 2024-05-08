import { Inject, Service } from "typedi";
import { NotificationService } from "./notification.service";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";

@Service()
export class NotificationController {
  constructor(@Inject() private notificationService: NotificationService) {}

  public getNotificationsList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notifications = await this.notificationService.getNotificationsList(
        req.body._uId
      );

      res.json(new ResponseData(notifications, null, null));
    } catch (error) {
      console.log("🚀 ~ NotificationController ~ error:", error);
      next(error);
    }
  };

  public getNotificationsInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notifications = await this.notificationService.getNotificationsInspector();

      res.json(new ResponseData(notifications, null, null));
    } catch (error) {
      console.log("🚀 ~ NotificationController ~ error:", error);
      next(error);
    }
  }

  public getNotificationById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notiId = req.query.notiId.toString();
      const notification = await this.notificationService.getNotificationById(notiId);

      res.json(new ResponseData(notification, null, null));
    } catch (error) {
      console.log("🚀 ~ NotificationController ~ error:", error)
      next(error)
    }
  }

  public readNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notification = await this.notificationService.readAllNotifications(req.body._uId);
      res.json(new ResponseData(notification, null, null));
    } catch (error) {
      console.log("🚀 ~ NotificationController ~ error:", error)
      next(error)
    }
  }
}
