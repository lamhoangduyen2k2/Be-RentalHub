import { Exclude, Expose, Transform, plainToClass } from "class-transformer";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class UpdateAddressDTO {
  @Expose()
  _uId: string;

  @Expose()
  _id: string;

  @Expose()
  _address: string;

  @Transform((value) => value.obj._totalRoom && Number(value.obj._totalRoom))
  @Expose()
  _totalRoom: number;

  @Exclude()
  _status: number;

  @Exclude()
  _active: boolean;

  @Exclude()
  _inspectorId: ObjectId;

  @Exclude()
  _reason: string;

  static fromRequest = (req: Request) => {
    return plainToClass(UpdateAddressDTO, req.body, { excludeExtraneousValues: true });
  }
}
