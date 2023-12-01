import { Exclude, Expose, plainToClass } from "class-transformer";
import {
  IsArray,
  IsBooleanString,
  IsNumber,
  IsString,
  ValidateIf,
} from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class PostUpdateDTO {
  @Expose()
  _uId: ObjectId;

  @ValidateIf((o: PostUpdateDTO) => o._title !== undefined)
  @Expose()
  @IsString()
  _title: string;

  @Expose()
  _images: string[];

  @ValidateIf((o: PostUpdateDTO) => o._content !== undefined)
  @Expose()
  @IsString()
  _content: string;

  @ValidateIf((o: PostUpdateDTO) => o._desc !== undefined)
  @Expose()
  @IsString()
  _desc: string;

  @ValidateIf((o: PostUpdateDTO) => o._tags !== undefined)
  @Expose()
  @IsArray()
  _tags: ObjectId[];

  @Exclude()
  _inspectId: ObjectId;

  @Exclude()
  _status: number;

  @Exclude()
  _active: boolean;

  @Exclude()
  _rooms: ObjectId;

  @ValidateIf((o: PostUpdateDTO) => o._address !== undefined)
  @Expose()
  @IsString()
  _address: string;

  @ValidateIf((o: PostUpdateDTO) => o._services !== undefined)
  @Expose()
  @IsString()
  _services: string;

  @ValidateIf((o: PostUpdateDTO) => o._utilities !== undefined)
  @Expose()
  @IsString()
  _utilities: string;

  @ValidateIf((o: PostUpdateDTO) => o._area !== undefined)
  @Expose()
  @IsNumber()
  _area: number;

  @ValidateIf((o: PostUpdateDTO) => o._desc !== undefined)
  @Expose()
  @IsNumber()
  _price: number;

  @ValidateIf((o: PostUpdateDTO) => o._electricPrice !== undefined)
  @Expose()
  @IsNumber()
  _electricPrice: number;

  @ValidateIf((o: PostUpdateDTO) => o._waterPrice !== undefined)
  @Expose()
  @IsNumber()
  _waterPrice: number;

  @ValidateIf((o: PostUpdateDTO) => o._isRented !== undefined)
  @Expose()
  @IsBooleanString()
  _isRented: string;
  static fromRequest = (req: Request) => {
    return plainToClass(PostUpdateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
