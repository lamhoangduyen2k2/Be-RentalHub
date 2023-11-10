import { Expose, plainToClass } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, ValidateIf } from "class-validator";
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

  @ValidateIf((o : PostCreateDTO) => o._images !== undefined)
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
  _district: ObjectId;

  @ValidateIf((o: PostCreateDTO) => o._city !== undefined)
  @Expose()
  @IsString()
  _city: string;

  // @Expose()
  // @IsNotEmpty()
  // @IsArray()
  // _address: string

  @ValidateIf((o: PostCreateDTO) => o._services !== undefined)
  @Expose()
  _services: string[];

  @ValidateIf((o: PostCreateDTO) => o._utilities !== undefined)
  @Expose()
  _utilities: string[];

  @Expose()
  @IsNotEmpty()
  @IsString()
  _area: number;

  @Expose()
  @IsNotEmpty()
  _price: number;

  @Expose()
  @IsNotEmpty()
  _electricPrice: number;

  @Expose()
  @IsNotEmpty()
  _waterPrice: number;

  static fromRequest = (req: Request) => {
    return plainToClass(PostCreateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
