import { Expose, plainToClass } from "class-transformer";
import { IsBoolean } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class PostUpdateStatusDTO {
  @Expose()
  _uId: ObjectId;

  @Expose()
  @IsBoolean()
  _active: boolean;

  static fromRequest = (req: Request) => {
    return plainToClass(PostUpdateStatusDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
