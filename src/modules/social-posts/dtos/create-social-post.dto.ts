import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class CreateSocialPostDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  _title: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  _content: string;

  @Expose()
  _images: string[];

  @Expose()
  @IsNotEmpty()
  _uId: ObjectId;

  static getFromReuqest = (req: Request) => {
    return plainToClass(CreateSocialPostDto, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
