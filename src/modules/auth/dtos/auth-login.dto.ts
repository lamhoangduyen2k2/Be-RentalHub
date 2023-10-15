import { Expose, plainToClass } from "class-transformer";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { Request } from "express";


export class LoginRequestDTO {
    @IsEmail()
    @IsNotEmpty()
    @Expose()
    _email: string;
  
    @MinLength(4)
    @IsNotEmpty()
    @Expose()
    _password: string;
  
    static fromRequest = (req: Request) => {
      return plainToClass(LoginRequestDTO, req.body, {
        excludeExtraneousValues: true,
      });
    };
  }