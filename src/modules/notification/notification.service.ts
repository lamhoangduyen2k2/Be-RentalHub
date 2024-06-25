import { Service } from "typedi";

import Notification from "./notification.model";
import { Errors } from "../../helpers/handle-errors";
import { CreateNotificationDTO } from "./dtos/create-notification.dto";
import { GetNotificationsListDTO } from "./dtos/get-notification.dto";
import mongoose, { ClientSession } from "mongoose";
import { CreateNotificationInspectorDTO } from "./dtos/create-notification-inspector.dto";
import { GetNotificationsInspectorDTO } from "./dtos/get-notificaion-inspector.dto";
import { CreateNotificationRegisterAddressDTO } from "./dtos/create-notification-register-address.dto";
import { PaginationNotification } from "../../helpers/response";
import { CreateNotificationCommentDTO } from "./dtos/create-notification-comment.dto";

@Service()
export class NotificationService {
  public createNotification = async (
    data:
      | CreateNotificationDTO
      | CreateNotificationInspectorDTO
      | CreateNotificationRegisterAddressDTO
      | CreateNotificationCommentDTO,
    session: ClientSession
  ) => {
    const newNotification = await Notification.create([data], { session });
    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    return newNotification;
  };

  public getNotificationsUnreadedList = async (
    userId: string,
    pagination: PaginationNotification
  ) => {
    const countNewNotifications = await Notification.countDocuments({
      $and: [
        { _uId: userId },
        { _read: false },
        {
          _type: {
            $nin: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
      ],
    });

    if (!pagination.limit) {
      pagination.limit = countNewNotifications;
      pagination.page = 1;
    }

    const totalPage = Math.ceil(countNewNotifications / pagination.limit);
    if (pagination.page > totalPage) throw Errors.PageNotFound;

    const notifications = await Notification.find({
      $and: [
        { _uId: userId },
        { _read: false },
        {
          _type: {
            $nin: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
      ],
    })
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (notifications.length <= 0) throw Errors.NotificationNotFound;

    const result = {
      notifications: GetNotificationsListDTO.toResponse(notifications),
      totalNewNotification: countNewNotifications,
    };

    return [
      result,
      { limit: pagination.limit, page: pagination.page, total: totalPage },
    ];
  };

  public getNotificationsReadedList = async (
    userId: string,
    pagination: PaginationNotification
  ) => {
    const countNewNotifications = await Notification.countDocuments({
      $and: [
        { _uId: userId },
        { _read: true },
        {
          _type: {
            $nin: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
      ],
    });

    if (!pagination.limit) {
      pagination.limit = countNewNotifications;
      pagination.page = 1;
    }

    const totalPage = Math.ceil(countNewNotifications / pagination.limit);
    if (pagination.page > totalPage) throw Errors.PageNotFound;

    const notifications = await Notification.find({
      $and: [
        { _uId: userId },
        { _read: true },
        {
          _type: {
            $nin: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
      ],
    })
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (notifications.length <= 0) throw Errors.NotificationNotFound;

    return [
      GetNotificationsListDTO.toResponse(notifications),
      { limit: pagination.limit, page: pagination.page, total: totalPage },
    ];
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

  public getNotificationsUnreadedInspector = async (pagination: PaginationNotification) => {
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
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
        { _read: false },
      ],
    });

    if (!pagination.limit) {
      pagination.limit = countNewNotifications;
      pagination.page = 1;
    }

    const totalPage = Math.ceil(countNewNotifications / pagination.limit);
    if (pagination.page > totalPage) throw Errors.PageNotFound;

    const notifications = await Notification.find({
      $and: [
        {
          _type: {
            $in: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
        { _read: false },
      ],
    })
      .skip(pagination.offset)
      .limit(pagination.limit);

    const result = {
      notifications: GetNotificationsInspectorDTO.toResponse(notifications),
      totalNewNotification: countNewNotifications,
    };

    return [
      result,
      { limit: pagination.limit, page: pagination.page, total: totalPage },
    ];
  };

  public getNotificationsReadedInspector = async (pagination: PaginationNotification) => {
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
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
        { _read: true },
      ],
    });

    if (!pagination.limit) {
      pagination.limit = countNewNotifications;
      pagination.page = 1;
    }

    const totalPage = Math.ceil(countNewNotifications / pagination.limit);
    if (pagination.page > totalPage) throw Errors.PageNotFound;

    const notifications = await Notification.find({
      $and: [
        {
          _type: {
            $in: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
        { _read: true },
      ],
    })
      .skip(pagination.offset)
      .limit(pagination.limit);

    return [
      GetNotificationsInspectorDTO.toResponse(notifications),
      { limit: pagination.limit, page: pagination.page, total: totalPage },
    ];
  };

  public readAllNotifications = async (userId: string) => {
    const unreadNotifications = await Notification.find({
      $and: [
        { _uId: userId },
        { _read: false },
        {
          _type: {
            $nin: [
              "ACTIVE_HOST",
              "REGISTER_ADDRESS",
              "CREATE_POST",
              "NEW_REPORT_POST",
              "UPDATE_ADDRESS",
              "NEW_REPORT_SOCIAL_POST",
            ],
          },
        },
      ],
    });

    unreadNotifications.forEach(async (notification) => {
      await Notification.findByIdAndUpdate(notification._id, { _read: true });
    });

    return true;
  };
}
