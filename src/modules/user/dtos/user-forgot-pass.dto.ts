import { Expose, plainToClass } from "class-transformer";
import { IsEmail, IsNotEmpty } from "class-validator";
import { Request } from "express";

export class UserForgotPassDTO {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  _email: string;

  static fromRequest = (req: Request) => {
    return plainToClass(UserForgotPassDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
