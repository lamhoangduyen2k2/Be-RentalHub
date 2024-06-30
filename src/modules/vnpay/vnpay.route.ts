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

const vnpay = new VNPay({
  secureSecret: process.env.VNPAY_SECURE_SECRET,
  tmnCode: process.env.VNPAY_TMN_CODE,
});

const payRoute = express.Router();

/**
 * Display home views
 */
payRoute.get("/", async (req, res) => {
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
payRoute.post("/", async (req, res) => {
  const bankList = await vnpay.getBankList();
  const productTypeList = Object.entries(ProductCode).map(([key, value]) => ({
    key,
    value,
  }));
  const contentPaymentDefault = `Thanh toan don hang ${new Date().toISOString()}`;

  const {
    amountInput,
    contentPayment,
    productTypeSelect,
    bankSelect,
    langSelect,
  } = req.body;

  // Validate amount
  if (!amountInput || amountInput <= 0) {
    return res.render("home", {
      scripts: `<script>alert('Số tiền chưa hợp lệ');window.location.href = '/';</script>`,
      bankList,
      productTypeList,
      contentPaymentDefault,
    });
  }

  // Validate content payment
  if (!contentPayment) {
    return res.render("home", {
      scripts: `<script>alert('Vui lòng điền nội dung thanh toán');window.location.href = '/';</script>`,
      bankList,
      productTypeList,
      contentPaymentDefault,
    });
  }

  /**
   * Prepare data for build payment url
   * Note: In the VNPay documentation, it's stated that you must multiply the amount by 100.
   * However, when using the `vnpay` package, this is done automatically.
   */
  const data: BuildPaymentUrl = {
    vnp_Amount: amountInput,
    vnp_IpAddr:
      req.headers.forwarded ||
      req.ip ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress ||
      "127.0.0.1",
    vnp_OrderInfo: contentPayment,
    vnp_ReturnUrl:
      process.env.VNPAY_RETURN_URL ?? "http://localhost:3000/vnpay-return",
    vnp_TxnRef: new Date().getTime().toString(),
    vnp_BankCode: bankSelect ?? undefined,
    vnp_Locale: langSelect,
    vnp_OrderType: productTypeSelect,
  };
  console.log("🚀 ~ payRoute.post ~ data:", data);
  const url = vnpay.buildPaymentUrl(data);
  console.log("🚀 ~ payRoute.post ~ url:", url);

  return res.redirect(url);
});

/**
 * Redirect home
 */
payRoute.get("/url", async (req, res) => {
  return res.redirect("/");
});

/**
 * Post request for create payment url
 */
payRoute.post("/url", async (req, res) => {
  const bankList = await vnpay.getBankList();
  const productTypeList = Object.entries(ProductCode).map(([key, value]) => ({
    key,
    value,
  }));
  const contentPaymentDefault = `Thanh toan don hang ${new Date().toISOString()}`;

  const {
    amountInput,
    contentPayment,
    productTypeSelect,
    bankSelect,
    langSelect,
  } = req.body;

  // Validate amount
  if (!amountInput || amountInput <= 0) {
    return res.render("home", {
      scripts: `<script>alert('Số tiền chưa hợp lệ');window.location.href = '/';</script>`,
      bankList,
      productTypeList,
      contentPaymentDefault,
    });
  }

  // Validate content payment
  if (!contentPayment) {
    return res.render("home", {
      scripts: `<script>alert('Vui lòng điền nội dung thanh toán');window.location.href = '/';</script>`,
      bankList,
      productTypeList,
      contentPaymentDefault,
    });
  }

  /**
   * Prepare data for build payment url
   * Note: In the VNPay documentation, it's stated that you must multiply the amount by 100.
   * However, when using the `vnpay` package, this is done automatically.
   */
  const data: BuildPaymentUrl = {
    vnp_Amount: amountInput,
    vnp_IpAddr:
      req.headers.forwarded ||
      req.ip ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress ||
      "127.0.0.1",
    vnp_OrderInfo: contentPayment,
    vnp_ReturnUrl:
      process.env.VNPAY_RETURN_URL ?? "http://localhost:3000/vnpay-return",
    vnp_TxnRef: new Date().getTime().toString(),
    vnp_BankCode: bankSelect ?? undefined,
    vnp_Locale: langSelect,
    vnp_OrderType: productTypeSelect,
  };
  // Build payment url
  const url = vnpay.buildPaymentUrl(data);

  // Render payment url to home view
  return res.render("home", {
    bankList,
    productTypeList,
    contentPaymentDefault,
    url,
  });
});

/**
 * Get request for return url, just use for ui, ...
 */
payRoute.get("/vnpay-return", async (req, res) => {
  console.log("🚀 ~ req.headers:", req.headers);
  const result = vnpay.verifyReturnUrl(req.query as unknown as VerifyReturnUrl);
  console.log("🚀 ~ payRoute.get ~ result:", result);

  return res.render("result", {
    result: {
      ...result,
      vnp_PayDate: parseDate(
        result.vnp_PayDate ?? "Invalid Date"
      ).toLocaleString(),
    },
  });
});

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
