/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BuildPaymentUrl,
  InpOrderAlreadyConfirmed,
  IpnFailChecksum,
  IpnInvalidAmount,
  IpnOrderNotFound,
  IpnSuccess,
  IpnUnknownError,
  ProductCode,
  VNPay,
  VerifyIpnCall,
  VerifyReturnUrl,
  parseDate,
} from "vnpay";
import express, { NextFunction, Request, Response } from "express";
import dayjs from "dayjs";
import querystring from "qs";
import crypto from "crypto";
import { ResponseData } from "../../helpers/response";

const vnpay = new VNPay({
  secureSecret: process.env.VNPAY_SECURE_SECRET,
  tmnCode: process.env.VNPAY_TMN_CODE,
});

const payRoute = express.Router();

/**
 * Display home views
 */
payRoute.get("/", async (req, res, next) => {
  const bankList = await vnpay.getBankList();
  const productTypeList = Object.entries(ProductCode).map(([key, value]) => ({
    key,
    value,
  }));
  const contentPaymentDefault = `Thanh toan don hang ${new Date().toISOString()}`;

  return res.render("home", {
    showTitle: true,
    bankList,
    productTypeList,
    contentPaymentDefault,
  });
});

/**
 * Post request for payment redirect form
 */
payRoute.post(
  "/create_payment_url",
  async (req: Request, res: Response, next: NextFunction) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const date = new Date();
    const createDate = dayjs(date).format("YYYYMMDDHHmmss");

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_SECURE_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;
    const orderId = dayjs(date).format("DDHHmmss");

    const amount = req.body.amountInput || 20000;
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

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    res.redirect(vnpUrl);
  }
);

/**
 * Get request for return url, just use for ui, ...
 */
payRoute.get(
  "/vnpay_return",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let vnp_Params = req.query;

      const secureHash = vnp_Params["vnp_SecureHash"];

      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];


      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      vnp_Params = sortObject(vnp_Params);

      const tmnCode = process.env.VNPAY_TMN_CODE;
      const secretKey = process.env.VNPAY_SECURE_SECRET;

      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      console.log("🚀 ~ payRoute.get ~ secureHash:", secureHash);
      console.log("🚀 ~ payRoute.get ~ signed:", signed);

      res.json(new ResponseData(vnp_Params, null, null));
      // if (secureHash === signed) {
      //   //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

      // } else {}

    } catch (error) {
      console.log("🚀 ~ payRoute.get ~ error:", error);
      next(error);
    }
  }
);

function sortObject(obj) {
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
}

/**
 * This is a GET request for the IPN URL. It's used for updating the order status, database, etc.
 * MUST: It's crucial to return a response so that VNPay can acknowledge the result.
 */
payRoute.get("/vnpay-ipn", async (req, res) => {
  console.log("🚀 ~ payRoute.get ~ req.query ~ vnpay-ipn");
  try {
    const verify: VerifyReturnUrl = vnpay.verifyIpnCall(
      req.query as unknown as VerifyIpnCall
    );
    if (!verify.isVerified) {
      return res.json(IpnFailChecksum);
    }

    // Find the order in your database
    // This is the sample order that you need to check the status, amount, etc.
    const foundOrder = {
      orderId: "123456",
      amount: 10000,
      status: "pending",
    };

    // If the order is not found, or the order id is not matched
    // You can use the orderId to find the order in your database
    if (!foundOrder || verify.vnp_TxnRef !== foundOrder.orderId) {
      return res.json(IpnOrderNotFound);
    }

    // If the amount is not matched
    if (verify.vnp_Amount !== foundOrder.amount) {
      return res.json(IpnInvalidAmount);
    }

    // If the order is already confirmed
    if (foundOrder.status === "completed") {
      return res.json(InpOrderAlreadyConfirmed);
    }

    // Update the order status to complete
    // Eg: Update the order status in your database
    foundOrder.status = "completed";

    // Then return the success response to VNPay
    return res.json(IpnSuccess);
  } catch (error) {
    console.log(`verify error: ${error}`);
    return res.json(IpnUnknownError);
  }
});

export default payRoute;
