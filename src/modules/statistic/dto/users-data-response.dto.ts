import { Exclude, Expose, Transform, plainToClass } from "class-transformer";
import { ObjectId } from "mongoose";

export class UserDataResponsesDTO {
    @Expose()
    @Transform((value) => value.obj._id.toString())
    _id: ObjectId ;
    
    @Expose()
    _email: string;
  
    @Exclude()
    _pw: string;
  
    @Expose()
    _fname: string;
  
    @Expose()
    _lname: string;
  
    @Exclude()
    _dob: string;
  
    @Expose()
    _phone: string;
  
    @Exclude()
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
    _loginType: string;
  
    @Exclude()
    _rating: number;
  
    @Exclude()
    _addressRental: string[];
  
    @Exclude()
    _temptHostBlocked: boolean | null;
  
    static toResponse = (data: unknown) => {
      return plainToClass(UserDataResponsesDTO, data, {
        excludeExtraneousValues: true,
      });
    };
  }