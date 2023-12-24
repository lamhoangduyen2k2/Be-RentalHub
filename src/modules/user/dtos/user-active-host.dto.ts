import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsPhoneNumber } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class UserHostedDTO {
  @IsNotEmpty()
  @Expose()
  _uId: ObjectId;

  @IsPhoneNumber("VN")
  @IsNotEmpty()
  @Expose()
  _phone: string;

  static fromRequest = (req: Request) => {
    return plainToClass(UserHostedDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
