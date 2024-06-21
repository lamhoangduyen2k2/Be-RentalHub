import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class UpdateSocialPostDTO {
    @Expose()
    @IsNotEmpty()
    _id: string;

    @ValidateIf((o: UpdateSocialPostDTO) => o._title !== undefined)
    @Expose()
    @IsString()
    _title: string;
  
    @ValidateIf((o: UpdateSocialPostDTO) => o._content !== undefined)
    @Expose()
    @IsString()
    _content: string;

    @Expose()
    _images: string;
  
    @Expose()
    @IsNotEmpty()
    _uId: ObjectId;
  
    static getFromReuqest = (req: Request) => {
      return plainToClass(UpdateSocialPostDTO, req.body, {
        excludeExtraneousValues: true,
      });
    };
  }