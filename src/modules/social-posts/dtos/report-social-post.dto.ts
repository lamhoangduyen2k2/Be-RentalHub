import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty } from "class-validator";
import { Request } from "express";
import mongoose from "mongoose";

export class ReportSocialPostDTO {
  @Expose()
  _uId: mongoose.Types.ObjectId;

  @Expose()
  @IsNotEmpty()
  _postId: mongoose.Types.ObjectId;

  @Expose()
  @IsNotEmpty()
  _reason: string;

  static fromRequest = (req: Request) => {
    return plainToClass(ReportSocialPostDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}