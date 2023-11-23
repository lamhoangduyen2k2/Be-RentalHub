import { Expose, Transform, plainToClass } from "class-transformer";
import { ObjectId } from "mongoose";

export class TagResponseDTO {
  @Expose()
  @Transform((value) => value.obj._id.toString())
  _id: ObjectId;

  @Expose()
  _tag: string;

  @Expose()
  _type: string;

  static toResponse = (data: unknown) => {
    return plainToClass(TagResponseDTO, data, {
      excludeExtraneousValues: true,
    });
  };
}
