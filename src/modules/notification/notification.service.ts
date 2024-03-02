import { Service } from "typedi";

import Notification from "./notification.model";
import { Errors } from "../../helpers/handle-errors";
import { CreateNotificationDTO } from "./dtos/create-notification.dto";
import { GetNotificationsListDTO } from "./dtos/get-notification.dto";

@Service()
export class NotificationService {
  public createNotification = async (data: CreateNotificationDTO) => {
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
}
