import { Expose, plainToClass } from "class-transformer";

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
    static fromRequest = (data: unknown) => {
      return plainToClass(LoginGoogleRequestDTO, data, {
        excludeExtraneousValues: true,
      });
    };
  }