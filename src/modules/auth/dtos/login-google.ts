import { Expose, plainToClass } from "class-transformer";
import { Request } from "express";

export class LoginGoogleRequestDTO {
    @Expose()
    email: string;

    @Expose()
    given_name: string;

    @Expose()
    family_name: string;

    @Expose()
    picture: string;
  
    @Expose()
    email_verified: boolean;

    @Expose()
    type_login: string;
    static fromRequest = (req: Request) => {
      return plainToClass(LoginGoogleRequestDTO, req.body, {
        excludeExtraneousValues: true,
      });
    };
  }