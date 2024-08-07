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
  UserIsBlocked: new ErrorModel("User is blocked!", "USER_IS_BLOCKED", 400),
  
  SaveToDatabaseFail: new ErrorModel(
    "Save data is failed!",
    "SAVE_TO_DATABASE_FAIL",
    500
  ),

  PayingCancled: new ErrorModel(
    "Paying is cancled!",
    "PAYING_CANCLED",
    400
  ),

  PostExceedLimit: new ErrorModel(
    "Posts is exceed limit!",
    "POST_EXCEED_LIMIT",
    400
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
  MessagesNotFound: new ErrorModel("Messages not found!", "MESSAGES_NOTFOUND", 404),
  IdNotFound: new ErrorModel("Id not found!", "Id_NOTFOUND", 404),

  FnameNotFound: new ErrorModel("Firstname not found!", "FNAME_NOTFOUND", 404),
  FnameInvalid: new ErrorModel("Firstname invalid!", "FNAME_INVALID", 404),

  LnameNotFound: new ErrorModel("Lastname not found!", "LNAME_NOTFOUND", 404),
  LnameInvalid: new ErrorModel("Lastname invalid!", "LNAME_INVALID", 404),

  PwNotFound: new ErrorModel("Password not found!", "PASSWORD_NOTFOUND", 400),

  PwInvalid: new ErrorModel("Password invalid!", "PASSWORD_INVALID", 400),

  OldpwNotFound: new ErrorModel(
    "Old-Password not found!",
    "OLD_PASSWORD_NOTFOUND",
    400
  ),

  OldpwInvalid: new ErrorModel(
    "Old-Password invalid!",
    "OLD_PASSWORD_INVALID",
    400
  ),

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

  EmailNotVerified: new ErrorModel("Email is not verified!", "EMAIL_NOT_VERIFIED", 400),

  GenderInvalid: new ErrorModel("Gendername invalid!", "GENDER_INVALID", 400),

  PhoneInvalid: new ErrorModel(
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
  ExpiredRefreshToken: new ErrorModel(
    "Refresh Token is expired",
    "EXPIRED_REFRESH_TOKEN",
    400
  ),

  FailSendEmail: new ErrorModel("Fail send email", "FAIL_SEND_EMAIL", 400),

  OtpDuplicate: new ErrorModel("User had an otp", "OTP_DUPLICATED", 400),

  ResetPassFail: new ErrorModel(
    "Reset password fail",
    "RESET_PASSWORD_FAIL",
    400
  ),

  ExpiredOtp: new ErrorModel("OTP is expired", "EXPIRED_OTP", 400),
  OtpInvalid: new ErrorModel("OTP is invalid", "OTP_INVALID", 400),

  //Errors for Post
  PostNotFound: new ErrorModel("Post not found!", "POST_NOTFOUND", 404),
  PostIdNotFound: new ErrorModel("Post ID not found!", "POST_ID_NOTFOUND", 404),

  PostFavoriteNotFound: new ErrorModel(
    "User doesn't have any favorite posts!",
    "POST_FAVORITE_NOTFOUND",
    404
  ),

  ReportedPostNotFound: new ErrorModel(
    "Reported Post not found!",
    "REPORTED_POST_NOTFOUND",
    404
  ),

  TitleNotFound: new ErrorModel("Title not found!", "TITLE_NOTFOUND", 404),

  TitleInvalid: new ErrorModel("Title invalid!", "TITLE_INVALID", 400),

  ImagesNotFound: new ErrorModel("Image not found!", "IMAGE_NOTFOUND", 404),

  ImagesInvalid: new ErrorModel("Image invalid!", "IMAGE_INVALID", 400),

  ContentNotFound: new ErrorModel(
    "Content not found!",
    "CONTENT_NOTFOUND",
    404
  ),

  ContentInvalid: new ErrorModel("Content invalid!", "CONTENT_INVALID", 400),

  DescNotFound: new ErrorModel(
    "Description not found!",
    "DESCRIPTION_NOTFOUND",
    404
  ),

  DescInvalid: new ErrorModel(
    "Description invalid!",
    "DESCRIPTION_INVALID",
    400
  ),

  StreetNotFound: new ErrorModel("Street not found!", "STREET_NOTFOUND", 404),

  StreetInvalid: new ErrorModel("Street invalid!", "STREET_INVALID", 400),

  DistrictNotFound: new ErrorModel(
    "District not found!",
    "DISTRICT_NOTFOUND",
    404
  ),

  DistrictInvalid: new ErrorModel("District invalid!", "DISTRICT_INVALID", 400),

  AreaNotFound: new ErrorModel("Area not found!", "AREA_NOTFOUND", 404),

  AreaInvalid: new ErrorModel("Area invalid!", "AREA_INVALID", 400),

  PriceNotFound: new ErrorModel("Price not found!", "PRICE_NOTFOUND", 404),

  PriceInvalid: new ErrorModel("Price invalid!", "PRICE_INVALID", 400),

  ElectricPriceNotFound: new ErrorModel(
    "ElectricPrice not found!",
    "ELECTRICPRICE_NOTFOUND",
    404
  ),

  ElectricPriceInvalid: new ErrorModel(
    "ElectricPrice invalid!",
    "ELECTRICPRICE_INVALID",
    400
  ),

  WaterPriceNotFound: new ErrorModel(
    "WaterPrice not found!",
    "WATERPRICE_NOTFOUND",
    404
  ),

  WaterPriceInvalid: new ErrorModel(
    "WaterPrice invalid!",
    "WATERPRICE_INVALID",
    400
  ),

  TagsInvalid: new ErrorModel("Tags invalid!", "TAGS_INVALID", 400),

  CityInvalid: new ErrorModel("City invalid!", "CITY_INVALID", 400),

  ServicesInvalid: new ErrorModel("Services invalid!", "SERVICES_INVALID", 400),

  UtilitiesInvalid: new ErrorModel(
    "Utilities invalid!",
    "UTILITIES_INVALID",
    400
  ),

  StatusInvalid: new ErrorModel("Status invalid!", "STATUS_INVALID", 400),

  ActiveNotFound: new ErrorModel("Active not found!", "ACTIVE_NOTFOUND", 404),

  ActiveInvalid: new ErrorModel("Active invalid!", "ACTIVE_INVALID", 400),

  IsRentedInvalid: new ErrorModel("IsRented invalid!", "ISRENTED_INVALID", 400),

  ReportedPostExist: new ErrorModel(
    "Reported Post existed!",
    "REPORTED_POST_EXIST",
    400
  ),

  //Error for Tag
  TagNotFound: new ErrorModel("Tag not found!", "TAG_NOTFOUND", 404),

  TagInvalid: new ErrorModel("Tag invalid!", "TAG_INVALID", 400),

  TagDuplicated: new ErrorModel("Tag duplicated!", "TAG_DUPLICATED", 400),

  TypeInvalid: new ErrorModel("Type invalid!", "TYPE_INVALID", 400),

  NotificationNotFound: new ErrorModel(
    "Notification not found!",
    "NOTIFICATION_NOTFOUND",
    404
  ),

  //Error for Indentity
  UserIdentityNotFound: new ErrorModel(
    "Identity of user not found!",
    "USER_IDENTITY_NOTFOUND",
    404
  ),
  ParametersInvalid: new ErrorModel(
    "Invalid Parameters or Values!",
    "PARAMETERS_VALUES_INVALID",
    400
  ),
  CroppingFailed: new ErrorModel("Failed in cropping!", "CROPPING_FAILED", 400),
  IDCardNotFound: new ErrorModel(
    "Unable to find ID card in the image!",
    "IDCARD_NOTFOUND",
    400
  ),
  IDCardDuplicate: new ErrorModel(
    "ID Card is duplicated!",
    "IDCARD_DUPLICATE",
    400
  ),
  UrlRequestNotFound: new ErrorModel(
    "No URL in the request!",
    "URL_REQUEST_NOTFOUND",
    404
  ),
  UrlRequestCanNotOpen: new ErrorModel(
    "Failed to open the URL!",
    "URL_REQUEST_CAN_NOT_OPEN",
    400
  ),
  ImageInvalid: new ErrorModel("Invalid image file!", "IMAGE_INVALID", 400),
  BadData: new ErrorModel("Bad data!", "BAD_DATA", 400),
  StringBase64NotFound: new ErrorModel(
    "No string base64 in the request",
    "STRING_BASE64_NOT_FOUND",
    400
  ),
  StringBase64Invalid: new ErrorModel(
    "String base64 is not valid!",
    "STRING_BASE64_INVALID",
    400
  ),
  IdentIdNotFound: new ErrorModel(
    "IdentId not found!",
    "IDENTID_NOTFOUND",
    404
  ),
  StatusNotFound: new ErrorModel("Status not found!", "STATUS_NOTFOUND", 404),
  ReasonNotFound: new ErrorModel("Reason not found!", "REASON_NOTFOUND", 404),
  ReasonInvalid: new ErrorModel("Reason invalid!", "REASON_INVALID", 400),

  //Error for Address Rental
  AddressRentakNotFound: new ErrorModel(
    "Address rental not found!",
    "ADDRESS_RENTAL_NOTFOUND",
    404
  ),

  //Error for Statistic
  YearInvalid : new ErrorModel("Year invalid!", "YEAR_INVALID", 400),

  //Error for Comment
  CommentNotFound: new ErrorModel("Comment not found!", "COMMENT_NOTFOUND", 404),
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
    console.log(
      "🚀 ~ file: handle-errors.ts:262 ~ handleErrorOfValidation ~ keyError:",
      keyError
    );
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
