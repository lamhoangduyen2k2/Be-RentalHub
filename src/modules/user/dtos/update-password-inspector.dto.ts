import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, Matches, MinLength, ValidateIf } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class UpdateInspectorPasswordDTO {
  @Expose()
  _uId: ObjectId;

  @ValidateIf((o: UpdateInspectorPasswordDTO) => o._oldpw !== undefined)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,}$/)
  @MinLength(8)
  @Expose()
  _oldpw: string;

  @ValidateIf((o: UpdateInspectorPasswordDTO) => o._pw !== undefined)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,}$/)
  @MinLength(8)
  @Expose()
  _pw: string;

  @MinLength(8)
  @IsNotEmpty()
  @Expose()
  _pwconfirm: string;

  static fromRequest = (req: Request) => {
    return plainToClass(UpdateInspectorPasswordDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}