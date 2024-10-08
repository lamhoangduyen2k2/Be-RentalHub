import { compare } from "bcrypt";
import { Errors } from "../../helpers/handle-errors";
import Users from "../user/model/users.model";
import { LoginRequestDTO } from "./dtos/auth-login.dto";
import { verify } from "jsonwebtoken";
import RefreshTokens from "../token/refresh.model";
import { Service } from "typedi";
import tokenService from "../token/token.service";
import { UserResponsesDTO } from "../user/dtos/detail-user-response.dto";
import { LoginGoogleRequestDTO } from "./dtos/login-google";
import jwt from "jsonwebtoken";
import chatModel from "../chats/chat.model";
import { ClientSession } from "mongoose";

@Service()
export class AuthService {
  loginService = async (loginParam: LoginRequestDTO, session: ClientSession) => {
    const users = await Users.findOne({
      $and: [{ _email: loginParam._email }, { _active: true }, { _role: 0 }],
    }).session(session);

    if (!users) throw Errors.UserNotFound;

    const isValid = await compare(loginParam._password, users._pw);

    if (!isValid) throw Errors.PwInvalid;

    const token = await tokenService.createTokenByLogin(
      users._id.toString(),
      3600,
      session
    );

    await session.commitTransaction();
    return { ...UserResponsesDTO.toResponse(users), ...token };
  };

  checkRegisterByGoogle = async (loginInfo: LoginGoogleRequestDTO, session: ClientSession) => {
    if (!loginInfo.email_verified) throw Errors.EmailNotVerified;

    let user = await Users.findOne({ _email: loginInfo.email }).session(session);
    if (user && user._loginType !== "google") throw Errors.Duplicate;

    if (!user) {
      const newUser = await Users.create([{
        _email: loginInfo.email,
        _fname: loginInfo.family_name,
        _lname: loginInfo.given_name,
        _avatar: loginInfo.picture,
        _loginType: loginInfo.type_login,
      }], { session });
    
      if (newUser.length <= 0) throw Errors.SaveToDatabaseFail;

      user = newUser[0];

      const chatAdmin = await chatModel.create([{
        members: [user._id.toString(), "65418310bec0ba49c4d9a276"],
      }], { session });
      if (chatAdmin.length <= 0) throw Errors.SaveToDatabaseFail;
    }
    if (!user) throw Errors.SaveToDatabaseFail;

    const token = jwt.sign({ email: user._email}, process.env.SECRET_KEY, { expiresIn: '1h' })

    await session.commitTransaction();
    return token;
  };

  loginByGoogle = async (token: string, session: ClientSession) => {
    ///Check token is existed
    if (!token) throw Errors.Unauthorized;

    //Decode token
    const payload = jwt.verify(token, process.env.SECRET_KEY);

    //Find user by email
    const user = await Users.findOne({
      $and: [{ _email: payload["email"] }, { _loginType: "google" }],
    }).session(session);
    if (!user) throw Errors.UserNotFound;

    //Create token
    const tokenLogin = await tokenService.createTokenByLogin(
      user._id.toString(),
      3600,
      session
    );

    await session.commitTransaction();
    return { ...UserResponsesDTO.toResponse(user), ...tokenLogin};
  }

  loginInspectorService = async (loginParam: LoginRequestDTO, session: ClientSession) => {
    const users = await Users.findOne({
      $and: [{ _email: loginParam._email }, { _active: true }, { _role: 2 }],
    }).session(session);

    if (!users) throw Errors.UserNotFound;

    const isValid = await compare(loginParam._password, users._pw);

    if (!isValid) throw Errors.PwInvalid;

    const token = await tokenService.createTokenByLogin(
      users._id.toString(),
      3600,
      session
    );

    await session.commitTransaction();
    return { ...UserResponsesDTO.toResponse(users), ...token };
  };

  loginAdminService = async (loginParam: LoginRequestDTO, session: ClientSession) => {
    const users = await Users.findOne({
      $and: [{ _email: loginParam._email }, { _active: true }, { _role: 1 }],
    }).session(session);

    if (!users) throw Errors.UserNotFound;

    const isValid = await compare(loginParam._password, users._pw);

    if (!isValid) throw Errors.PwInvalid;

    const token = await tokenService.createTokenByLogin(
      users._id.toString(),
      3600,
      session
    );

    await session.commitTransaction();
    return { ...UserResponsesDTO.toResponse(users), ...token };
  };

  logoutService = async (userId: string, refreshToken: string, session: ClientSession) => {
    await RefreshTokens.deleteOne({
      $and: [{ _uId: userId }, { _refreshToken: refreshToken }],
    }).session(session);

    await session.commitTransaction();
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
