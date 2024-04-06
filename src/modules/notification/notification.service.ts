import { Service } from "typedi";

import Notification from "./notification.model";
import { Errors } from "../../helpers/handle-errors";
import { CreateNotificationDTO } from "./dtos/create-notification.dto";
import { GetNotificationsListDTO } from "./dtos/get-notification.dto";
import mongoose from "mongoose";
import { CreateNotificationInspectorDTO } from "./dtos/create-notification-inspector.dto";
import { GetNotificationsInspectorDTO } from "./dtos/get-notificaion-inspector.dto";

@Service()
export class NotificationService {
  public createNotification = async (
    data: CreateNotificationDTO | CreateNotificationInspectorDTO
  ) => {
    const newNotification = Notification.create(data);
    if (!newNotification) throw Errors.SaveToDatabaseFail;
    return newNotification;
  };

  public getNotificationsList = async (userId: string) => {
    const countNewNotifications = await Notification.countDocuments({
      $and: [{ _uId: userId }, { _read: false }],
    });

    const notifications = await Notification.find({
      _uId: userId,
    });

    const result = {
      notifications: GetNotificationsListDTO.toResponse(notifications),
      totalNewNotification: countNewNotifications,
    };

    return result;
  };

  public getNotificationById = async (notificationId: string) => {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
      },
      {
        _read: true,
      }
    );
    if (!notification) throw Errors.NotificationNotFound;

    return notification._postId;
  };

  public getNotificationsInspector = async () => {
    const countNewNotifications = await Notification.countDocuments({
      $and: [{ _type: "ACTIVE_HOST" }, { _read: false }],
    });

    const notifications = await Notification.find({ _type: "ACTIVE_HOST" });

    const result = {
      notifications: GetNotificationsInspectorDTO.toResponse(notifications),
      totalNewNotification: countNewNotifications,
    };

    return result;
  };
}
