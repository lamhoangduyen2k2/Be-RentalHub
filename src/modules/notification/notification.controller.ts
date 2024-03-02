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
}
