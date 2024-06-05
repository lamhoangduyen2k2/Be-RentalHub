import { Inject, Service } from "typedi";
import { UserService } from "./user.service";
import { BodyResquest } from "../../base/base.request";
import { CreateUserRequestDTO } from "./dtos/user-create.dto";
import { NextFunction, Request, Response } from "express";
import { Pagination, ResponseData } from "../../helpers/response";
import { UserHostedDTO } from "./dtos/user-active-host.dto";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { UserUpdateEmailOrPassDTO } from "./dtos/user-update-email-pass.dto";
import { UpdateInspectorPassDTO } from "./dtos/inspector-update-pass.dto";
import { UpdateInspectorPasswordDTO } from "./dtos/update-password-inspector.dto";
import { SensorIdenityDTO } from "./dtos/sensor-identity.dto";
import { UpdateAddressDTO } from "./dtos/update-address.dto";
import { startSession } from "mongoose";
import { CreateAddressDTO } from "./dtos/create-address.dto";

@Service()
export class UserController {
  constructor(@Inject() private userService: UserService) {}

  //Customer
  public registor = async (
    req: BodyResquest<CreateUserRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const infoUser = CreateUserRequestDTO.fromRequest(req);
      const newUser = await this.userService.createNewUser(infoUser);

      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public registorUser = async (
    req: BodyResquest<CreateUserRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession( { defaultTransactionOptions: { readConcern: { level: "majority" }, writeConcern: { w: "majority" } } });
    try {
      const infoUser = CreateUserRequestDTO.fromRequest(req);
      session.startTransaction();
      const newUser = await this.userService.registorUser(infoUser, session);

      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public verifyUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const newUser = await this.userService.verifyRegistor(
        req.body._email,
        req.body.otp,
        session
      );

      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const email = await this.userService.forgotPass(
        req.body._email,
        req.body.url
      );

      res.json(new ResponseData(email, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const email = await this.userService.resetPassword(
        req.params.id,
        req.params.token,
        req.body._pw,
        req.body._pwconfirm,
        session
      );

      res.json(new ResponseData(email, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally { 
      session.endSession();
    }
  };

  public updateUserProfile = async (
    req: BodyResquest<UpdateUserDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const inforUser = UpdateUserDTO.fromRequest(req);
      session.startTransaction();
      const updatedUser = await this.userService.updateUser(inforUser, session);

      res.json(new ResponseData(updatedUser, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public updateUserAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const file = req.file as Express.Multer.File;
      session.startTransaction();
      const updatedUser = await this.userService.updateAvatar(
        file,
        req.body._uId,
        session
      );

      res.json(new ResponseData(updatedUser, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public updateEmailOrPass = async (
    req: BodyResquest<UserUpdateEmailOrPassDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const userInfo = UserUpdateEmailOrPassDTO.fromRequest(req);
      session.startTransaction();
      const newEmail = await this.userService.updateEmail(userInfo, session);

      res.json(new ResponseData(newEmail, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log(
        "🚀 ~ file: user.controller.ts:77 ~ UserController ~ error:",
        error
      );
      next(error);
    } finally {
      session.endSession();
    }
  };

  public activeHost = async (
    req: BodyResquest<UserHostedDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userInfo = UserHostedDTO.fromRequest(req);
      const newUser = await this.userService.activeHost(userInfo);
      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public verifyHost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const updatedUser = await this.userService.verifyHost(
        req.body._uId,
        req.body.phone,
        req.body.otp,
        session
      );
      res.json(new ResponseData(updatedUser, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public verifyIndentity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const image_front = req.files["image_front"][0] as Express.Multer.File;
      const image_back = req.files["image_back"][0] as Express.Multer.File;
      session.startTransaction();
      const identity = await this.userService.verifyIdentity(
        req.body._uId,
        image_front,
        image_back,
        session
      );
      res.json(new ResponseData(identity, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public registerAddress = async (
    req: BodyResquest<CreateAddressDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const image = req.files as Express.Multer.File[];
      const adrressInfo = CreateAddressDTO.fromRequest(req);
      session.startTransaction();
      const address = await this.userService.registerAddress(
        adrressInfo,
        image,
        session
      );

      res.json(new ResponseData(address, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    } 
    finally {
      session.endSession();
    }
  };

  public resetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newUser = await this.userService.resetOTP(req.body._uId);
      res.json(new ResponseData(newUser, null, null));
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = await this.userService.getUserById(
        req.query.uId.toString()
      );
      res.json(new ResponseData(inforUser, null, null));
    } catch (error) {
      next(error);
    }
  };

  public getUserNotDetailById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = await this.userService.getUserNotDetailById(
        req.query.userId.toString()
      );
      res.json(new ResponseData(inforUser, null, null));
    } catch (error) {
      next(error);
    }
  };

  public getAddressByStatusUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const address = await this.userService.getAddressesByStatusUser(
        req.body._uId,
        req.query.status ? Number(req.query.status) : -1,
        pagination
      );
      res.json(new ResponseData(address[0], null, address[1]));
    } catch (error) {
      next(error);
    }
  };

  public getAddressByIdUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const address = await this.userService.getAddressByIdUser(
        req.query.addressId.toString(),
        req.body._uId
      );
      res.json(new ResponseData(address, null, null));
    } catch (error) {
      next(error);
    }
  };

  public manageStatusOfAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const status = isNaN(Number(req.body.status))
        ? -1
        : Number(req.body.status);
      session.startTransaction();
      const updatedAddress = await this.userService.manageSatusOfAddressUser(
        status,
        req.body._uId,
        req.body.addressId,
        session
      );
      res.json(new ResponseData(updatedAddress, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public updateAddress = async (
    req: BodyResquest<UpdateAddressDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const addressInfo = UpdateAddressDTO.fromRequest(req);
      const cef = req.files as Express.Multer.File[];
      session.startTransaction();
      const updatedAddress = await this.userService.updateAddress(
        cef,
        addressInfo,
        session
      );
      res.json(new ResponseData(updatedAddress, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public getIdentityUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const identity = await this.userService.getIdentityUser(req.body._uId);
      res.json(new ResponseData(identity, null, null));
    } catch (error) {
      next(error);
    }
  };

  //Inspector
  public getUserList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagnantion = Pagination.getPagination(req);
      const inforUsers = await this.userService.getUserList(pagnantion);
      res.json(new ResponseData(inforUsers[0], null, inforUsers[1]));
    } catch (error) {
      next(error);
    }
  };

  public getActiveHostInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const activeHosts = await this.userService.getActiveHostRequestsByStatus(
        isNaN(Number(req.query.status)) ? -1 : Number(req.query.status),
        pagination
      );
      res.json(new ResponseData(activeHosts[0], null, activeHosts[1]));
    } catch (error) {
      next(error);
    }
  };

  public getActiveHostByIdInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const activeHost = await this.userService.getActiveHostRequestById(
        req.query.userId.toString(),
        req.query.notiId ? req.query.notiId.toString() : null
      );
      res.json(new ResponseData(activeHost, null, null));
    } catch (error) {
      next(error);
    }
  };

  public sensorActiveHostRequest = async (
    req: BodyResquest<SensorIdenityDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const sensorInfo = SensorIdenityDTO.fromRequest(req);
      session.startTransaction();
      const updatedHost = await this.userService.sensorActiveHostRequest(
        sensorInfo.id,
        isNaN(Number(sensorInfo.status)) ? -1 : Number(sensorInfo.status),
        sensorInfo.reason,
        sensorInfo._uId,
        session
      );
      res.json(new ResponseData(updatedHost, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public getInspectorList = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const inforInspectors = await this.userService.getInspectorList(
        pagination
      );
      res.json(new ResponseData(inforInspectors[0], null, inforInspectors[1]));
    } catch (error) {
      next(error);
    }
  };

  public getAddressRequestsByStatusInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pagination = Pagination.getPagination(req);
      const addressRequests = await this.userService.getAddressRequestsByStatus(
        isNaN(Number(req.query.status)) ? -1 : Number(req.query.status),
        pagination
      );
      res.json(new ResponseData(addressRequests[0], null, addressRequests[1]));
    } catch (error) {
      next(error);
    }
  };

  public getAddressRequestByIdInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const addressRequest = await this.userService.getAddressRequestById(
        req.query.addressId.toString(),
        req.query.notiId ? req.query.notiId.toString() : null
      );
      res.json(new ResponseData(addressRequest, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public sensorAddressRequestInspector = async (
    req: BodyResquest<SensorIdenityDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const sensorInfo = SensorIdenityDTO.fromRequest(req);
      session.startTransaction();
      const updatedAddress = await this.userService.sensorAddressRequest(
        sensorInfo.id,
        isNaN(Number(sensorInfo.status)) ? -1 : Number(sensorInfo.status),
        sensorInfo.reason,
        sensorInfo._uId,
        session
      );
      res.json(new ResponseData(updatedAddress, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  //Admin
  public createInspector = async (
    req: BodyResquest<CreateUserRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const infoUser = CreateUserRequestDTO.fromRequest(req);
      session.startTransaction();
      const newInspector = await this.userService.createInspector(infoUser, session);

      res.json(new ResponseData(newInspector, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public blockInspector = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      session.startTransaction();
      const updatedInspector = await this.userService.blockInspector(
        req.body.inspectId.toString() ?? null,
        session
      );
      res.json(new ResponseData(updatedInspector, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public getInspectorByIdAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforInspector = await this.userService.getInspectorById(
        req.query.inspectId.toString() ?? null
      );
      res.json(new ResponseData(inforInspector, null, null));
    } catch (error) {
      next(error);
    }
  };

  public updateInspectorPass = async (
    req: BodyResquest<UpdateInspectorPassDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const userInfo = UpdateInspectorPassDTO.fromRequest(req);
      session.startTransaction();
      const newPass = await this.userService.updatePassInspector(userInfo, session);
      res.json(new ResponseData(newPass, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public updateInspectorProfile = async (
    req: BodyResquest<UpdateUserDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const inforInspector = UpdateUserDTO.fromRequest(req);
      session.startTransaction();
      const updatedUser = await this.userService.updateInspectorProfile(
        inforInspector,
        session
      );
      res.json(new ResponseData(updatedUser, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public updateInspectorAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const file = req.file as Express.Multer.File;
      session.startTransaction();
      const updatedInspector = await this.userService.updateInspectorAvatar(
        file,
        req.body._uId,
        session
      );

      res.json(new ResponseData(updatedInspector, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public getInspectorById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforInspector = await this.userService.getInspectorById(
        req.body._uId
      );
      res.json(new ResponseData(inforInspector, null, null));
    } catch (error) {
      next(error);
    }
  };

  public updateInspectorPassword = async (
    req: BodyResquest<UpdateInspectorPasswordDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const userInfo = UpdateInspectorPasswordDTO.fromRequest(req);
      session.startTransaction();
      const newPass = await this.userService.updatePasswordInspector(userInfo, session);

      res.json(new ResponseData(newPass, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    } finally {
      session.endSession();
    }
  };

  public sensorActiveHostRequestAdmin = async (
    req: BodyResquest<SensorIdenityDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const sensorInfo = SensorIdenityDTO.fromRequest(req);
      session.startTransaction();
      const updatedHost = await this.userService.sensorActiveHostRequestAdmin(
        sensorInfo.id,
        isNaN(Number(sensorInfo.status)) ? -1 : Number(sensorInfo.status),
        sensorInfo.reason,
        sensorInfo._uId,
        session
      );
      res.json(new ResponseData(updatedHost, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public sensorAddressRequestAdmin = async (
    req: BodyResquest<SensorIdenityDTO>,
    res: Response,
    next: NextFunction
  ) => {
    const session = await startSession();
    try {
      const sensorInfo = SensorIdenityDTO.fromRequest(req);
      session.startTransaction();
      const updatedAddress = await this.userService.sensorAddressRequestAdmin(
        sensorInfo.id,
        isNaN(Number(sensorInfo.status)) ? -1 : Number(sensorInfo.status),
        sensorInfo.reason,
        sensorInfo._uId,
        session
      );

      res.json(new ResponseData(updatedAddress, null, null));
    } catch (error) {
      await session.abortTransaction();
      console.log("🚀 ~ UserController ~ error:", error)
      next(error);
    } finally {
      session.endSession();
    }
  };

  public getUserByEmailOrId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = await this.userService.getUserByEmailOrId(
        req.query.keyword.toString().trim()
      );
      res.json(new ResponseData(inforUser, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public getHostByEmailOrId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = await this.userService.getHostByEmailOrId(
        req.query.keyword.toString().trim()
      );
      res.json(new ResponseData(inforUser, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public getEmployeeByEmailOrId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = await this.userService.getEmployeeByEmailOrId(
        req.query.keyword.toString().trim()
      );
      res.json(new ResponseData(inforUser, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public getUserBlockedByEmailOrId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const inforUser = await this.userService.getUserBlockedByEmailOrId(
        req.query.keyword.toString()
      );
      res.json(new ResponseData(inforUser, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  //Admin and Inspector
  public searchIdenity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const numberCard = req.query.numberCard.toString().trim();
      const sensor = /true/i.test(req.query.sensor.toString()) ? true : false;
      const identity = await this.userService.searchIdentity(
        numberCard,
        sensor
      );
      res.json(new ResponseData(identity, null, null));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  public searchAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const keyword = req.query.keyword.toString().trim();
      const active = /true/i.test(req.query.active.toString()) ? true : false;
      const pagination = Pagination.getPagination(req);
      const addressInfo = await this.userService.searchAddress(
        keyword,
        active,
        pagination
      );
      res.json(new ResponseData(addressInfo[0], null, addressInfo[1]));
    } catch (error) {
      console.log("🚀 ~ UserController ~ error:", error);
      next(error);
    }
  };

  // public sendSMS = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const updatedUser = await this.userService.sendSMS(
  //       ["84818492109"],
  //       "test noi dung sms",
  //       2,
  //       "84818492109"
  //     );
  //     res.json(new ResponseData(updatedUser, null, null));
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // public verifySMS = async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const updatedUser = await this.userService.verifySMS(
  //       req.body.phone,
  //       req.body.otp
  //     );
  //     res.json(new ResponseData(updatedUser, null, null));
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}
