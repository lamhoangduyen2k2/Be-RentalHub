import nodemailer from "nodemailer";
import { SendMailDTO } from "../user/dtos/user-create.dto";
import { Service } from "typedi";

@Service()
export class OTPService {
  //Create transporter
  private transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  sendEmail = async (job: SendMailDTO) => {
    // send mail with defined transport object
    await this.transporter.sendMail({
      from: '"Lam Hoang Duyen" <hoangduyen02052k2@gmail.com>', // sender address
      to: job.email, // list of receivers
      subject: job.subject, // Subject line
      text: job.text, // plain text body
      html: job.html, // html body
    });
  };
}
