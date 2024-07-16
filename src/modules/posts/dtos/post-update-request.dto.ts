import { Exclude, Expose, plainToClass } from "class-transformer";
import { IsArray, IsBooleanString, IsNumberString, IsString, ValidateIf } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class PostRequestUpdateDTO {
    @Expose()
    _uId: ObjectId;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._title !== undefined)
    @Expose()
    @IsString()
    _title: string;
  
    @Expose()
    @IsString()
    _deleteImages: string;
  
    @Expose()
    _images: string[];
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._content !== undefined)
    @Expose()
    @IsString()
    _content: string;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._desc !== undefined)
    @Expose()
    @IsString()
    _desc: string;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._tags !== undefined)
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
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._address !== undefined)
    @Expose()
    @IsString()
    _address: string;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._services !== undefined)
    @Expose()
    @IsString()
    _services: string;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._utilities !== undefined)
    @Expose()
    @IsString()
    _utilities: string;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._area !== undefined)
    @Expose()
    @IsNumberString()
    _area: number;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._desc !== undefined)
    @Expose()
    @IsNumberString()
    _price: number;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._electricPrice !== undefined)
    @Expose()
    @IsNumberString()
    _electricPrice: number;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._waterPrice !== undefined)
    @Expose()
    @IsNumberString()
    _waterPrice: number;
  
    @ValidateIf((o: PostRequestUpdateDTO) => o._isRented !== undefined)
    @Expose()
    @IsBooleanString()
    _isRented: string;
    static fromRequest = (req: Request) => {
      return plainToClass(PostRequestUpdateDTO, req.body, {
        excludeExtraneousValues: true,
      });
    };
  }