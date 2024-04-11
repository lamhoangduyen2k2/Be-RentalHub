import { Expose, plainToClass } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Request } from "express";

export class SensorIdenityDTO {
  @Expose()
  @IsNotEmpty()
  @IsString()
  id: string;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  status: number;

  @Expose()
  @IsNotEmpty()
  @IsString()
  reason: string;

  @Expose()
  _uId: string;

  static fromRequest = (req: Request) => {
    return plainToClass(SensorIdenityDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}