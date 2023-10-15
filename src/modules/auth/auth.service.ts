import { compare } from "bcrypt";
import { Errors } from "../../helpers/handle-errors";
import Users from "../user/users.model";
import { LoginRequestDTO } from "./dtos/auth-login.dto";
import { verify } from "jsonwebtoken";
import RefreshTokens from "../token/refresh.model";
import { Service } from "typedi";
import tokenService from "../token/token.service";

@Service()
export class AuthService { 
  loginService = async (loginParam: LoginRequestDTO) => {
    const users = await Users.findOne({
      _email: loginParam._email,
    });

    if (!users) throw Errors.UserNotFound;

    const isValid = await compare(loginParam._password, users._pw);

    if (!isValid) throw Errors.PasswordInvalid;

    const token = await tokenService.createTokenByLogin(
      users._id.toString(),
      300
    );

    return token;
  };

  resetToken = async (userId: string, refreshToken: string) => {
    const newToken = await tokenService.createTokenByReset(userId, 300);
    await RefreshTokens.findOneAndUpdate(
      {
        _refreshToken: refreshToken,
      },
      {
        _refreshToken: newToken.refreshToken,
      }
    );

    const token = await RefreshTokens.findOne({
      _refreshToken: newToken.refreshToken,
    });
    if (!token) throw Errors.ErrorToken;

    return newToken;
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
      if (err) throw Errors.ExpiredToken;
      userId = payload["_id"];
      iatRefreshToken = payload["iat"];
      timeExpireRefresh = payload["exp"];
    });

    //check refreshToken in database
    const token = await RefreshTokens.findOne({
      _uId: userId,
      _refreshToken: refreshToken,
    });

    if (!token) throw Errors.ExpiredToken;

    return { userId, iatRefreshToken, timeExpireRefresh };
  };
}
