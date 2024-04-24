import { Service } from "typedi";

import Notification from "./notification.model";
import { Errors } from "../../helpers/handle-errors";
import { CreateNotificationDTO } from "./dtos/create-notification.dto";
import { GetNotificationsListDTO } from "./dtos/get-notification.dto";
import mongoose from "mongoose";
import { CreateNotificationInspectorDTO } from "./dtos/create-notification-inspector.dto";
import { GetNotificationsInspectorDTO } from "./dtos/get-notificaion-inspector.dto";
import { CreateNotificationRegisterAddressDTO } from "./dtos/create-notification-register-address.dto";

@Service()
export class NotificationService {
  public createNotification = async (
    data:
      | CreateNotificationDTO
      | CreateNotificationInspectorDTO
      | CreateNotificationRegisterAddressDTO
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
      $and: [
        { _uId: userId },
        {
          _type: {
            $nin: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
            ],
          },
        },
      
      ],
    }).sort({ _read: 1 });

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
      },
      { new: true }
    );
    if (!notification) throw Errors.NotificationNotFound;

    const resultId = notification._postId
      ? notification._postId
      : notification._uId;

    return resultId;
  };

  public getNotificationsInspector = async () => {
    const countNewNotifications = await Notification.countDocuments({
      $and: [
        {
          _type: {
            $in: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
            ],
          },
        },
        { _read: false },
      ],
    });

    const notifications = await Notification.find({
      _type: { $in: ["ACTIVE_HOST", "REGISTER_ADDRESS", "CREATE_POST"] },
    });

    const result = {
      notifications: GetNotificationsInspectorDTO.toResponse(notifications),
      totalNewNotification: countNewNotifications,
    };

    return result;
  };
}
