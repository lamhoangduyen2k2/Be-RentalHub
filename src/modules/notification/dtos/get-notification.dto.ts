import { Expose, Transform, plainToClass } from "class-transformer";
import mongoose from "mongoose";

export class GetNotificationsListDTO {
  @Expose()
  @Transform((value) => value.obj._uId.toString())
  _uId: mongoose.Types.ObjectId;

  @Expose()
  @Transform((value) => value.obj._postId.toString())
  _postId: mongoose.Types.ObjectId;

  @Expose()
  _title: string;

  @Expose()
  _message: string;

  @Expose()
  _read: boolean;

  @Expose()
  _type: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static toResponse(data: unknown) {
    return plainToClass(GetNotificationsListDTO, data, {
      excludeExtraneousValues: true,
    });
  }
}
