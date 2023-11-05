import { Expose, plainToClass } from "class-transformer";
import { IsArray, IsNotEmpty, IsString } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class PostCreateDTO {
  @Expose()
  @IsNotEmpty()
  _uId: ObjectId;

  @Expose()
  @IsNotEmpty()
  @IsString()
  _title: string;

  @Expose()
  @IsArray()
  _images: string[];

  @Expose()
  @IsNotEmpty()
  @IsString()
  _content: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  _desc: string;

  @Expose()
  @IsArray()
  _tags: ObjectId[]

  @Expose()
  @IsNotEmpty()
  @IsArray()
  _address: string

  @Expose()
  _services: string[]

  @Expose()
  _utilities: string[]

  @Expose()
  @IsNotEmpty()
  @IsString()
  _area: number

  @Expose()
  @IsNotEmpty()
  _price: number

  @Expose()
  @IsNotEmpty()
  _electricPrice: number

  @Expose()
  @IsNotEmpty()
  _waterPrice: number

  static fromRequest = (req: Request) => {
    return plainToClass(PostCreateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
