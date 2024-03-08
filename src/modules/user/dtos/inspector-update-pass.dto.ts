import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, Matches, MinLength, ValidateIf } from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class UpdateInspectorPassDTO {
  @Expose()
  _inspectId: ObjectId;

  @ValidateIf((o: UpdateInspectorPassDTO) => o._pw !== undefined)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,}$/)
  @MinLength(8)
  @Expose()
  _pw: string;

  @MinLength(8)
  @IsNotEmpty()
  @Expose()
  _pwconfirm: string;

  static fromRequest = (req: Request) => {
    return plainToClass(UpdateInspectorPassDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
