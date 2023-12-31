/* eslint-disable @typescript-eslint/no-unused-vars */
import Container, { Service } from "typedi";
import { CreateUserRequestDTO, SendMailDTO } from "./dtos/user-create.dto";
import Users from "./model/users.model";
import { Errors } from "../../helpers/handle-errors";
import { generate } from "otp-generator";
import { OTPService } from "../otp/otp.service";
import OTP from "../otp/otp.model";
import { UserHostedDTO } from "./dtos/user-active-host.dto";
import { UserResponsesDTO } from "./dtos/user-response.dto";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { ImageService } from "../image/image.service";
import { ObjectId } from "mongoose";
import { UserUpdateEmailOrPassDTO } from "./dtos/user-update-email-pass.dto";
import { compare } from "bcrypt";
import RefreshTokens from "../token/refresh.model";
import UsersTermp from "./model/users-termp.model";
import { sign, verify } from "jsonwebtoken";


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
    });

    return UserResponsesDTO.toResponse(newUser);
  };

  //Registor user need to confirm otp
  registorUser = async (userParam: CreateUserRequestDTO) => {
    const user = await Users.findOne({
      _email: userParam._email,
    });

    if (user) throw Errors.Duplicate;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const termpUser = await UsersTermp.findOne({
      _email: userParam._email,
    });

    if (termpUser) {
      await UsersTermp.deleteOne({ _email: userParam._email });
    }

    const newUser = await UsersTermp.create({
      _email: userParam._email,
      _pw: userParam._pw,
      expiredAt: Date.now(),
    });

    if (!newUser) throw Errors.SaveToDatabaseFail;

    //Kiểm tra OTP có bị trùng không
    const Otp = await OTP.findOne({ _email: newUser._email });
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
      email: newUser._email,
      subject: "Confirmation mail ✔",
      text: "You have successfully registered",
      html: `<b>Congratulations, you have successfully registered. Your code is ${otp}</b>`,
    };
    await this.otpService.sendEmail(payload);

    //Save this otp to database
    const newOTP = await OTP.create({
      _email: newUser._email,
      _otp: otp,
      expiredAt: Date.now(),
    });
    if (!newOTP) throw Errors.SaveToDatabaseFail;

    return UserResponsesDTO.toResponse(newUser);
  };

  verifyRegistor = async (email: string, otp: string) => {
    const checkOTP = await OTP.findOne({
      $and: [{ _email: email }, { _otp: otp }],
    });

    if (!checkOTP) throw Errors.ExpiredOtp;

    const newUser = await UsersTermp.findOne({ _email: email });

    if (!newUser) throw Errors.UserNotFound;

    const user = await Users.create({
      _email: newUser._email,
      _pw: newUser._pw,
    });

    if (!user) throw Errors.SaveToDatabaseFail;

    await UsersTermp.deleteOne({ _email: email });

    return UserResponsesDTO.toResponse(user);
  };

  forgotPass = async (email: string, url: string) => {
    const user = await Users.findOne({
      $and: [{ _email: email }, { _active: true }],
    });
    if (!user) throw Errors.UserNotFound;

    const secret = process.env.SECRET_KEY_FORGOT_PASSWORD + user._pw;

    const payload = {
      email: user._email,
      id: user._id,
    };

    const token = sign(payload, secret, { expiresIn: "15m" });
    const link = `${url}/${user._id}/${token}`;

    //Create payload for sendEmail
    const dataMail: SendMailDTO = {
      email: email,
      subject: "Reset passowrd from RentalHub ✔",
      text: "Rest your password",
      html: `<b>Click this link to reset your password: ${link}</b>`,
    };
    await this.otpService.sendEmail(dataMail);

    return true;
  };

  resetPassword = async (
    userId: string,
    token: string,
    _pw: string,
    _pwconfirm: string
  ) => {
    const user = await Users.findOne({
      _id: userId,
    });
    if (!user) throw Errors.UserNotFound;

    const secret = process.env.SECRET_KEY_FORGOT_PASSWORD + user._pw;

    verify(token, secret, (err, payload) => {
      if (err) throw Errors.ExpiredToken;
    });

    if (_pw !== _pwconfirm) throw Errors.PwconfirmInvalid;

    await Users.updateOne({ _id: userId }, { _pw: _pw });

    return { message: "Reset password successfully" };
  };

  updateUser = async (userParam: UpdateUserDTO) => {
    const userUpdated = await Users.findOneAndUpdate(
      { _id: userParam._uId },
      userParam,
      { new: true }
    );

    if (!userUpdated) throw Errors.SaveToDatabaseFail;

    return UserResponsesDTO.toResponse(userUpdated);
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

    return UserResponsesDTO.toResponse(userUpdated);
  };

  updateEmail = async (userParam: UserUpdateEmailOrPassDTO) => {
    if (userParam._email) {
      const user = await Users.findOne({
        $and: [{ _email: userParam._email }, { _id: { $ne: userParam._uId } }],
      });

      if (user) throw Errors.Duplicate;
    }

    const oldUser = await Users.findOne({ _id: userParam._uId });

    if (!oldUser) throw Errors.UserNotFound;

    const isValid = await compare(userParam._pwconfirm, oldUser._pw);

    if (!isValid) throw Errors.PwconfirmInvalid;

    const newUser = await Users.updateOne(
      { _id: userParam._uId },
      { _email: userParam._email, _pw: userParam._pw }
    );

    if (newUser.modifiedCount <= 0) throw Errors.SaveToDatabaseFail;

    await RefreshTokens.deleteMany({ _uId: userParam._uId });

    return { message: "Please login againt!" };
  };

  getUserById = async (uId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: uId }, { _active: true }, { _role: 0 }],
    });

    if (!user) throw Errors.UserNotFound;

    return UserResponsesDTO.toResponse(user);
  };

  activeHost = async (userParam: UserHostedDTO) => {
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
  };

  verifyHost = async (userId: string, otp: string) => {
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
  };

  resetOTP = async (userId: string) => {
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
  };

  // forgotPass = async (userParam: UserForgotPassDTO) => {
  //   //Check phoneNumber
  //   const user = await Users.findOne({
  //     $and: [{ _email: userParam._email }, { _active: true }],
  //   });
  //   if (!user) throw Errors.UserNotFound;

  //   //Kiểm tra OTP có bị trùng không
  //   const Otp = await otpForgot.findOne({
  //     $and: [{ _email: userParam._email }, { _isVerify: false }],
  //   });
  //   if (Otp) throw Errors.OtpDuplicate;

  //   //Create otp
  //   const otp: string = generate(6, {
  //     digits: true,
  //     lowerCaseAlphabets: false,
  //     upperCaseAlphabets: false,
  //     specialChars: false,
  //   }).toString();

  //   //Create payload for sendEmail
  //   const payload: SendMailDTO = {
  //     email: userParam._email,
  //     subject: "Reset password from RentalHub ✔",
  //     text: "Reset your password",
  //     html: `<b>This is your otp to reset password: ${otp}</b>`,
  //   };
  //   await this.otpService.sendEmail(payload);

  //   //Save this otp to database
  //   const newOTP = await otpForgot.create({
  //     _email: userParam._email,
  //     _otp: otp,
  //     expiredAt: Date.now(),
  //   });
  //   if (!newOTP) throw Errors.SaveToDatabaseFail;
  //   return true;
  // };
}
