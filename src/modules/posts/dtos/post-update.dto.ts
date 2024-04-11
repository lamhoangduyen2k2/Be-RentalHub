import { Exclude, Expose, plainToClass } from "class-transformer";
import {
  IsArray,
  IsBooleanString,
  IsNumberString,
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
  @IsString()
  _deleteImages: string;

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
  _tags: string[];

  @Exclude()
  _inspectId: ObjectId;

  @Exclude()
  _status: number;

  @Exclude()
  _active: boolean;

  @Exclude()
  _rooms: ObjectId;

  @ValidateIf((o: PostUpdateDTO) => o._street !== undefined)
  @Expose()
  @IsString()
  _street: string;

  @ValidateIf((o: PostUpdateDTO) => o._district !== undefined)
  @Expose()
  @IsString()
  _district: string;

  @ValidateIf((o: PostUpdateDTO) => o._city !== undefined)
  @Expose()
  @IsString()
  _city: string;

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
  @IsNumberString()
  _area: number;

  @ValidateIf((o: PostUpdateDTO) => o._desc !== undefined)
  @Expose()
  @IsNumberString()
  _price: number;

  @ValidateIf((o: PostUpdateDTO) => o._electricPrice !== undefined)
  @Expose()
  @IsNumberString()
  _electricPrice: number;

  @ValidateIf((o: PostUpdateDTO) => o._waterPrice !== undefined)
  @Expose()
  @IsNumberString()
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
