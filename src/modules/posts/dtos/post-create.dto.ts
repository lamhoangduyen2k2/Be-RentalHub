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
  @IsString()
  @IsNotEmpty()
  _title: string;

  @Expose()
  _images: string[];

  @Expose()
  @IsString()
  @IsNotEmpty()
  _content: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  _desc: string;

  @ValidateIf((o: PostCreateDTO) => o._tags !== undefined)
  @Expose()
  @IsArray()
  _tags: string[];

  // @Expose()
  // @IsString()
  // @IsNotEmpty()
  // _street: string;

  // @Expose()
  // @IsString()
  // @IsNotEmpty()
  // _district: string;

  // @ValidateIf((o: PostCreateDTO) => o._city !== undefined)
  // @Expose()
  // @IsString()
  // _city: string;

  @ValidateIf((o: PostCreateDTO) => o._address !== undefined)
  @Expose()
  @IsString()
  _address: string;

  @ValidateIf((o: PostCreateDTO) => o._services !== undefined)
  @Expose()
  @IsString()
  _services: string;

  @ValidateIf((o: PostCreateDTO) => o._utilities !== undefined)
  @Expose()
  @IsString()
  _utilities: string;

  @Expose()
  @IsNumberString()
  @IsNotEmpty()
  _area: number;

  @Expose()
  @IsNumberString()
  @IsNotEmpty()
  _price: number;

  @Expose()
  @IsNumberString()
  @IsNotEmpty()
  _electricPrice: number;

  @Expose()
  @IsNumberString()
  @IsNotEmpty()
  _waterPrice: number;

  static fromRequest = (req: Request) => {
    return plainToClass(PostCreateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
