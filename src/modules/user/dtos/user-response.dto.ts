import { Exclude, Expose, Transform, plainToClass } from "class-transformer";
import { ObjectId } from "mongoose";

export class UserResponsesDTO {
  @Expose()
  @Transform((value) => value.obj._id.toString())
  _id: ObjectId;
  
  @Expose()
  _email: string;

  @Exclude()
  _pw: string;

  @Expose()
  _fname: string;

  @Expose()
  _lname: string;

  @Expose()
  _dob: string;

  @Expose()
  _phone: string;

  @Expose()
  _address: string;

  @Expose()
  _avatar: string;

  @Expose()
  _active: boolean;

  @Expose()
  _isHost: boolean;

  @Expose()
  _role: number;

  @Expose()
  _rating: number;

  static toResponse = (data: unknown) => {
    return plainToClass(UserResponsesDTO, data, {
      excludeExtraneousValues: true,
    });
  };
}
