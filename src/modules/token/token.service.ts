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
      expiresIn: "300s",
    });

    const expiredAccess : number = Date.now() + 300*1000
    
    //Create refeshToken
    refreshToken = sign({ _id: userId }, process.env.SECRET_KEY_FRESH, {
      expiresIn: `${timeLife}s`,
    });

    //Save refreshToken to database
    const refresh = await RefreshTokens.create({
      _uId: userId,
      _refreshToken: refreshToken,
      expireAt: Date.now(),
    });

    const expiredRefresh : number = Date.parse(refresh.expireAt.toString()) + 3600*1000
    
    return { accessToken, refreshToken, expiredAccess, expiredRefresh};
  };

  public createTokenByReset = async (userId: string | number, timeLife: number) => {
    let accessToken = "";
    let refreshToken = "";

    //Create accessToken
    accessToken = sign({ _id: userId }, process.env.SECRET_KEY, {
      expiresIn: "300s",
    });

    const expiredAccess : number = Date.now() + 300*1000

    //Create refeshToken
    refreshToken = sign({ _id: userId }, process.env.SECRET_KEY_FRESH, {
      expiresIn: `${timeLife}s`,
    });
    return { accessToken, refreshToken, expiredAccess };
  };
}

export default new TokenService()