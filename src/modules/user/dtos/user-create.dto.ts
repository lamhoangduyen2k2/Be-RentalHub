import { Expose, plainToClass } from "class-transformer";
import { IsEmail, IsNotEmpty, Matches, MinLength } from "class-validator";
import { Request } from "express";

export class CreateUserRequestDTO {
  // @IsString()
  // @IsNotEmpty()
  // @Expose()
  // _fname: string;

  // @IsString()
  // @IsNotEmpty()
  // @Expose()
  // _lname: string;

  @IsEmail()
  @IsNotEmpty()
  @Expose()
  _email: string;

  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,}$/)
  @MinLength(8)
  @IsNotEmpty()
  @Expose()
  _pw: string;

  @MinLength(8)
  @IsNotEmpty()
  @Expose()
  _pwconfirm: string;

  static fromRequest = (req: Request) => {
    return plainToClass(CreateUserRequestDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}

export class SendMailDTO {
  email: string;
  subject: string;
  text: string;
  html: string;
}
