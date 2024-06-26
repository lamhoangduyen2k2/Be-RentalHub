import { Exclude, Expose, Transform, plainToClass } from "class-transformer";
import { ObjectId } from "mongoose";

export class UserNotDetailResponsesDTO {
  @Expose()
  @Transform((value) => value.obj._id.toString())
  _id: ObjectId;

  @Expose()
  _email: string;

  @Expose()
  _name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  _pw: string;

  @Exclude()
  _fname: string;

  @Exclude()
  _lname: string;

  @Exclude()
  _dob: string;

  @Exclude()
  _phone: string;

  @Exclude()
  _address: string;

  @Expose()
  _avatar: string;

  @Exclude()
  _active: boolean;

  @Exclude()
  _isHost: boolean;

  @Exclude()
  _role: number;

  @Exclude()
  _rating: number;

  @Exclude()
  _addressRental: string[];

  @Exclude()
  _temptHostBlocked: boolean | null;

  static toResponse = (data: unknown) => {
    return plainToClass(UserNotDetailResponsesDTO, data, {
      excludeExtraneousValues: true,
    });
  };
}
