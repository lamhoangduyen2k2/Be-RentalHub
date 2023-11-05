import { Exclude, Expose, plainToClass } from "class-transformer";
import { IsArray, IsString } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class PostUpdateDTO {
  @Expose()
  _uId: ObjectId;

  @Expose()
  @IsString()
  _title: string;

  @Expose()
  @IsArray()
  _images: string[];

  @Expose()
  @IsString()
  _content: string;

  @Expose()
  @IsString()
  _desc: string;

  @Expose()
  @IsArray()
  _tags: ObjectId[];

  @Expose()
  _inspectId: ObjectId;

  @Expose()
  _status: number

  @Expose()
  _active: boolean

  @Exclude()
  _rooms: ObjectId

  @Expose()
  @IsArray()
  _address: string

  @Expose()
  _services: string[]

  @Expose()
  _utilities: string[]

  @Expose()
  _area: number

  @Expose()
  _price: number

  @Expose()
  _electricPrice: number

  @Expose()
  _waterPrice: number

  @Expose()
  _isRented: boolean
  static fromRequest = (req: Request) => {
    return plainToClass(PostUpdateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
