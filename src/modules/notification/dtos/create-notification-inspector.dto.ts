import { Exclude, Expose, Transform, plainToClass } from "class-transformer";
import mongoose from "mongoose";

export class CreateNotificationInspectorDTO {
  @Expose()
  @Transform((value) => value.obj._uId.toString())
  _uId: mongoose.Types.ObjectId;

  @Expose()
  _title: string;

  @Expose()
  _message: string;

  @Expose()
  _address: string;
  
  @Exclude()
  _read: boolean;

  @Expose()
  _type: string;

  static fromService(data: unknown) {
    return plainToClass(CreateNotificationInspectorDTO, data, {
      excludeExtraneousValues: true,
    });
  }
}
