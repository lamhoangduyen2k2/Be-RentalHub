import { Service } from "typedi";
import { CreateNotificationDTO } from "./create-notification.dto";
import Notification from "./notification.model";
import { Errors } from "../../helpers/handle-errors";

@Service()
export class NotificationService {
  public createNotification = async (data: CreateNotificationDTO) => {
    const newNotification = Notification.create(data);
    if (!newNotification) throw Errors.SaveToDatabaseFail;
    return newNotification;
  };
}
