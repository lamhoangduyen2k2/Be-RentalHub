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
import express from "express";

import Container from "typedi";
import { PaymenController } from "./vnpay.controller";
import { AuthenMiddWare } from "../auth/auth.middleware";

const vnpay = new VNPay({
  secureSecret: process.env.VNPAY_SECURE_SECRET,
  tmnCode: process.env.VNPAY_TMN_CODE,
});

const payRoute = express.Router();
const paymentController = Container.get(PaymenController);
const authMiddleware = Container.get(AuthenMiddWare);

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
  authMiddleware.authorizedUser,
  paymentController.createPaymentUrl
);

/**
 * Get request for return url, just use for ui, ...
 */
payRoute.get(
  "/vnpay_return",
  paymentController.returnPayment
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
// payRoute.get("/vnpay-ipn", async (req, res) => {
//   console.log("🚀 ~ payRoute.get ~ req.query ~ vnpay-ipn");
//   try {
//     const verify: VerifyReturnUrl = vnpay.verifyIpnCall(
//       req.query as unknown as VerifyIpnCall
//     );
//     if (!verify.isVerified) {
//       return res.json(IpnFailChecksum);
//     }

//     // Find the order in your database
//     // This is the sample order that you need to check the status, amount, etc.
//     const foundOrder = {
//       orderId: "123456",
//       amount: 10000,
//       status: "pending",
//     };

//     // If the order is not found, or the order id is not matched
//     // You can use the orderId to find the order in your database
//     if (!foundOrder || verify.vnp_TxnRef !== foundOrder.orderId) {
//       return res.json(IpnOrderNotFound);
//     }

//     // If the amount is not matched
//     if (verify.vnp_Amount !== foundOrder.amount) {
//       return res.json(IpnInvalidAmount);
//     }

//     // If the order is already confirmed
//     if (foundOrder.status === "completed") {
//       return res.json(InpOrderAlreadyConfirmed);
//     }

//     // Update the order status to complete
//     // Eg: Update the order status in your database
//     foundOrder.status = "completed";

//     // Then return the success response to VNPay
//     return res.json(IpnSuccess);
//   } catch (error) {
//     console.log(`verify error: ${error}`);
//     return res.json(IpnUnknownError);
//   }
// });

export default payRoute;
