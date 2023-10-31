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

  static fromRequest = (req: Request) => {
    return plainToClass(PostCreateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
