import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty } from "class-validator";
import { Request } from "express";
import mongoose from "mongoose";


export class ReportCreateDTO {
  @Expose()
  _uId: mongoose.Types.ObjectId;

  @Expose()
  @IsNotEmpty()
  _postId:  mongoose.Types.ObjectId;

  @Expose()
  @IsNotEmpty()
  _content: string;

  @Expose()
  _uIdReported:  mongoose.Types.ObjectId;

  static fromRequest = (req: Request) => {
    return plainToClass(ReportCreateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
