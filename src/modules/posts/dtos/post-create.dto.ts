import { Expose, plainToClass } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsString,
  ValidateIf,
} from "class-validator";
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
  _images: string[];

  @Expose()
  @IsNotEmpty()
  @IsString()
  _content: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  _desc: string;

  @ValidateIf((o: PostCreateDTO) => o._tags !== undefined)
  @Expose()
  @IsArray()
  _tags: ObjectId[];

  @Expose()
  @IsNotEmpty()
  @IsString()
  _street: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  _district: string;

  @ValidateIf((o: PostCreateDTO) => o._city !== undefined)
  @Expose()
  @IsString()
  _city: string;

  @ValidateIf((o: PostCreateDTO) => o._services !== undefined)
  @Expose()
  @IsString()
  _services: string;

  @ValidateIf((o: PostCreateDTO) => o._utilities !== undefined)
  @Expose()
  @IsString()
  _utilities: string;

  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  _area: number;

  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  _price: number;

  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  _electricPrice: number;

  @Expose()
  @IsNotEmpty()
  @IsNumberString()
  _waterPrice: number;

  static fromRequest = (req: Request) => {
    return plainToClass(PostCreateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
