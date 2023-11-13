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
  SaveToDatabaseFail: new ErrorModel(
    "Save data is failed!",
    "saveToDatabaseFail",
    500
  ),

  FileSizeExceedLimit: new ErrorModel(
    "File size exceeds 10MB",
    "FILE_SIZE_EXCEED_LIMIT",
    400
  ),
  FileCountExceedLimit: new ErrorModel(
    "The number of files greater than 10 images",
    "FILE_COUNT_EXCEED_LIMIT",
    400
  ),

  FileIsNotImage: new ErrorModel(
    "This file is not an image",
    "FILE_IS_NOT_IMAGE",
    400
  ),

  UploadImageFail: new ErrorModel(
    "Upload images is fail",
    "UPLOAD_IMAGES_FAIL",
    400
  ),

  FileNotFound: new ErrorModel("File not found!", "FILE_NOTFOUND", 404),

  FnameNotFound: new ErrorModel("Firstname not found!", "FNAME_NOTFOUND", 404),
  FnameInvalid: new ErrorModel("Firstname invalid!", "FNAME_INVALID", 404),

  LnameNotFound: new ErrorModel("Lastname not found!", "LNAME_NOTFOUND", 404),
  LnameInvalid: new ErrorModel("Lastname invalid!", "LNAME_INVALID", 404),

  PwNotFound: new ErrorModel("Password not found!", "PASSWORD_NOTFOUND", 400),

  PwInvalid: new ErrorModel("Password invalid!", "PASSWORD_INVALID", 400),

  PwconfirmNotFound: new ErrorModel(
    "Password Confirm not found!",
    "PASSWORD_CONFIRM_NOTFOUND",
    400
  ),

  PwconfirmInvalid: new ErrorModel(
    "Password Confirm invalid!",
    "PASSWORD_CONFIRM_INVALID",
    400
  ),

  NameNotFound: new ErrorModel("Name not found!", "NAME_NOTFOUND", 400),

  NameInvalid: new ErrorModel("Name invalid!", "NAME_INVALID", 400),

  EmailNotFound: new ErrorModel("Email not found!", "EMAIL_NOTFOUND", 400),

  EmailInvalid: new ErrorModel("Emailname invalid!", "EMAIL_INVALID", 400),

  GenderInvalid: new ErrorModel("Gendername invalid!", "genderInvalid", 400),

  PhonenumberInvalid: new ErrorModel(
    "Phonenumber invalid!",
    "PHONENUMBER_INVALID",
    400
  ),
  PhonenumberDuplicate: new ErrorModel(
    "Phonenumber duplicate!",
    "PHONENUMBER_DUPLICATE",
    400
  ),

  DOBInvalid: new ErrorModel("DOB invalid!", "DOB_INVALID", 400),

  AddressInvalid: new ErrorModel("Address invalid!", "ADDRESS_INVALID", 400),

  ProfileurlInvalid: new ErrorModel(
    "Profileurl invalid!",
    "PROFILEURL_INVALID",
    400
  ),

  Duplicate: new ErrorModel("Email is duplicated", "DUPLICATED", 400),

  UserNotFound: new ErrorModel("User not found!", "USER_NOTFOUND", 404),

  UserIsHosted: new ErrorModel("User is a host!", "USER_ISHOSTED", 400),

  PageNotFound: new ErrorModel("Page not found!", "PAGE_NOTFOUND", 404),

  Unauthorized: new ErrorModel(
    "User does not have authorization",
    "UNAUTHORIZED",
    401
  ),
  ErrorToken: new ErrorModel("Token is invalid", "ERROR_TOKEN", 403),

  ExpiredToken: new ErrorModel("Token is expired", "EXPIRED_TOKEN", 400),

  FailSendEmail: new ErrorModel("Fail send email", "FAIL_SEND_EMAIL", 400),

  OtpDuplicate: new ErrorModel("User had an otp", "OTP_DUPLICATED", 400),

  ResetPassFail: new ErrorModel(
    "Reset password fail",
    "RESET_PASSWORD_FAIL",
    400
  ),

  ExpiredOtp: new ErrorModel("OTP is expired", "EXPIRED_OTP", 400),

  //Errors for Post
  PostNotFound: new ErrorModel("Post not found!", "POST_NOTFOUND", 404),
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
        console.log(error.property);
        return Errors[`${UpCase(error.property)}Invalid`];
      }
    }
  }
};

export default erroHandler;
