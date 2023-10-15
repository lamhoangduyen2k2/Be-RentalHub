import mongoose, { Schema } from "mongoose";
import Users from "../user/users.model";

const refreshTokensSchema = new mongoose.Schema(
  {
    _uId: {
      type: Schema.Types.ObjectId,
      ref: Users,
    },
    _refreshToken: String,
    expireAt : {
      type : Date,
      expires: 120
    }
  },
  { timestamps: true }
);


const RefreshTokens = mongoose.model("refresh_tokens", refreshTokensSchema);
export default RefreshTokens;