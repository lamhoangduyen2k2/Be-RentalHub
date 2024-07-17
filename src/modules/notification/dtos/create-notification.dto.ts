import { Exclude, Expose, Transform, plainToClass } from "class-transformer";
import mongoose from "mongoose";

export class CreateNotificationDTO {
  @Expose()
  @Transform((value) => value.obj._uId.toString())
  _uId: mongoose.Types.ObjectId;

  @Expose()
  @Transform((value) => value.obj._postId && value.obj._postId.toString())
  _postId: mongoose.Types.ObjectId | null;

  @Expose()
  _title: string;

  @Expose()
  _message: string;

  @Exclude()
  _read: boolean;

  @Expose()
  _type: string;

  static fromService(data: unknown) {
    return plainToClass(CreateNotificationDTO, data, {
      excludeExtraneousValues: true,
    });
  }
}
