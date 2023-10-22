import { Service } from "typedi";
import { CreateUserRequestDTO } from "./dtos/user-create.dto";
import Users from "./users.model";
import { Errors } from "../../helpers/handle-errors";

@Service()
export class UserService {
  //Registor
  createNewUser = async (userParam: CreateUserRequestDTO) => {
    const user = await Users.findOne({
      _email: userParam._email,
    });

    if (user) throw Errors.Duplicate

    const newUser = await Users.create(userParam)

    return newUser
  };
}
