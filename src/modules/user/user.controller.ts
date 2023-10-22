import { Inject, Service } from "typedi";
import { UserService } from "./user.service";
import { BodyResquest } from "../../base/base.request";
import { CreateUserRequestDTO } from "./dtos/user-create.dto";
import { NextFunction, Response } from "express";
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
}
