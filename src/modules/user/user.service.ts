import Container, { Service } from "typedi";
import { CreateUserRequestDTO, SendMailDTO } from "./dtos/user-create.dto";
import Users from "./users.model";
import { Errors } from "../../helpers/handle-errors";
import { generate } from "otp-generator";
import { OTPService } from "../otp/otp.service";
import OTP from "../otp/otp.model";
import { UserHostedDTO } from "./dtos/user-active-host.dto";
import { UserResponsesDTO } from "./dtos/user-response.dto";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { ImageService } from "../image/image.service";
import { ObjectId } from "mongoose";

@Service()
export class UserService {
  otpService = Container.get(OTPService);
  imageService = Container.get(ImageService);
  //Registor
  createNewUser = async (userParam: CreateUserRequestDTO) => {
    const user = await Users.findOne({
      _email: userParam._email,
    });

    if (user) throw Errors.Duplicate;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const newUser = await Users.create({
      _email: userParam._email,
      _pw: userParam._pw,
      _address: null,
      _avatar: null,
      _dob: null,
      _lname: null,
      _fname: null,
    });

    return UserResponsesDTO.toResponse(newUser);
  };

  updateUser = async (userParam: UpdateUserDTO) => {
    const userUpdated = await Users.findOneAndUpdate(
      { _id: userParam._uId },
      userParam,
      { new: true }
    );

    if (!userUpdated) throw Errors.SaveToDatabaseFail;

    return userUpdated;
  };

  updateAvatar = async (file: Express.Multer.File, uId: ObjectId) => {
    const urlAvatar = await this.imageService.uploadAvatar(file);

    //Update avatar user
    const userUpdated = await Users.findOneAndUpdate(
      { _id: uId },
      { _avatar: urlAvatar },
      {
        new: true,
      }
    );

    if (!userUpdated) throw Errors.SaveToDatabaseFail;

    return userUpdated;
  };

  getUserById = async (uId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: uId }, { _active: true }, { _role: 0 }],
    });

    if (!user) throw Errors.UserNotFound;

    return UserResponsesDTO.toResponse(user);
  };

  activeHost = async (userParam: UserHostedDTO) => {
    try {
      //Check phoneNumber
      const userPhone = await Users.findOne({
        $and: [{ _phone: userParam._phone }, { _id: { $ne: userParam._uId } }],
      });
      if (userPhone) throw Errors.PhonenumberDuplicate;

      //Kiểm tra user có quyền host hay chưa
      const user = await Users.findById(userParam._uId);
      if (user._isHost) throw Errors.UserIsHosted;

      //Kiểm tra OTP có bị trùng không
      const Otp = await OTP.findOne({ _uId: user._id });
      if (Otp) throw Errors.OtpDuplicate;

      //Create otp
      const otp: string = generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      }).toString();

      //Create payload for sendEmail
      const payload: SendMailDTO = {
        email: user._email,
        subject: "Confirmation mail ✔",
        text: "You are successful",
        html: `<b>Congratulations, you have successfully hosted. Your code is ${otp}</b>`,
      };
      await this.otpService.sendEmail(payload);

      //Save this otp to database
      const newOTP = await OTP.create({
        _uId: user._id,
        _otp: otp,
        expiredAt: Date.now(),
      });
      if (!newOTP) throw Errors.SaveToDatabaseFail;

      //Save phonenumber for user
      await Users.updateOne(
        { _id: userParam._uId },
        { _phone: userParam._phone }
      );
      return true;
    } catch (error) {
      return error;
    }
  };

  verifyHost = async (userId: string, otp: string) => {
    try {
      const checkOTP = await OTP.findOne({
        $and: [{ _uId: userId }, { _otp: otp }],
      });

      if (!checkOTP) throw Errors.ExpiredOtp;

      const newUser = await Users.findByIdAndUpdate(
        userId,
        { _isHost: true },
        { new: true }
      );

      if (!newUser) Errors.SaveToDatabaseFail;

      return UserResponsesDTO.toResponse(newUser);
    } catch (error) {
      return error;
    }
  };

  resetOTP = async (userId: string) => {
    try {
      const user = await Users.findById(userId);

      if (!user) throw Errors.UserNotFound;
      if (user._isHost) throw Errors.UserIsHosted;

      //Delete old OTP
      await OTP.deleteOne({ _uId: userId });

      //Create otp
      const otp: string = generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      }).toString();

      //Create payload for sendEmail
      const payload: SendMailDTO = {
        email: user._email,
        subject: "Reset Otp ✔",
        text: "Here is your new OTP",
        html: `<b>Your code is ${otp}. This OTP will expired after 60 seconds</b>`,
      };
      await this.otpService.sendEmail(payload);

      //Save this otp to database
      const newOTP = await OTP.create({
        _uId: user._id,
        _otp: otp,
        expiredAt: Date.now(),
      });

      if (!newOTP) throw Errors.SaveToDatabaseFail;

      return true;
    } catch (error) {
      return error;
    }
  };
}
