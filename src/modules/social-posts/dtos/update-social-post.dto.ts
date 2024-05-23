import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class UpdateSocialPostDTO {
    @Expose()
    @IsNotEmpty()
    _id: string;

    @Expose()
    @IsString()
    _title: string;
  
    @Expose()
    @IsString()
    _content: string;
  
    @Expose()
    @IsNotEmpty()
    _uId: ObjectId;
  
    static getFromReuqest = (req: Request) => {
      return plainToClass(UpdateSocialPostDTO, req.body, {
        excludeExtraneousValues: true,
      });
    };
  }