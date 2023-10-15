import { sign } from "jsonwebtoken";
import RefreshTokens from "./refresh.model";
import { Service } from "typedi";

@Service()
class TokenService {
  public createTokenByLogin = async (userId: string | number, timeLife: number) => {
    let accessToken = "";
    let refreshToken = "";

    //Create accessToken
    accessToken = sign({ _id: userId }, process.env.SECRET_KEY, {
      expiresIn: "60s",
    });

    //Create refeshToken
    refreshToken = sign({ _id: userId }, process.env.SECRET_KEY_FRESH, {
      expiresIn: `${timeLife}s`,
    });

    //Save refreshToken to database
    await RefreshTokens.create({
      _uId: userId,
      _refreshToken: refreshToken,
      expireAt: Date.now(),
    });

    return { accessToken, refreshToken };
  };

  public createTokenByReset = async (userId: string | number, timeLife: number) => {
    let accessToken = "";
    let refreshToken = "";

    //Create accessToken
    accessToken = sign({ _id: userId }, process.env.SECRET_KEY, {
      expiresIn: "60s",
    });

    //Create refeshToken
    refreshToken = sign({ _id: userId }, process.env.SECRET_KEY_FRESH, {
      expiresIn: `${timeLife}s`,
    });
    return { accessToken, refreshToken };
  };
}

export default new TokenService()