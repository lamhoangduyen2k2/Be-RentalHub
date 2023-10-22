import Container, { Service } from "typedi";
import { CreateUserRequestDTO, SendMailDTO } from "./dtos/user-create.dto";
import Users from "./users.model";
import { Errors } from "../../helpers/handle-errors";
import { generate } from "otp-generator";
import { OTPService } from "../otp/otp.service";
import OTP from "../otp/otp.model";

@Service()
export class UserService {
  otpService = Container.get(OTPService);
  //Registor
  createNewUser = async (userParam: CreateUserRequestDTO) => {
    const user = await Users.findOne({
      _email: userParam._email,
    });

    if (user) throw Errors.Duplicate;

    const newUser = await Users.create(userParam);

    return newUser;
  };

  activeHost = async (userId: string) => {
    try {
      const user = await Users.findById(userId);

      if (!user) throw Errors.UserNotFound;
      if (user._isHost) throw Errors.UserIsHosted;

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

      return true;
    } catch (error) {
      return error;
    }
  };

  verifyHost = async (userId: string, otp: string) => {
    try {
      const checkOTP = OTP.findOne({ $and: [{ _uId: userId }, { _otp: otp }] });

      if (!checkOTP) throw Errors.ExpiredOtp;

      const newUser = await Users.findByIdAndUpdate(
        userId,
        { _isHost: true },
        { new: true }
      );

      if (!newUser) Errors.SaveToDatabaseFail;

      return newUser;
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
      await OTP.deleteOne({ _uId: userId })

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
