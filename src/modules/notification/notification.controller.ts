import { Inject, Service } from "typedi";
import { NotificationService } from "./notification.service";
import { NextFunction, Request, Response } from "express";
import { Pagination, ResponseData } from "../../helpers/response";

@Service()
export class NotificationController {
  constructor(@Inject() private notificationService: NotificationService) {}

  public getNotificationsUnreadedList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const notifications = await this.notificationService.getNotificationsUnreadedList(
        req.body._uId,
        pagination
      );

      res.json(new ResponseData(notifications[0], null, notifications[1]));
    } catch (error) {
      console.log("🚀 ~ NotificationController ~ error:", error);
      next(error);
    }
  };

  public getNotificationsReadedList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const notifications = await this.notificationService.getNotificationsReadedList(
        req.body._uId,
        pagination
      );

      res.json(new ResponseData(notifications[0], null, notifications[1]));
    } catch (error) {
      console.log("🚀 ~ NotificationController ~ error:", error);
      next(error);
    }
  };

  public getNotificationsUnreadedInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const notifications = await this.notificationService.getNotificationsUnreadedInspector(pagination);

      res.json(new ResponseData(notifications[0], null, notifications[1]));
    } catch (error) {
      console.log("🚀 ~ NotificationController ~ error:", error);
      next(error);
    }
  }

  public getNotificationsReadedInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const notifications = await this.notificationService.getNotificationsReadedInspector(pagination);

      res.json(new ResponseData(notifications[0], null, notifications[1]));
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

      res.json(new ResponseData(notification && notiId, null, null));
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
