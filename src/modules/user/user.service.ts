/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Container, { Inject, Service } from "typedi";
import { CreateUserRequestDTO, SendMailDTO } from "./dtos/user-create.dto";
import Users from "./model/users.model";
import { Errors } from "../../helpers/handle-errors";
import { generate } from "otp-generator";
import { OTPService } from "../otp/otp.service";
import OTP from "../otp/otp.model";
import { UserHostedDTO } from "./dtos/user-active-host.dto";
import { UserResponsesDTO } from "./dtos/detail-user-response.dto";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { ImageService } from "../image/image.service";
import mongoose, { ObjectId, PipelineStage, mongo } from "mongoose";
import { UserUpdateEmailOrPassDTO } from "./dtos/user-update-email-pass.dto";
import { compare } from "bcrypt";
import RefreshTokens from "../token/refresh.model";
import UsersTermp from "./model/users-termp.model";
import { sign, verify } from "jsonwebtoken";
import { Pagination } from "../../helpers/response";
import { UpdateInspectorPassDTO } from "./dtos/inspector-update-pass.dto";
import { UpdateInspectorPasswordDTO } from "./dtos/update-password-inspector.dto";
import { convertUTCtoLocal } from "../../helpers/ultil";
import FormData from "form-data";
import fs from "fs";
import { Multer } from "multer";
import { fetchIDRecognition } from "../../helpers/request";
import Indentities from "./model/users-identity.model";
import { NotificationService } from "../notification/notification.service";
import { CreateNotificationInspectorDTO } from "../notification/dtos/create-notification-inspector.dto";
import Notification from "../notification/notification.model";
import addressRental from "./model/user-address.model";
import { CreateNotificationRegisterAddressDTO } from "../notification/dtos/create-notification-register-address.dto";
import UserBlocked from "./model/user-blocked.model";
import { CreateNotificationDTO } from "../notification/dtos/create-notification.dto";
import { UpdateAddressDTO } from "./dtos/update-address.dto";
import { UserNotDetailResponsesDTO } from "./dtos/user-response.dto";
import Chat from "twilio/lib/rest/Chat";
import chatModel from "../chats/chat.model";
//require("esm-hook");
//const fetch = require("node-fetch").default;
// const http = require("http");
// const https = require("https");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

@Service()
export class UserService {
  // otpService = Container.get(OTPService);
  // imageService = Container.get(ImageService);
  // notificationService = Container.get(NotificationService);

  constructor(
    @Inject() private imageService: ImageService,
    @Inject() private otpService: OTPService,
    @Inject() private notificationService: NotificationService
  ) {}

  //User API
  public createNewUser = async (userParam: CreateUserRequestDTO) => {
    const user = await Users.findOne({
      $and: [{ _email: userParam._email }, { _active: true }, { _role: 0 }],
    });

    if (user) throw Errors.Duplicate;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const newUser = await Users.create({
      _fname: userParam._fname,
      _lname: userParam._lname,
      _email: userParam._email,
      _pw: userParam._pw,
    });

    return UserResponsesDTO.toResponse(newUser);
  };

  public registorUser = async (userParam: CreateUserRequestDTO) => {
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
      _fname: userParam._fname,
      _lname: userParam._lname,
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

  public verifyRegistor = async (email: string, otp: string) => {
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

    const chatAdmin = await chatModel.create({
      members: [user._id.toString(), "65418310bec0ba49c4d9a276"],
    })
    if (!chatAdmin) throw Errors.SaveToDatabaseFail;

    await UsersTermp.deleteOne({ _email: email });

    return UserResponsesDTO.toResponse(user);
  };

  public forgotPass = async (email: string, url: string) => {
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

  public resetPassword = async (
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

  public updateUser = async (userParam: UpdateUserDTO) => {
    //Check phoneNumber
    const userPhone = await Users.findOne({
      $and: [{ _phone: userParam._phone }, { _id: { $ne: userParam._uId } }],
    });
    if (userPhone) throw Errors.PhonenumberDuplicate;

    const userUpdated = await Users.findOneAndUpdate(
      { _id: userParam._uId },
      userParam,
      { new: true }
    );

    if (!userUpdated) throw Errors.SaveToDatabaseFail;

    const _dob = convertUTCtoLocal(userUpdated._dob);
    const newUser = {
      ...userUpdated.toObject(),
      _dob,
    };

    return UserResponsesDTO.toResponse(newUser);
  };

  public updateAvatar = async (file: Express.Multer.File, uId: ObjectId) => {
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

    const _dob = convertUTCtoLocal(userUpdated._dob);
    const newUser = {
      ...userUpdated.toObject(),
      _dob,
    };

    return UserResponsesDTO.toResponse(newUser);
  };

  public updateEmail = async (userParam: UserUpdateEmailOrPassDTO) => {
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

  public getUserById = async (uId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: uId }, { _active: true }, { _role: 0 }],
    });

    if (!user) throw Errors.UserNotFound;

    const _dob = convertUTCtoLocal(user._dob);
    const newUser = {
      ...user.toObject(),
      _dob,
    };

    return UserResponsesDTO.toResponse(newUser);
  };

