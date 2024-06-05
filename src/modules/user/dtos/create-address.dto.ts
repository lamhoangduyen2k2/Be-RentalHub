import { Expose, plainToClass } from "class-transformer";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class CreateAddressDTO {
  @Expose()
  _uId: ObjectId;

  @Expose()
  _address: string;

  @Expose()
  _totalRoom: number;

  @Expose()
  image: string[];

  static fromRequest = (req: Request) => {
    return plainToClass(CreateAddressDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
