import { Inject, Service } from "typedi";
import { UserService } from "./user.service";
import { BodyResquest } from "../../base/base.request";
import { CreateUserRequestDTO } from "./dtos/user-create.dto";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";

@Service()
export class UserController {
  constructor(@Inject() private userService: UserService) {}

  public registor = async (
    req: BodyResquest<CreateUserRequestDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const infoUser = CreateUserRequestDTO.fromReqest(req)
        const newUser = await this.userService.createNewUser(infoUser)

        res.json(new ResponseData(newUser, null, null))
    } catch (error) {
        console.log(error)
        next(error)
    }
  };

  public activeHost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const newUser = await this.userService.activeHost(req.body.userId)
        res.json(new ResponseData(newUser, null, null))
    } catch (error) {
        console.log(error)
        next(error)
    }
  };

  public verifyHost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const updatedUser = await this.userService.verifyHost(req.body.userId, req.body.otp)
        res.json(new ResponseData(updatedUser, null, null))
    } catch (error) {
        console.log(error)
        next(error)
    }
  };

  public resetOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const newUser = await this.userService.resetOTP(req.body.userId)
        res.json(new ResponseData(newUser, null, null))
    } catch (error) {
        console.log(error)
        next(error)
    }
  };
}
