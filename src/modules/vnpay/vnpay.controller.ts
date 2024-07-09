import { Inject, Service } from "typedi";
import { PaymentService } from "./vnpay.service";
import { NextFunction, Request, Response } from "express";
import dayjs from "dayjs";
import { ResponseData } from "../../helpers/response";

@Service()
export class PaymenController {
  constructor(@Inject() private paymentService: PaymentService) {}

  public createPaymentUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;
      const date = new Date();
      const orderId = req.body.contentPayment + dayjs(date).format("DDHHmmss");
      const amount = req.body.amountInput || 20000;

      const paymentUrl = this.paymentService.createPaymentUrl(
        orderId,
        amount,
        ipAddr
      );

      res.json(new ResponseData(paymentUrl, null, null));
    } catch (error) {
      console.log("🚀 ~ PaymenController ~ createPaymentUrl= ~ error:", error);
      next(error);
    }
  };

  public returnPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vnp_Params = req.query;
      const result = await this.paymentService.returnPayment(vnp_Params);

      if (result._totalPosts >= 0)
        res.redirect(`http://localhost:4200/profile/post-new/${result._id}`);
    } catch (error) {
      res.redirect(`http://localhost:4200/payment/packages`);
      console.log("🚀 ~ PaymenController ~ returnPayment= ~ error:", error);
      next(error);
    }
  };
}
