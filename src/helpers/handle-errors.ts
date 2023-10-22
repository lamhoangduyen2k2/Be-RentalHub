import { NextFunction, Request, Response } from "express";
import { ResponseData } from "./response";
import { ValidationError } from "class-validator";
import { UpCase } from "./ultil";

export class ErrorModel extends Error {
  message: string;
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super();
    this.message = message;
    this.code = code;
    this.status = status;
  }
}

export const Errors = {
  SaveToDatabaseFail: new ErrorModel("Save data is failed!", "saveToDatabaseFail", 500),

  FileNotFound: new ErrorModel("File not found!", "fileNotFound", 404),

  FnameNotFound: new ErrorModel("Firstname not found!", "fnameNotFound", 404),
  FnameInvalid: new ErrorModel("Firstname invalid!", "fnameInvalid", 404),

  LnameNotFound: new ErrorModel("Lastname not found!", "lnameNotFound", 404),
  LnameInvalid: new ErrorModel("Lastname invalid!", "lnameInvalid", 404),

  PasswordNotFound: new ErrorModel(
    "Password not found!",
    "passwordNotFound",
    400
  ),

  PasswordInvalid: new ErrorModel("Password invalid!", "passwordInvalid", 400),

  PwdNotFound: new ErrorModel("Password not found!", "pwNotFound", 400),

  PwInvalid: new ErrorModel("Password invalid!", "pwInvalid", 400),

  NameNotFound: new ErrorModel("Name not found!", "nameNotFound", 400),

  NameInvalid: new ErrorModel("Name invalid!", "nameInvalid", 400),

  EmailNotFound: new ErrorModel("Email not found!", "emailNotFound", 400),

  EmailInvalid: new ErrorModel("Emailname invalid!", "emailInvalid", 400),

  GenderInvalid: new ErrorModel("Gendername invalid!", "genderInvalid", 400),

  PhonenumberInvalid: new ErrorModel(
    "Phonenumber invalid!",
    "phonenumberInvalid",
    400
  ),

  DOBInvalid: new ErrorModel("DOB invalid!", "dobInvalid", 400),

  AddressInvalid: new ErrorModel("Address invalid!", "addressInvalid", 400),

  ProfileurlInvalid: new ErrorModel(
    "Profileurl invalid!",
    "profileurlInvalid",
    400
  ),

  Duplicate: new ErrorModel("Email is duplicated", "duplicated", 400),

  UserNotFound: new ErrorModel("User not found!", "userNotFound", 404),

  UserIsHosted: new ErrorModel("User is a host!", "userIsHosted", 400),

  PageNotFound: new ErrorModel("Page not found!", "pageNotFound", 404),

  Unauthorized: new ErrorModel(
    "User does not have authorization",
    "unauthorized",
    401
  ),
  ErrorToken: new ErrorModel("Token is invalid", "errorToken", 403),

  ExpiredToken: new ErrorModel("Token is expired", "expiredToken", 400),

  FailSendEmail: new ErrorModel("Fail send email", "failSendEmail", 400),

  OtpDuplicate: new ErrorModel("User had an otp", "otpDuplicate", 400),

  ResetPassFail: new ErrorModel("Reset password fail", "resetPassFail", 400),

  ExpiredOtp: new ErrorModel("OTP is expired", "expiredOtp", 400),
};

//Global error handler
function erroHandler(
  error: ErrorModel,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (error instanceof ErrorModel) {
    res.status(error.status).json(new ResponseData(null, error, null));
  } else {
    console.log(error);
    res.status(500).json({ message: "System error!" });
  }
}

export const handleErrorOfValidation = (errors: ValidationError[]) => {
  const error = errors[0];
  for (const keyError in error.constraints) {
    if (keyError === "isNotEmpty") {
      console.log(UpCase(error.property));
      return Errors[`${UpCase(error.property)}NotFound`];
    } else {
      {
        //console.log(error.property);
        return Errors[`${UpCase(error.property)}Invalid`];
      }
    }
  }
};

export default erroHandler;
