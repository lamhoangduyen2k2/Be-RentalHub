import { Exclude, Expose, plainToClass } from "class-transformer";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class PostSensorDTO {
  @Expose()
  _uId: ObjectId;

  @Exclude()
  _title: string;

  @Exclude()
  _images: string[];

  @Exclude()
  _content: string;

  @Exclude()
  _desc: string;

  @Exclude()
  _tags: ObjectId[];

  @Exclude()
  _inspectId: ObjectId;

  @Expose()
  _status: number;

  @Exclude()
  _active: boolean;

  @Exclude()
  _rooms: ObjectId;

  @Exclude()
  _address: string;

  @Exclude()
  _services: string;

  @Exclude()
  _utilities: string;

  @Exclude()
  _area: number;

  @Exclude()
  _price: number;

  @Exclude()
  _electricPrice: number;

  @Exclude()
  _waterPrice: number;

  @Exclude()
  _isRented: boolean;
  static fromRequest = (req: Request) => {
    return plainToClass(PostSensorDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
