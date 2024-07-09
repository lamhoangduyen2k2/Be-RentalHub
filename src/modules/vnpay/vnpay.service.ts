/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from "dayjs";
import { Service } from "typedi";
import querystring from "qs";
import crypto from "crypto";
import Users from "../user/model/users.model";
import mongoose from "mongoose";
import { Errors } from "../../helpers/handle-errors";
import { UserResponsesDTO } from "../user/dtos/detail-user-response.dto";
import Payments from "./models/payment.model";

@Service()
export class PaymentService {
  public createPaymentUrl = (
    orderId: string,
    amount: number,
    ipAddr: string | string[]
  ) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const date = new Date();
    const createDate = dayjs(date).format("YYYYMMDDHHmmss");

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_SECURE_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;

    vnp_Params = this.sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    return vnpUrl;
  };

  public returnPayment = async (vnp_Params: querystring.ParsedQs) => {
    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = this.sortObject(vnp_Params);

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_SECURE_SECRET;

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed && vnp_Params["vnp_ResponseCode"] === "00") {
      let total = 0;
      let type = "Cơ bản";
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
      const userId = vnp_Params["vnp_TxnRef"].toString().slice(0, 24);

      //Check user is exist
      const oldUser = await Users.findOne({
        $and: [{ _id: new mongoose.Types.ObjectId(userId) }, { _active: true }],
      });

      //Tinh toan so luot post
      const amount = Number(vnp_Params["vnp_Amount"]) / 100;
      switch (amount) {
        case 100000:
          total = 20;
          type = "VIP20";
          break;
        case 200000:
          total = 50;
          type = "VIP50";
          break;
        default:
          total = amount / 3000;
          type = "GOD";
          break;
      }

      //find user by userId
      const user = await Users.findOneAndUpdate(
        {
          $and: [
            { _id: new mongoose.Types.ObjectId(userId) },
            { _active: true },
          ],
        },
        {
          _totalPosts:
            oldUser._totalPosts >= 0 ? oldUser._totalPosts + total : total,
        },
        {
          new: true,
        }
      );

      if (user._totalPosts === 0) throw Errors.SaveToDatabaseFail;

      //Create payment for user
      const newPayment = await Payments.create({
        _orderId: vnp_Params["vnp_TxnRef"],
        _amount: amount,
        _uId: user._id,
        _type: type,
      });
      if (!newPayment) throw Errors.SaveToDatabaseFail;

      return UserResponsesDTO.toResponse(user);
    } else if (secureHash === signed && vnp_Params["vnp_ResponseCode"] !== "00")
      throw Errors.PayingCancled;
    else throw Errors.SaveToDatabaseFail;
  };

  private sortObject = (obj) => {
    const sorted = {};
    const str: string[] = [];
    let key: string | number;
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  };
}
