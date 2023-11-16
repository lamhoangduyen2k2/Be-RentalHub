import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsPhoneNumber } from "class-validator";
import { Request } from "express";

export class UserHostedDTO {
  @IsNotEmpty()
  @Expose()
  _uId: string;

  

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
