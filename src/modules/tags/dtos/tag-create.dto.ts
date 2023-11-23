import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { Request } from "express";

export class TagCreateDTO {
  @IsNotEmpty()
  @IsString()
  @Expose()
  _tag: string;

  @ValidateIf((o: TagCreateDTO) => o._type !== undefined)
  @IsString()
  @Expose()
  _type: string;

  static fromRequest = (req: Request) => {
    return plainToClass(TagCreateDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
