import { Expose, plainToClass } from "class-transformer";
import { IsEmail, IsNotEmpty, Matches, MinLength, ValidateIf } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class UserUpdateEmailOrPassDTO {
  @Expose()
  _uId: ObjectId;

  @ValidateIf((o: UserUpdateEmailOrPassDTO) => o._email !== undefined)
  @Expose()
  @IsEmail()
  _email: string;

  @ValidateIf((o: UserUpdateEmailOrPassDTO) => o._pw !== undefined)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,}$/)
  @MinLength(8)
  @Expose()
  _pw: string;

  @MinLength(8)
  @IsNotEmpty()
  @Expose()
  _pwconfirm: string;

  static fromRequest = (req: Request) => {
    return plainToClass(UserUpdateEmailOrPassDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
