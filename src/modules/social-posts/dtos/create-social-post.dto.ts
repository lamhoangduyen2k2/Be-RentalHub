import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { Request } from "express";

export class CreateSocialPostDTO {
  @Expose()
  @IsNotEmpty()
  @IsString()
  _title: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  _content: string;

  @Expose()
  _uId: string;

  static getFromReuqest = (req: Request) => {
    console.log("🚀 ~ CreateSocialPostDTO ~ req:", req.body)
    return plainToClass(CreateSocialPostDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