  public getUserNotDetailById = async (uId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: uId }, { _active: true }]});

    if (!user) throw Errors.UserNotFound;

    const newUser = {
      ...user.toObject(),
      _name: `${user._fname} ${user._lname}`,
    };

    return UserNotDetailResponsesDTO.toResponse(newUser);
  };

  public activeHost = async (userParam: UserHostedDTO) => {
    // Check user is Block Host
    const userBlock = await UserBlocked.findOne({
      $or: [{ _uId: userParam._uId }, { _phone: userParam._phone }],
    });
    if (userBlock) throw Errors.UserIsBlocked;

    //Check phoneNumber
    const userPhone = await Users.findOne({
      $and: [{ _phone: userParam._phone }, { _id: { $ne: userParam._uId } }],
    });
    if (userPhone) throw Errors.PhonenumberDuplicate;

    const phone = userParam._phone.replace("0", "+84");

    //Kiểm tra user có quyền host hay chưa
    const user = await Users.findById(userParam._uId);
    if (user._isHost) throw Errors.UserIsHosted;

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: "sms" })
      .then((verification) => console.log(verification));
    return true;
  };

  public verifyHost = async (userId: string, phone: string, otp: string) => {
    try {
      const _phone = phone.replace("0", "+84");

      const result = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID)
        .verificationChecks.create({ to: _phone, code: otp })
        .then((verification_check) => {
          console.log(
            "🚀 ~ UserService ~ .then ~ verification_check:",
            verification_check
          );
          return verification_check;
        })
        .catch((err) => {
          console.log("🚀 ~ UserService ~ verifyHost= ~ err:", err);
          throw Errors.ExpiredOtp;
        });

      if (!result.valid) throw Errors.OtpInvalid;

      const newUser = await Users.findByIdAndUpdate(
        userId,
        { _phone: phone },
        { new: true }
      );

      if (!newUser) Errors.SaveToDatabaseFail;

      return UserResponsesDTO.toResponse(newUser);
    } catch (error) {
      console.log("🚀 ~ UserService ~ verifyHost= ~ error:", error);
      throw error;
    }
    // const checkOTP = await OTP.findOne({
    //   $and: [{ _uId: userId }, { _otp: otp }],
    // });

    // if (!checkOTP) throw Errors.ExpiredOtp;

    // const newUser = await Users.findByIdAndUpdate(
    //   userId,
    //   { _isHost: true },
    //   { new: true }
    // );

    // if (!newUser) Errors.SaveToDatabaseFail;

    // return UserResponsesDTO.toResponse(newUser);
  };

  public verifyIdentity = async (
    userId: string,
    image_front: Express.Multer.File,
    image_back: Express.Multer.File
  ) => {
    try {
      let result;
      // Check user is Block Host
      const userBlock = await UserBlocked.findOne({
        _uId: new mongoose.Types.ObjectId(userId),
      });
      if (userBlock) throw Errors.UserIsBlocked;

      const base64_front = image_front.buffer.toString("base64");
      const base64_back = image_back.buffer.toString("base64");

      const data_front = await fetchIDRecognition(base64_front);

      // Check user is Block Host
      const userBlockIdentity = await UserBlocked.findOne({
        _idCard: data_front.id,
      });
      if (userBlockIdentity) throw Errors.UserIsBlocked;
      //Check identity card is duplicate
      const indentity = await Indentities.findOne({
        $and: [{ _uId: { $ne: userId } }, { _idCard: data_front.id }],
      });
      if (indentity) throw Errors.IDCardDuplicate;

      const data_back = await fetchIDRecognition(base64_back);
      const resultIndentity = { ...data_front, ...data_back };
      const checkIdentity = await Indentities.findOne({ _uId: userId });

      if (checkIdentity) {
        const updateIndentity = await Indentities.findOneAndUpdate(
          { _uId: new mongoose.Types.ObjectId(userId) },
          {
            _idCard: resultIndentity.id,
            _name: resultIndentity.name,
            _dob: resultIndentity.dob,
            _home: resultIndentity.home,
            _address: resultIndentity.address,
            _gender: resultIndentity.sex,
            _nationality: resultIndentity.nationality
              ? resultIndentity.nationality
              : null,
            _features: resultIndentity.features,
            _issueDate: resultIndentity.issue_date,
            _doe: resultIndentity.doe ? resultIndentity.doe : null,
            _issueLoc: resultIndentity.issue_loc
              ? resultIndentity.issue_loc
              : null,
            _type: data_front.type_new ? data_front.type_new : data_front.type,
            _verified: false,
            _reason: null,
          },
          { new: true }
        );
        if (!updateIndentity) throw Errors.SaveToDatabaseFail;

        const updatedUser = await Users.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(userId) },
          { _isHost: false, _temptHostBlocked: true },
          { new: true }
        );
        if (!updatedUser) throw Errors.SaveToDatabaseFail;

        result = UserResponsesDTO.toResponse(updatedUser);
      } else {
        const newIndentity = await Indentities.create({
          _uId: new mongoose.Types.ObjectId(userId),
          _idCard: resultIndentity.id,
          _name: resultIndentity.name,
          _dob: resultIndentity.dob,
          _home: resultIndentity.home,
          _address: resultIndentity.address,
          _gender: resultIndentity.sex,
          _nationality: resultIndentity.nationality
            ? resultIndentity.nationality
            : null,
          _features: resultIndentity.features,
          _issueDate: resultIndentity.issue_date,
          _doe: resultIndentity.doe ? resultIndentity.doe : null,
          _issueLoc: resultIndentity.issue_loc
            ? resultIndentity.issue_loc
            : null,
          _type: data_front.type_new ? data_front.type_new : data_front.type,
        });
        if (!newIndentity) throw Errors.SaveToDatabaseFail;

        result = newIndentity;
      }
      //Create notification for inspector
      const notification = CreateNotificationInspectorDTO.fromService({
        _uId: new mongoose.Types.ObjectId(userId),
        _type: "ACTIVE_HOST",
        _title: "Yêu cầu quyền host từ người dùng",
        _message: `Người dùng mang id ${userId} đã gửi yêu cầu quyền host. Vui lòng kiểm tra thông tin và cấp quyền cho người dùng này`,
      });
      const newNotification = await this.notificationService.createNotification(
        notification
      );

      if (!newNotification) throw Errors.SaveToDatabaseFail;

      return result;
    } catch (error) {
      console.log("🚀 ~ UserService ~ error:", error);
      throw error;
    }
  };

  public resetOTP = async (userId: string) => {
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

  public getIdentityUser = async (userId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: userId }, { _active: true }],
    });

    const identity = await Indentities.findOne({
      $and: [{ _uId: userId }, { _verified: true }],
    });
    if (!identity) throw Errors.UserIdentityNotFound;

    return identity;
  };

  public registerAddress = async (
    address: string,
    totalRooms: number,
    userId: string,
    img: Express.Multer.File[]
  ) => {
    const user = await Users.findOne({ _id: userId });
    if (!user) throw Errors.UserNotFound;
    if (!user._isHost) throw Errors.Unauthorized;

    //Upload certificate images to firebase
    const urlCerf = await this.imageService.uploadCerf(img, userId);
    if (!urlCerf) throw Errors.UploadImageFail;

    const addressUser = await addressRental.create({
      _uId: new mongoose.Types.ObjectId(userId),
      _address: address,
      _totalRoom: totalRooms ? totalRooms : 1,
      _imgLicense: urlCerf,
    });
    if (!addressUser) throw Errors.SaveToDatabaseFail;

    //create notification for inspector
    const notification = CreateNotificationRegisterAddressDTO.fromService({
      _uId: user._id,
      _addressId: addressUser._id,
      _type: "REGISTER_ADDRESS",
      _title: "Yêu cầu đăng kí địa chỉ host",
      _message: `Người dùng mang id ${userId} đã gửi yêu cầu đăng kí địa chỉ phòng trọ. Vui lòng kiểm tra thông tin và cấp quyền cho người dùng này`,
    });
    const newNotification = await this.notificationService.createNotification(
      notification
    );
    if (!newNotification) throw Errors.SaveToDatabaseFail;

    return addressUser;
  };

  public getAddressesByStatusUser = async (
    userId: string,
    status: number,
    pagination: Pagination
  ) => {
    const user = await Users.findOne({
      $and: [{ _id: userId }, { _active: true }],
    });
    if (!user) throw Errors.UserNotFound;

    if (status < 0 || status > 3) throw Errors.StatusInvalid;

    const count = await addressRental.countDocuments({
      $and: [{ _uId: userId }, { _status: status }],
    });
    if (count <= 0) throw Errors.AddressRentakNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    const addresses = await addressRental
      .find({ $and: [{ _uId: userId }, { _status: status }] })
      .limit(pagination.limit)
      .skip(pagination.offset);

    if (addresses.length <= 0) throw Errors.AddressRentakNotFound;

    return [
      addresses,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getAddressByIdUser = async (addressId: string, userId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: userId }, { _active: true }],
    });
    if (!user) throw Errors.UserNotFound;

    const address = await addressRental.findOne({
      $and: [{ _id: addressId }, { _uId: userId }],
    });
    if (!address) throw Errors.AddressRentakNotFound;

    return address;
  };

  public manageSatusOfAddressUser = async (
    status: number,
    userId: string,
    addressId: string
  ) => {
    const user = await Users.findOne({
      $and: [{ _id: userId }, { _active: true }],
    });
    if (!user) throw Errors.UserNotFound;

    const address = await addressRental.findOne({
      $and: [{ _id: addressId }, { _uId: userId }],
    });
    if (!address) throw Errors.AddressRentakNotFound;

    if (status !== 1 && status !== 3) throw Errors.StatusInvalid;

    const updateAddress = await addressRental.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressId) },
      { _status: status, _active: status === 1 ? true : false },
      { new: true }
    );
    if (!updateAddress) throw Errors.SaveToDatabaseFail;

    const index = user._addressRental.indexOf(updateAddress._address);

    if (status === 1 && index < 0) {
      user._addressRental.push(updateAddress._address);

      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId) },
        { _addressRental: user._addressRental },
        { new: true }
      );
      if (!updateUser) throw Errors.SaveToDatabaseFail;
    } else if (status === 3 && index >= 0) {
      user._addressRental.splice(index, 1);

      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId) },
        { _addressRental: user._addressRental },
        { new: true }
      );
      if (!updateUser) throw Errors.SaveToDatabaseFail;
    }

    return updateAddress;
  };

  public updateAddress = async (
    img: Express.Multer.File[],
    addressInfo: UpdateAddressDTO
  ) => {
    const user = await Users.findOne({
      $and: [{ _id: addressInfo._uId }, { _active: true }, { _isHost: true }],
    });
    if (!user) throw Errors.UserNotFound;

    const address = await addressRental.findOne({
      $and: [
        { _id: addressInfo._id },
        { _uId: addressInfo._uId },
        { _status: 1 },
        { _active: true },
      ],
    });
    if (!address) throw Errors.AddressRentakNotFound;

    const updateAddress = {
      _address: addressInfo._address || address._address,
      _totalRoom: addressInfo._totalRoom || address._totalRoom,
      _imgLicense: address._imgLicense,
      _status: 0,
      _active: address._active,
      _inspectorId: address._inspectorId,
      _reason: address._reason,
    };

    //Upload certificate images to firebase (if have)
    if (img.length > 0) {
      const urlCerf = await this.imageService.uploadCerf(img, addressInfo._uId);
      if (!urlCerf) throw Errors.UploadImageFail;

      updateAddress._imgLicense = urlCerf;
    }

    //Update address
    const updatedAddress = await addressRental.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(addressInfo._id),
      },
      updateAddress,
      { new: true }
    );
    if (!updatedAddress) throw Errors.SaveToDatabaseFail;

    //create notification for inspector
    const notification = CreateNotificationRegisterAddressDTO.fromService({
      _uId: user._id,
      _addressId: updatedAddress._id,
      _type: "UPDATE_ADDRESS",
      _title: "Thông báo cập nhật thông tin địa chỉ host",
      _message: `Người dùng mang id ${user._id} đã cập nhật thông tin địa chỉ phòng trọ. Vui lòng kiểm tra thông tin và cấp quyền cho người dùng này`,
    });
    const newNotification = await this.notificationService.createNotification(
      notification
    );
    if (!newNotification) throw Errors.SaveToDatabaseFail;

    return updatedAddress;
  };

  //Inspector
  public updateInspectorProfile = async (userParam: UpdateUserDTO) => {
    const inspector = await Users.findOne({
      $and: [{ _id: userParam._uId }, { _role: 2 }, { _active: true }],
    });
    if (!inspector) throw Errors.UserNotFound;

    const inspectorPhone = await Users.findOne({
      $and: [
        { _phone: userParam._phone },
        { _role: 2 },
        { _id: { $ne: userParam._uId } },
      ],
    });
    if (inspectorPhone) throw Errors.PhonenumberDuplicate;

    const inspectorUpdated = await Users.findOneAndUpdate(
      { _id: userParam._uId },
      userParam,
      { new: true }
    );
    if (!inspectorUpdated) throw Errors.SaveToDatabaseFail;

    const _dob = convertUTCtoLocal(inspectorUpdated._dob);
    const newInspector = {
      ...inspectorUpdated.toObject(),
      _dob,
    };

    return UserResponsesDTO.toResponse(newInspector);
  };

  public updateInspectorAvatar = async (
    file: Express.Multer.File,
    uId: ObjectId
  ) => {
    const urlAvatar = await this.imageService.uploadAvatar(file);

    //Update avatar user
    const inspectorUpdated = await Users.findOneAndUpdate(
      { _id: uId },
      { _avatar: urlAvatar },
      {
        new: true,
      }
    );

    if (!inspectorUpdated) throw Errors.SaveToDatabaseFail;

    const _dob = convertUTCtoLocal(inspectorUpdated._dob);
    const newInspector = {
      ...inspectorUpdated.toObject(),
      _dob,
    };

    return UserResponsesDTO.toResponse(newInspector);
  };

  public updatePasswordInspector = async (
    userParam: UpdateInspectorPasswordDTO
  ) => {
    const inspector = await Users.findOne({
      $and: [{ _id: userParam._uId }, { _role: 2 }, { _active: true }],
    });
    if (!inspector) throw Errors.UserNotFound;

    //Check old password
    const isValid = await compare(userParam._oldpw, inspector._pw);
    if (!isValid) throw Errors.OldpwInvalid;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const updateInspector = await Users.updateOne(
      { _id: userParam._uId },
      { _pw: userParam._pw }
    );
    if (updateInspector.modifiedCount <= 0) throw Errors.SaveToDatabaseFail;

    await RefreshTokens.deleteMany({ _uId: userParam._uId });

    return { message: "Login againt!" };
  };

  public getActiveHostRequestsByStatus = async (
    status: number,
    pagination: Pagination
  ) => {
    let condition: PipelineStage;
    let count: number = 0;
    // Set condition and count follow status
    if (status === 0) {
      count = await Indentities.countDocuments({
        $and: [{ _verified: false }, { _reason: null }],
      });
      condition = {
        $match: { $and: [{ _verified: false }, { _reason: null }] },
      };
    } else if (status === 1) {
      count = await Indentities.countDocuments({ _verified: true });
      condition = { $match: { _verified: true } };
    } else if (status === 2) {
      count = await Indentities.countDocuments({
        $and: [{ _verified: false }, { _reason: { $ne: null } }],
      });
      condition = {
        $match: { $and: [{ _verified: false }, { _reason: { $ne: null } }] },
      };
    } else throw Errors.StatusInvalid;

    if (count <= 0) throw Errors.UserIdentityNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    if (pagination.page > totalPages) throw Errors.PageNotFound;

    const userIdentities = await Indentities.aggregate([
      condition,
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          _uId: "$user._id",
          _name: 1,
          _dob: 1,
          _home: 1,
          _address: 1,
          _fullname: { $concat: ["$user._lname", " ", "$user._fname"] },
          updatedAt: 1,
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (userIdentities.length <= 0) throw Errors.UserIdentityNotFound;

    userIdentities.forEach((ident) => {
      ident._date = convertUTCtoLocal(ident.updatedAt);
      delete ident.updatedAt;
    });

    return [
      userIdentities,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getActiveHostRequestById = async (userId: string, notiId: string) => {
    const userIdentity = await Indentities.findOne({
      _uId: new mongoose.Types.ObjectId(userId),
    });
    if (!userIdentity) throw Errors.UserIdentityNotFound;

    if (notiId) {
      await Notification.findOneAndUpdate(
        {
          $and: [
            { _id: new mongoose.Types.ObjectId(notiId) },
            { _read: false },
          ],
        },
        { _read: true },
        { new: true }
      );
    }

    return userIdentity;
  };

  public sensorActiveHostRequest = async (
    identId: string,
    status: number,
    reason: string,
    inspectorId: string
  ) => {
    let updateObj = {};
    let notification: CreateNotificationInspectorDTO;
    const userIdentity = await Indentities.findOne({
      $and: [{ _id: identId }, { _reason: null }, { _verified: false }],
    });
    if (!userIdentity) throw Errors.UserIdentityNotFound;

    if (status === 1) {
      updateObj = {
        ...updateObj,
        _verified: true,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: userIdentity._uId,
        _type: "ACTIVE_HOST_SUCCESS",
        _title: "Thông báo xác thực quyền host thành công",
        _message:
          "Thông tin của bạn đã được xác thực. Bạn đã có thể sử dụng quyền host (Đăng kí địa chỉ, Đăng bài)",
      });
    } else if (status === 2) {
      updateObj = {
        ...updateObj,
        _verified: false,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: userIdentity._uId,
        _type: "ACTIVE_HOST_FAIL",
        _title: "Thông báo xác thực quyền host thất bại",
        _message: `Thông tin của bạn không đúng. Lý do: ${reason}. Vui lòng kiểm tra lại thông tin và thử lại`,
      });
    } else throw Errors.StatusInvalid;

    const updateIdentity = await Indentities.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(identId) },
      updateObj,
      { new: true }
    );

    if (!updateIdentity) throw Errors.SaveToDatabaseFail;

    if (status === 1) {
      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userIdentity._uId) },
        { _isHost: true, _temptHostBlocked: false },
        { new: true }
      );

      if (!updateUser) throw Errors.SaveToDatabaseFail;
    }

    const newNotification = await this.notificationService.createNotification(
      notification
    );

    if (!newNotification) throw Errors.SaveToDatabaseFail;

    return updateIdentity;
  };

  public getAddressRequestsByStatus = async (
    status: number,
    pagination: Pagination
  ) => {
    if (status === -1) throw Errors.StatusInvalid;

    const count: number = await addressRental.countDocuments({
      _status: status,
    });
    if (count <= 0) throw Errors.UserIdentityNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    if (pagination.page > totalPages) throw Errors.PageNotFound;

    const addressRequests = await addressRental
      .aggregate([
        { $match: { _status: status } },
        {
          $lookup: {
            from: "users",
            localField: "_uId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            _uId: "$user._id",
            _address: 1,
            _totalRoom: 1,
            _imgLicense: 1,
            _fullname: { $concat: ["$user._lname", " ", "$user._fname"] },
            updatedAt: 1,
          },
        },
      ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (addressRequests.length <= 0) throw Errors.PageNotFound;

    addressRequests.forEach((address) => {
      address._date = convertUTCtoLocal(address.updatedAt);
      delete address.updatedAt;
    });

    return [
      addressRequests,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getAddressRequestById = async (addressId: string, notiId: string) => {
    if (notiId) {
      const userId = await this.notificationService.getNotificationById(notiId);
      if (!userId) throw Errors.SaveToDatabaseFail;
    }
    const addressRequest = await addressRental.findOne({
      _id: new mongoose.Types.ObjectId(addressId),
    });
    if (!addressRequest) throw Errors.AddressRentakNotFound;

    return addressRequest;
  };

  public sensorAddressRequest = async (
    addressId: string,
    status: number,
    reason: string,
    inspectorId: string
  ) => {
    let updateObj = {};
    let notification: CreateNotificationInspectorDTO;
    let newAddressRental = [];

    const addressRequest = await addressRental.findOne({
      $and: [{ _id: addressId }, { _status: 0 }],
    });
    if (!addressRequest) throw Errors.AddressRentakNotFound;

    const user = await Users.findOne({ _id: addressRequest._uId });
    if (!user || !user._isHost) throw Errors.UserNotFound;

    if (status === 1) {
      updateObj = {
        ...updateObj,
        _status: 1,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: addressRequest._uId,
        _type: "REGISTER_ADDRESS_SUCCESS",
        _title: "Thông báo xác thực địa chỉ host thành công",
        _message:
          "Thông tin địa chỉ trọ của bạn đã được xác thực. Bạn đã có thể sử dụng địa chỉ này để đăng bài",
      });
      newAddressRental = [...user._addressRental, addressRequest._address];
    } else if (status === 2) {
      updateObj = {
        ...updateObj,
        _status: 2,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: addressRequest._uId,
        _type: "REGISTER_ADDRESS_FAIL",
        _title: "Thông báo xác thực địa chỉ host thất bại",
        _message: `Thông tin địa chỉ của bạn không đúng. Lý do: ${reason}. Vui lòng kiểm tra lại thông tin và thử lại`,
      });
    } else throw Errors.StatusInvalid;

    const updateAddress = await addressRental.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressId) },
      updateObj,
      { new: true }
    );

    if (!updateAddress) throw Errors.SaveToDatabaseFail;

    if (newAddressRental.length > 0) {
      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(addressRequest._uId) },
        { _addressRental: newAddressRental },
        { new: true }
      );
      if (!updateUser) throw Errors.SaveToDatabaseFail;
    }

    const newNotification = await this.notificationService.createNotification(
      notification
    );

    if (!newNotification) throw Errors.SaveToDatabaseFail;

    return updateAddress;
  };

  //Admin
  public getUserList = async (pagination: Pagination) => {
    const count = await Users.countDocuments({ _role: 0 });
    if (count <= 0) throw Errors.UserNotFound;

    const totalPages = Math.ceil(count / pagination.limit);
    const users = await Users.find({ _role: 0 })
      .sort({ _active: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (users.length <= 0) throw Errors.PageNotFound;

    return [
      UserResponsesDTO.toResponse(users),
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getInspectorList = async (pagination: Pagination) => {
    const count = await Users.countDocuments({ _role: 2 });
    if (count <= 0) throw Errors.UserNotFound;

    const totalPages = Math.ceil(count / pagination.limit);
    const inspectors = await Users.find({ _role: 2 })
      .sort({ _active: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (inspectors.length <= 0) throw Errors.PageNotFound;

    return [
      UserResponsesDTO.toResponse(inspectors),
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public createInspector = async (userParam: CreateUserRequestDTO) => {
    const inspector = await Users.findOne({
      $and: [{ _email: userParam._email }, { _role: 2 }, { _active: true }],
    });

    if (inspector) throw Errors.Duplicate;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const newInspector = await Users.create({
      _email: userParam._email,
      _pw: userParam._pw,
      _role: 2,
    });

    return UserResponsesDTO.toResponse(newInspector);
  };

  public blockInspector = async (inspectID: string) => {
    const inspector = await Users.findOne({
      $and: [{ _id: inspectID }, { _role: 2 }],
    });
    if (!inspector) throw Errors.UserNotFound;

    const blockInspector = await Users.findOneAndUpdate(
      { _id: inspectID },
      { _active: !inspector._active },
      { new: true }
    );
    if (!blockInspector) throw Errors.SaveToDatabaseFail;

    return { message: "Block inspector successfully" };
  };

  public getInspectorById = async (inspectId: string) => {
    const inspector = await Users.findOne({
      $and: [{ _id: inspectId }, { _role: 2 }, { _active: true }],
    });
    if (!inspector) throw Errors.UserNotFound;

    const _dob = convertUTCtoLocal(inspector._dob);
    const newInspector = {
      ...inspector.toObject(),
      _dob,
    };

    return UserResponsesDTO.toResponse(newInspector);
  };

  public updatePassInspector = async (userParam: UpdateInspectorPassDTO) => {
    const inspector = await Users.findOne({
      $and: [{ _id: userParam._inspectId }, { _role: 2 }, { _active: true }],
    });
    if (!inspector) throw Errors.UserNotFound;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const updateInspector = await Users.updateOne(
      { _id: userParam._inspectId },
      { _pw: userParam._pw }
    );
    if (updateInspector.modifiedCount <= 0) throw Errors.SaveToDatabaseFail;

    return { message: "Update password successfull" };
  };

  public sensorActiveHostRequestAdmin = async (
    identId: string,
    status: number,
    reason: string,
    inspectorId: string
  ) => {
    let updateObj = {};
    let notification: CreateNotificationInspectorDTO;
    const userIdentity = await Indentities.findOne({
      $and: [{ _id: identId }],
    });
    if (!userIdentity) throw Errors.UserIdentityNotFound;

    if (status === 1) {
      updateObj = {
        ...updateObj,
        _verified: true,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: userIdentity._uId,
        _type: "ACTIVE_HOST_SUCCESS",
        _title: "Thông báo xác thực quyền host thành công",
        _message:
          "Thông tin của bạn đã được xác thực. Bạn đã có thể sử dụng quyền host (Đăng kí địa chỉ, Đăng bài)",
      });
    } else if (status === 2) {
      updateObj = {
        ...updateObj,
        _verified: false,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: userIdentity._uId,
        _type: "ACTIVE_HOST_FAIL",
        _title: "Thông báo xác thực quyền host thất bại",
        _message: `Thông tin của bạn không đúng. Lý do: ${reason}. Vui lòng kiểm tra lại thông tin và thử lại`,
      });
    } else throw Errors.StatusInvalid;

    const updateIdentity = await Indentities.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(identId) },
      updateObj,
      { new: true }
    );

    if (!updateIdentity) throw Errors.SaveToDatabaseFail;

    if (status === 1) {
      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userIdentity._uId) },
        { _isHost: true, _temptHostBlocked: false },
        { new: true }
      );

      if (!updateUser) throw Errors.SaveToDatabaseFail;
    } else {
      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userIdentity._uId) },
        { _isHost: false },
        { new: true }
      );

      if (!updateUser) throw Errors.SaveToDatabaseFail;
    }

    const newNotification = await this.notificationService.createNotification(
      notification
    );

    if (!newNotification) throw Errors.SaveToDatabaseFail;

    return updateIdentity;
  };

  public sensorAddressRequestAdmin = async (
    addressId: string,
    status: number,
    reason: string,
    inspectorId: string
  ) => {
    let updateObj = {};
    let notification: CreateNotificationInspectorDTO;
    let newAddressRental = [];

    const addressRequest = await addressRental.findOne({
      $and: [{ _id: addressId }],
    });
    if (!addressRequest) throw Errors.AddressRentakNotFound;

    const user = await Users.findOne({ _id: addressRequest._uId });
    if (!user || !user._isHost) throw Errors.UserNotFound;

    if (status === 1) {
      updateObj = {
        ...updateObj,
        _status: 1,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: addressRequest._uId,
        _type: "REGISTER_ADDRESS_SUCCESS",
        _title: "Thông báo xác thực địa chỉ host thành công",
        _message:
          "Thông tin địa chỉ trọ của bạn đã được xác thực. Bạn đã có thể sử dụng địa chỉ này để đăng bài",
      });
      newAddressRental = [...user._addressRental, addressRequest._address];
    } else if (status === 2) {
      updateObj = {
        ...updateObj,
        _status: 2,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: addressRequest._uId,
        _type: "REGISTER_ADDRESS_FAIL",
        _title: "Thông báo xác thực địa chỉ host thất bại",
        _message: `Thông tin địa chỉ của bạn không đúng. Lý do: ${reason}. Vui lòng kiểm tra lại thông tin và thử lại`,
      });
      const index = user._addressRental.indexOf(addressRequest._address);
      user._addressRental.splice(index, 1);
      newAddressRental = user._addressRental;
    } else throw Errors.StatusInvalid;

    const updateAddress = await addressRental.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressId) },
      updateObj,
      { new: true }
    );

    if (!updateAddress) throw Errors.SaveToDatabaseFail;

    const updateUser = await Users.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressRequest._uId) },
      { _addressRental: newAddressRental },
      { new: true }
    );
    if (!updateUser) throw Errors.SaveToDatabaseFail;

    const newNotification = await this.notificationService.createNotification(
      notification
    );

    if (!newNotification) throw Errors.SaveToDatabaseFail;

    return updateAddress;
  };

  public getUserByEmailOrId = async (keyword: string) => {
    const checkEmail = keyword.includes("@");

    if (checkEmail) {
      const user = await Users.findOne({ _email: keyword });
      if (!user) throw Errors.UserNotFound;

      return user;
    } else {
      const user = await Users.findOne({ _id: keyword });
      if (!user) throw Errors.UserNotFound;

      return user;
    }
  };

  public getUserBlockedByEmailOrId = async (keyword: string) => {
    const checkEmail = keyword.includes("@");

    if (checkEmail) {
      const user = await UserBlocked.findOne({ _email: keyword });
      if (!user) throw Errors.UserNotFound;

      return user;
    } else {
      const user = await UserBlocked.findOne({ _id: keyword });
      if (!user) throw Errors.UserNotFound;

      return user;
    }
  };

  //Automaticly
  public increaseTotalReported = async (userId: string) => {
    const user = await Users.findOne({ _id: userId });
    if (!user) throw Errors.UserNotFound;

    //Increase total reported
    const totalReported = user._totalReported + 1;
    const updateUser = await Users.findOneAndUpdate(
      { _id: userId },
      { _totalReported: totalReported },
      { new: true }
    );
    if (!updateUser) throw Errors.SaveToDatabaseFail;

    return true;
  };

  public blockUser = async (userId: string) => {
    const user = await Users.findOne({ _id: userId });
    if (!user) throw Errors.UserNotFound;

    const identity = await Indentities.findOne({ _uId: userId });
    if (!identity) throw Errors.UserIdentityNotFound;

    //Block user
    const updateUser = await Users.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { _isHost: false, _temptHostBlocked: false },
      { new: true }
    );
    if (!updateUser) throw Errors.SaveToDatabaseFail;

    //Create block user
    const userBlock = await UserBlocked.create({
      _uId: new mongoose.Types.ObjectId(userId),
      _idCard: identity._idCard,
      _email: user._email,
      _phone: user._phone,
      _reason: "Có 3 bài viết bị báo cáo",
    });
    if (!userBlock) throw Errors.SaveToDatabaseFail;

    //create notification for user
    const notification = CreateNotificationDTO.fromService({
      _uId: new mongoose.Types.ObjectId(userId),
      _type: "BLOCK_USER",
      _title: "Thông báo khóa tài khoản",
      _message: `Tài khoản của bạn đã bị khóa chức năng host do có 3 bài viết bị báo cáo. Vui lòng liên hệ với admin nếu có sai sót`,
    });
    const newNotification = await this.notificationService.createNotification(
      notification
    );
    if (!newNotification) throw Errors.SaveToDatabaseFail;

    return userBlock;
  };

  // public sendSMS = async (
  //   phones: string[],
  //   content: string,
  //   type: number,
  //   sender: string
  // ) => {
  //   client.verify.v2
  //     .services(process.env.TWILIO_VERIFY_SID)
  //     .verifications.create({ to: "+84818492109", channel: "sms" })
  //     .then((verification) => console.log(verification));
  // };

  // public verifySMS = async (phone: string, code: string) => {
  //   client.verify.v2
  //     .services(process.env.TWILIO_VERIFY_SID)
  //     .verificationChecks.create({ to: "+84818492109", code: "2922" })
  //     .then((verification_check) => console.log(verification_check.valid));
  // };
}
