import { compare } from "bcrypt";
import { Errors } from "../../helpers/handle-errors";
import Users from "../user/users.model";
import { LoginRequestDTO } from "./dtos/auth-login.dto";
import { verify } from "jsonwebtoken";
import RefreshTokens from "../token/refresh.model";
import { Service } from "typedi";
import tokenService from "../token/token.service";
import { UserResponsesDTO } from "../user/dtos/user-response.dto";

@Service()
export class AuthService {
  loginService = async (loginParam: LoginRequestDTO) => {
    const users = await Users.findOne({
      $and: [{ _email: loginParam._email }, { _active: true }, { _role: 0 }],
    });

    if (!users) throw Errors.UserNotFound;

    const isValid = await compare(loginParam._password, users._pw);

    if (!isValid) throw Errors.PwInvalid;

    const token = await tokenService.createTokenByLogin(
      users._id.toString(),
      3600
    );

    return { ...UserResponsesDTO.toResponse(users), ...token };
  };

  loginInspectorService = async (loginParam: LoginRequestDTO) => {
    const users = await Users.findOne({
      $and: [{ _email: loginParam._email }, { _active: true }, { _role: 2 }],
    });

    if (!users) throw Errors.UserNotFound;

    const isValid = await compare(loginParam._password, users._pw);

    if (!isValid) throw Errors.PwInvalid;

    const token = await tokenService.createTokenByLogin(
      users._id.toString(),
      3600
    );

    return { ...UserResponsesDTO.toResponse(users), ...token };
  };

  logoutService = async (userId: string, refreshToken: string) => {
    await RefreshTokens.deleteOne({
      $and: [{ _uId: userId }, { _refreshToken: refreshToken }],
    });

    return { message: "Logout Successfully" };
  };

  resetToken = async (userId: string, refreshToken: string) => {
    const newToken = await tokenService.createTokenByReset(userId, 3600);
    const refresh = await RefreshTokens.findOneAndUpdate(
      {
        _refreshToken: refreshToken,
      },
      {
        _refreshToken: newToken.refreshToken,
      },
      { new: true }
    );

    if (!refresh) throw Errors.ErrorToken;
    const expiredRefresh: number =
      Date.parse(refresh.expireAt.toString()) + 3600 * 1000;

    return { ...newToken, expiredRefresh };
  };

  verifyAccessToken = async (accessToken: string) => {
    let userId = "";
    let iatAccessToken = "";

    //Verify token
    verify(accessToken, process.env.SECRET_KEY, (err, payload) => {
      if (err) throw Errors.Unauthorized;
      userId = payload["_id"];
      iatAccessToken = payload["iat"];
    });

    return { userId, iatAccessToken };
  };

  verifyRefreshToken = async (refreshToken: string) => {
    let userId = "";
    let iatRefreshToken = "";
    let timeExpireRefresh: number;

    //Verify token
    verify(refreshToken, process.env.SECRET_KEY_FRESH, (err, payload) => {
      if (err) throw Errors.ExpiredRefreshToken;
      userId = payload["_id"];
      iatRefreshToken = payload["iat"];
      timeExpireRefresh = payload["exp"];
    });

    //check refreshToken in database
    const token = await RefreshTokens.findOne({
      _uId: userId,
      _refreshToken: refreshToken,
    });

    if (!token) throw Errors.ExpiredRefreshToken;

    return { userId, iatRefreshToken, timeExpireRefresh };
  };
}
