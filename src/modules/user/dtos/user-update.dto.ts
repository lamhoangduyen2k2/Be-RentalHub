import { Exclude, Expose, plainToClass } from "class-transformer";
import {
  IsDate,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from "class-validator";
import { Request } from "express";
import { ObjectId } from "mongoose";

export class UpdateUserDTO {
  @IsNotEmpty()
  @Expose()
  _uId: ObjectId;

  @ValidateIf((o: UpdateUserDTO) => o._fname !== undefined)
  @IsString()
  @Expose()
  _fname: string;

  @ValidateIf((o: UpdateUserDTO) => o._lname !== undefined)
  @IsString()
  @Expose()
  _lname: string;

  @ValidateIf((o: UpdateUserDTO) => o._dob !== undefined)
  @IsDate()
  @Expose()
  _dob: Date;

  @ValidateIf((o: UpdateUserDTO) => o._phone !== undefined)
  @IsPhoneNumber("VN")
  @Expose()
  _phone: string;

  @ValidateIf((o: UpdateUserDTO) => o._address !== undefined)
  @IsString()
  @Expose()
  _address: string;

  @Exclude()
  _avatar: string;

  @Exclude()
  _email: string;

  @Exclude()
  _pw: string;

  @Exclude()
  _active: boolean;

  @Exclude()
  _rating: number;

  @Exclude()
  _role: number;

  @Exclude()
  _isHost: boolean;

  static fromRequest = (req: Request) => {
    return plainToClass(UpdateUserDTO, req.body, {
      excludeExtraneousValues: true,
    });
  };
}
