import { Expose, Transform, plainToClass } from "class-transformer";
import { ObjectId } from "mongoose";

export class PostResponseDTO {
  @Expose()
  @Transform((value) => value.obj._uId.toString())
  _uId: ObjectId;

  @Expose()
  @Transform((value) => value.obj._id.toString())
  _id: ObjectId;

  @Expose()
  _title: string;

  @Expose()
  _images: string[];

  @Expose()
  _content: string;

  @Expose()
  _desc: string;

  @Expose()
  _tags: ObjectId[];

  @Expose()
  _inspectId: ObjectId;

  @Expose()
  _status: number;

  @Expose()
  _active: boolean;

  @Expose()
  @Transform((value) => value.obj._rooms.toString())
  _rooms: ObjectId;

  @Expose()
  _street: string;

  @Expose()
  _district: string;

  @Expose()
  _city: string;

  @Expose()
  _services: string[];

  @Expose()
  _utilities: string[];

  @Expose()
  _area: number;

  @Expose()
  _price: number;

  @Expose()
  _electricPrice: number;

  @Expose()
  _waterPrice: number;

  @Expose()
  _isRented: boolean;
  static toResponse = (data: unknown) => {
    return plainToClass(PostResponseDTO, data, {
      excludeExtraneousValues: true,
    });
  };
}
