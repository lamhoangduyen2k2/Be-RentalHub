/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Service } from "typedi";
import { CreateUserRequestDTO, SendMailDTO } from "./dtos/user-create.dto";
import Users from "./model/users.model";
import { Errors } from "../../helpers/handle-errors";
import { generate } from "otp-generator";
import { OTPService } from "../otp/otp.service";
import OTP from "../otp/otp.model";
import { UserHostedDTO } from "./dtos/user-active-host.dto";
import { UserResponsesDTO } from "./dtos/detail-user-response.dto";
import { UpdateUserDTO } from "./dtos/user-update.dto";
import { ImageService } from "../image/image.service";
import mongoose, {
  ClientSession,
  ObjectId,
  PipelineStage,
  mongo,
} from "mongoose";
import { UserUpdateEmailOrPassDTO } from "./dtos/user-update-email-pass.dto";
import { compare } from "bcrypt";
import RefreshTokens from "../token/refresh.model";
import UsersTermp from "./model/users-termp.model";
import { sign, verify } from "jsonwebtoken";
import { Pagination } from "../../helpers/response";
import { UpdateInspectorPassDTO } from "./dtos/inspector-update-pass.dto";
import { UpdateInspectorPasswordDTO } from "./dtos/update-password-inspector.dto";
import { convertUTCtoLocal } from "../../helpers/ultil";
import FormData from "form-data";
// import fs from "fs";
// import { Multer } from "multer";
import { fetchIDRecognition } from "../../helpers/request";
import Indentities from "./model/users-identity.model";
import { NotificationService } from "../notification/notification.service";
import { CreateNotificationInspectorDTO } from "../notification/dtos/create-notification-inspector.dto";
import Notification from "../notification/notification.model";
import addressRental from "./model/user-address.model";
import { CreateNotificationRegisterAddressDTO } from "../notification/dtos/create-notification-register-address.dto";
import UserBlocked from "./model/user-blocked.model";
import { CreateNotificationDTO } from "../notification/dtos/create-notification.dto";
import { UpdateAddressDTO } from "./dtos/update-address.dto";
import { UserNotDetailResponsesDTO } from "./dtos/user-response.dto";
import Chat from "twilio/lib/rest/Chat";
import chatModel from "../chats/chat.model";
import eventEmitter from "../socket/socket";
import { session } from "passport";
import { CreateAddressDTO } from "./dtos/create-address.dto";
import Posts from "../posts/models/posts.model";
import SocialPosts from "../social-posts/models/social-posts.model";
//require("esm-hook");
//const fetch = require("node-fetch").default;
// const http = require("http");
// const https = require("https");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

@Service()
export class UserService {
  constructor(
    @Inject() private imageService: ImageService,
    @Inject() private otpService: OTPService,
    @Inject() private notificationService: NotificationService
  ) {}

  //User API
  public createNewUser = async (userParam: CreateUserRequestDTO) => {
    const user = await Users.findOne({
      $and: [{ _email: userParam._email }, { _active: true }, { _role: 0 }],
    });

    if (user) throw Errors.Duplicate;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const newUser = await Users.create({
      _fname: userParam._fname,
      _lname: userParam._lname,
      _email: userParam._email,
      _pw: userParam._pw,
    });

    return UserResponsesDTO.toResponse(newUser);
  };

  public registorUser = async (
    userParam: CreateUserRequestDTO,
    session: ClientSession
  ) => {
    const user = await Users.findOne({
      _email: userParam._email,
    }).session(session);

    if (user) throw Errors.Duplicate;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const termpUser = await UsersTermp.findOne({
      _email: userParam._email,
    }).session(session);

    if (termpUser) {
      await UsersTermp.deleteOne({ _email: userParam._email }, { session });
    }

    const newUser = await UsersTermp.create(
      [
        {
          _fname: userParam._fname,
          _lname: userParam._lname,
          _email: userParam._email,
          _pw: userParam._pw,
          expiredAt: Date.now(),
        },
      ],
      { session }
    );

    if (newUser.length <= 0) throw Errors.SaveToDatabaseFail;

    //Kiểm tra OTP có bị trùng không
    const Otp = await OTP.findOne({ _email: newUser[0]._email }).session(
      session
    );
    if (Otp) throw Errors.OtpDuplicate;

    //Create otp
    const otp: string = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    }).toString();

    //Create payload for sendEmail
    const payload: SendMailDTO = {
      email: newUser[0]._email,
      subject: "Thông báo đăng kí tài khoản thành công",
      text: "You have successfully registered",
      html: `<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<meta charset="UTF-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>*|MC:SUBJECT|*</title>
<style>          img{-ms-interpolation-mode:bicubic;} 
          table, td{mso-table-lspace:0pt; mso-table-rspace:0pt;} 
          .mceStandardButton, .mceStandardButton td, .mceStandardButton td a{mso-hide:all !important;} 
          p, a, li, td, blockquote{mso-line-height-rule:exactly;} 
          p, a, li, td, body, table, blockquote{-ms-text-size-adjust:100%; -webkit-text-size-adjust:100%;} 
          @media only screen and (max-width: 480px){
            body, table, td, p, a, li, blockquote{-webkit-text-size-adjust:none !important;} 
          }
          .mcnPreviewText{display: none !important;} 
          .bodyCell{margin:0 auto; padding:0; width:100%;}
          .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font{line-height:100%;} 
          .ReadMsgBody{width:100%;} .ExternalClass{width:100%;} 
          a[x-apple-data-detectors]{color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important;} 
            body{height:100%; margin:0; padding:0; width:100%; background: #ffffff;}
            p{margin:0; padding:0;} 
            table{border-collapse:collapse;} 
            td, p, a{word-break:break-word;} 
            h1, h2, h3, h4, h5, h6{display:block; margin:0; padding:0;} 
            img, a img{border:0; height:auto; outline:none; text-decoration:none;} 
            a[href^="tel"], a[href^="sms"]{color:inherit; cursor:default; text-decoration:none;} 
            li p {margin: 0 !important;}
            .ProseMirror a {
                pointer-events: none;
            }
            @media only screen and (max-width: 640px){
                .mceClusterLayout td{padding: 4px !important;} 
            }
            @media only screen and (max-width: 480px){
                body{width:100% !important; min-width:100% !important; } 
                body.mobile-native {
                    -webkit-user-select: none; user-select: none; transition: transform 0.2s ease-in; transform-origin: top center;
                }
                body.mobile-native.selection-allowed a, body.mobile-native.selection-allowed .ProseMirror {
                    user-select: auto;
                    -webkit-user-select: auto;
                }
                colgroup{display: none;}
                img{height: auto !important;}
                .mceWidthContainer{max-width: 660px !important;}
                .mceColumn{display: block !important; width: 100% !important;}
                .mceColumn-forceSpan{display: table-cell !important; width: auto !important;}
                .mceColumn-forceSpan .mceButton a{min-width:0 !important;}
                .mceBlockContainer{padding-right:16px !important; padding-left:16px !important;} 
                .mceTextBlockContainer{padding-right:16px !important; padding-left:16px !important;} 
                .mceBlockContainerE2E{padding-right:0px; padding-left:0px;} 
                .mceSpacing-24{padding-right:16px !important; padding-left:16px !important;}
                .mceImage, .mceLogo{width: 100% !important; height: auto !important;} 
                .mceFooterSection .mceText, .mceFooterSection .mceText p{font-size: 16px !important; line-height: 140% !important;}
            }
            div[contenteditable="true"] {outline: 0;}
            .ProseMirror .empty-node, .ProseMirror:empty {position: relative;}
            .ProseMirror .empty-node::before, .ProseMirror:empty::before {
                position: absolute;
                left: 0;
                right: 0;
                color: rgba(0,0,0,0.2);
                cursor: text;
            }
            .ProseMirror .empty-node:hover::before, .ProseMirror:empty:hover::before {
                color: rgba(0,0,0,0.3);
            }
            a .ProseMirror p.empty-node::before, a .ProseMirror:empty::before {
                content: '';
            }
            .mceText, .ProseMirror {
                white-space: pre-wrap;
            }
            .ProseMirror h1.empty-node:only-child::before,
            .ProseMirror h2.empty-node:only-child::before,
            .ProseMirror h3.empty-node:only-child::before,
            .ProseMirror h4.empty-node:only-child::before {
                content: 'Heading';
            }
            .ProseMirror p.empty-node:only-child::before, .ProseMirror:empty::before {
                content: 'Start typing...';
            }
            .mceImageBorder {display: inline-block;}
            .mceImageBorder img {border: 0 !important;}
body, #bodyTable { background-color: rgb(244, 244, 244); }.mceText, .mceLabel { font-family: "Helvetica Neue", Helvetica, Arial, Verdana, sans-serif; }.mceText, .mceLabel { color: rgb(0, 0, 0); }.mceText h1 { margin-bottom: 0px; }.mceText p { margin-bottom: 0px; }.mceText label { margin-bottom: 0px; }.mceText input { margin-bottom: 0px; }.mceSpacing-12 .mceInput + .mceErrorMessage { margin-top: -6px; }.mceText h1 { margin-bottom: 0px; }.mceText p { margin-bottom: 0px; }.mceText label { margin-bottom: 0px; }.mceText input { margin-bottom: 0px; }.mceSpacing-24 .mceInput + .mceErrorMessage { margin-top: -12px; }.mceInput { background-color: transparent; border: 2px solid rgb(208, 208, 208); width: 60%; color: rgb(77, 77, 77); display: block; }.mceInput[type="radio"], .mceInput[type="checkbox"] { float: left; margin-right: 12px; display: inline; width: auto !important; }.mceLabel > .mceInput { margin-bottom: 0px; margin-top: 2px; }.mceLabel { display: block; }.mceText p { color: rgb(0, 0, 0); font-family: "Helvetica Neue", Helvetica, Arial, Verdana, sans-serif; font-size: 16px; font-weight: normal; line-height: 150%; text-align: center; direction: ltr; }.mceText h1 { color: rgb(0, 0, 0); font-family: "Helvetica Neue", Helvetica, Arial, Verdana, sans-serif; font-size: 31px; font-weight: bold; line-height: 150%; text-align: center; direction: ltr; }.mceText a { color: rgb(0, 0, 0); font-style: normal; font-weight: normal; text-decoration: underline; direction: ltr; }
@media only screen and (max-width: 480px) {
            .mceText p { font-size: 16px !important; line-height: 150% !important; }
          }
@media only screen and (max-width: 480px) {
            .mceText h1 { font-size: 31px !important; line-height: 150% !important; }
          }
@media only screen and (max-width: 480px) {
            .mceBlockContainer { padding-left: 16px !important; padding-right: 16px !important; }
          }
@media only screen and (max-width: 480px) {
            .mceDividerContainer { width: 100% !important; }
          }
#dataBlockId-9 p, #dataBlockId-9 h1, #dataBlockId-9 h2, #dataBlockId-9 h3, #dataBlockId-9 h4, #dataBlockId-9 ul { text-align: center; }</style>
<script>!function(){function o(n,i){if(n&&i)for(var r in i)i.hasOwnProperty(r)&&(void 0===n[r]?n[r]=i[r]:n[r].constructor===Object&&i[r].constructor===Object?o(n[r],i[r]):n[r]=i[r])}try{var n=decodeURIComponent("%7B%0A%22ResourceTiming%22%3A%7B%0A%22comment%22%3A%20%22Clear%20RT%20Buffer%20on%20mPulse%20beacon%22%2C%0A%22clearOnBeacon%22%3A%20true%0A%7D%2C%0A%22AutoXHR%22%3A%7B%0A%22comment%22%3A%20%22Monitor%20XHRs%20requested%20using%20FETCH%22%2C%0A%22monitorFetch%22%3A%20true%2C%0A%22comment%22%3A%20%22Start%20Monitoring%20SPAs%20from%20Click%22%2C%0A%22spaStartFromClick%22%3A%20true%0A%7D%2C%0A%22PageParams%22%3A%7B%0A%22comment%22%3A%20%22Monitor%20all%20SPA%20XHRs%22%2C%0A%22spaXhr%22%3A%20%22all%22%0A%7D%0A%7D");if(n.length>0&&window.JSON&&"function"==typeof window.JSON.parse){var i=JSON.parse(n);void 0!==window.BOOMR_config?o(window.BOOMR_config,i):window.BOOMR_config=i}}catch(r){window.console&&"function"==typeof window.console.error&&console.error("mPulse: Could not parse configuration",r)}}();</script>
                              <script>!function(a){var e="https://s.go-mpulse.net/boomerang/",t="addEventListener";if("True"=="True")a.BOOMR_config=a.BOOMR_config||{},a.BOOMR_config.PageParams=a.BOOMR_config.PageParams||{},a.BOOMR_config.PageParams.pci=!0,e="https://s2.go-mpulse.net/boomerang/";if(window.BOOMR_API_key="QAT5G-9HZLF-7EDMX-YMVCJ-QZJDA",function(){function n(e){a.BOOMR_onload=e&&e.timeStamp||(new Date).getTime()}if(!a.BOOMR||!a.BOOMR.version&&!a.BOOMR.snippetExecuted){a.BOOMR=a.BOOMR||{},a.BOOMR.snippetExecuted=!0;var i,_,o,r=document.createElement("iframe");if(a[t])a[t]("load",n,!1);else if(a.attachEvent)a.attachEvent("onload",n);r.src="javascript:void(0)",r.title="",r.role="presentation",(r.frameElement||r).style.cssText="width:0;height:0;border:0;display:none;",o=document.getElementsByTagName("script")[0],o.parentNode.insertBefore(r,o);try{_=r.contentWindow.document}catch(O){i=document.domain,r.src="javascript:var d=document.open();d.domain='"+i+"';void(0);",_=r.contentWindow.document}_.open()._l=function(){var a=this.createElement("script");if(i)this.domain=i;a.id="boomr-if-as",a.src=e+"QAT5G-9HZLF-7EDMX-YMVCJ-QZJDA",BOOMR_lstart=(new Date).getTime(),this.body.appendChild(a)},_.write("<bo"+'dy onload="document._l();">'),_.close()}}(),"400".length>0)if(a&&"performance"in a&&a.performance&&"function"==typeof a.performance.setResourceTimingBufferSize)a.performance.setResourceTimingBufferSize(400);!function(){if(BOOMR=a.BOOMR||{},BOOMR.plugins=BOOMR.plugins||{},!BOOMR.plugins.AK){var e=""=="true"?1:0,t="",n="b2qqudyxhrdqqzus3tta-f-4940e0fd0-clientnsv4-s.akamaihd.net",i="false"=="true"?2:1,_={"ak.v":"37","ak.cp":"1513051","ak.ai":parseInt("963350",10),"ak.ol":"0","ak.cr":7,"ak.ipv":4,"ak.proto":"h2","ak.rid":"1b040d4b","ak.r":29326,"ak.a2":e,"ak.m":"x","ak.n":"essl","ak.bpcip":"14.161.10.0","ak.cport":10562,"ak.gh":"113.171.234.162","ak.quicv":"","ak.tlsv":"tls1.3","ak.0rtt":"","ak.csrc":"-","ak.acc":"","ak.t":"1720900838","ak.ak":"hOBiQwZUYzCg5VSAfCLimQ==q5zhcliquHLEKT/CkkByU9TITkVzOUh9un9v3fhKoZlA2Wv91f0BjzuAkUEvKsG07LlM15X5cGB+IJo4tGyeDlRV0cX/ZDYYpfWowKHBY8jiKUgROYmBhIB7HS+wTZvfhz/0fDi5qMV4TUooMhP5O3YhoO/vV+LzA8/JTd9g0tPdqClSFFaYtbaws1uFdL9fKawxQnkk82pzKLpnRiHmYjTVur2UMmb3rVq8xT1zzhaiYA6dJgKGhSLRaL49fOKuE8UOMlf4aI5GGreqjDGCdMboMqcLr8IVHWKDVfn/Psg+YNtXX53V/hthNARoZGVSB7HYvSrO0xoh/EvleApABhBlJsR9MVc9kEsxLd82khBngBCSqsGh5fiXBh+ByzVPSPloF5jxCJ0Mjft4jUL5SfvHWk8AzyP9VOQjwyc29Nk=","ak.pv":"39","ak.dpoabenc":"","ak.tf":i};if(""!==t)_["ak.ruds"]=t;var o={i:!1,av:function(e){var t="http.initiator";if(e&&(!e[t]||"spa_hard"===e[t]))_["ak.feo"]=void 0!==a.aFeoApplied?1:0,BOOMR.addVar(_)},rv:function(){var a=["ak.bpcip","ak.cport","ak.cr","ak.csrc","ak.gh","ak.ipv","ak.m","ak.n","ak.ol","ak.proto","ak.quicv","ak.tlsv","ak.0rtt","ak.r","ak.acc","ak.t","ak.tf"];BOOMR.removeVar(a)}};BOOMR.plugins.AK={akVars:_,akDNSPreFetchDomain:n,init:function(){if(!o.i){var a=BOOMR.subscribe;a("before_beacon",o.av,null,null),a("onbeacon",o.rv,null,null),o.i=!0}return this},is_complete:function(){return!0}}}}()}(window);</script></head>
<body>
<!--*|IF:MC_PREVIEW_TEXT|*-->
<!--[if !gte mso 9]><!----><span class="mcnPreviewText" style="display:none; font-size:0px; line-height:0px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;">*|MC_PREVIEW_TEXT|*</span><!--<![endif]-->
<!--*|END:IF|*-->
<center>
<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable" style="background-color: rgb(244, 244, 244);">
<tbody><tr>
<td class="bodyCell" align="center" valign="top">
<table id="root" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody data-block-id="13" class="mceWrapper"><tr><td align="center" valign="top" class="mceWrapperOuter"><!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="660" style="width:660px;"><tr><td><![endif]--><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px" role="presentation"><tbody><tr><td style="background-color:#ffffff;background-position:center;background-repeat:no-repeat;background-size:cover" class="mceWrapperInner" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="12"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="-4" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:48px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="1" class="mceText" id="dataBlockId-1" style="width:100%"><p class="last-child"><a href="*|ARCHIVE|*">View this email in your browser</a></p></div></td></tr></tbody></table></td></tr><tr><td style="padding-top:12px;padding-bottom:12px;padding-right:48px;padding-left:48px" class="mceBlockContainer" align="center" valign="top"><span class="mceImageBorder" style="border:0;vertical-align:top;margin:0"><img data-block-id="2" width="239.61661341853036" height="auto" style="width:239.61661341853036px;height:auto;max-width:239.61661341853036px !important;display:block" alt="" src="https://mcusercontent.com/855a0838a24019210572f018b/images/3284760d-2c5f-74c4-9d4e-71e84569ae94.png" role="presentation" class="imageDropZone mceLogo"/></span></td></tr><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="3" class="mceText" id="dataBlockId-3" style="width:100%"><h1><span style="color:#0074d9;">Cảm ơn bạn đã đăng ký tài khoản tại Rental Hub</span></h1><p class="last-child"><em>Hãy nhập mã sau để xác thực người dùng. Lưu ý mã otp chỉ có hiệu lực trong vòng 10 phút:</em> ${otp}</p></div></td></tr></tbody></table></td></tr><tr><td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer" data-block-id="6"><tbody><tr><td style="min-width:100%;border-top:2px solid #000000" class="mceDividerBlock" valign="top"></td></tr></tbody></table></td></tr><tr><td style="padding-top:8px;padding-bottom:8px;padding-right:8px;padding-left:8px" class="mceLayoutContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="11" id="section_1b0db26c4332f5dd2d13611a664737a8" class="mceFooterSection"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="12" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0;margin-bottom:12px" class="mceColumn" data-block-id="-3" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" align="center" valign="top"><table width="100%" style="border:0;border-collapse:separate"><tbody><tr><td style="padding-left:16px;padding-right:16px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"><div data-block-id="9" class="mceText" id="dataBlockId-9" style="display:inline-block;width:100%"><p class="last-child"><br/></p></div></td></tr></tbody></table></td></tr><tr><td class="mceLayoutContainer" align="center" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="-2"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td class="mceColumn" data-block-id="-5" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td align="center" valign="top"><div><div data-block-id="10"><a href="http://eepurl.com/iTIhHo" target="_blank" rel="noopener noreferrer"><img style="max-width:100%" width="137" height="53" alt="Email Marketing Powered by Mailchimp" title="Mailchimp Email Marketing" src="https://cdn-images.mailchimp.com/monkey_rewards/intuit-mc-rewards-1.png"/></a></div></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]--></td></tr></tbody></table>
</td>
</tr>
</tbody></table>
</center>
<script type="text/javascript"  src="/wNAADi_iXcb1ZDhPLCt52-hkk6w/tOEab4zGpcpb/bB8MYypVAQ/N0x/LZAN7NWI"></script></body></html>`,
    };
    await this.otpService.sendEmail(payload);

    //Save this otp to database
    const newOTP = await OTP.create(
      [
        {
          _email: newUser[0]._email,
          _otp: otp,
          expiredAt: Date.now(),
        },
      ],
      { session }
    );
    if (newOTP.length <= 0) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    //session.endSession();
    return UserResponsesDTO.toResponse(newUser[0]);
  };

  public verifyRegistor = async (
    email: string,
    otp: string,
    session: ClientSession
  ) => {
    const checkOTP = await OTP.findOne({
      $and: [{ _email: email }, { _otp: otp }],
    }).session(session);

    if (!checkOTP) throw Errors.ExpiredOtp;

    const newUser = await UsersTermp.findOne({ _email: email }).session(
      session
    );

    if (!newUser) throw Errors.UserNotFound;

    const user = await Users.create(
      [
        {
          _fname: newUser._fname,
          _lname: newUser._lname,
          _email: newUser._email,
          _pw: newUser._pw,
        },
      ],
      { session }
    );

    if (user.length <= 0) throw Errors.SaveToDatabaseFail;

    const chatAdmin = await chatModel.create(
      [
        {
          members: [user[0]._id.toString(), "65418310bec0ba49c4d9a276"],
        },
      ],
      { session }
    );
    if (chatAdmin.length <= 0) throw Errors.SaveToDatabaseFail;

    await UsersTermp.deleteOne({ _email: email }, { session });

    await session.commitTransaction();
    return UserResponsesDTO.toResponse(user);
  };

  public forgotPass = async (email: string, url: string) => {
    const user = await Users.findOne({
      $and: [{ _email: email }, { _active: true }],
    });
    if (!user) throw Errors.UserNotFound;

    const secret = process.env.SECRET_KEY_FORGOT_PASSWORD + user._pw;

    const payload = {
      email: user._email,
      id: user._id,
    };

    const token = sign(payload, secret, { expiresIn: "15m" });
    const link = `${url}/${user._id}/${token}`;

    //Create payload for sendEmail
    const dataMail: SendMailDTO = {
      email: email,
      subject: "Reset passowrd from RentalHub ✔",
      text: "Rest your password",
      html: `<b>Click this link to reset your password: ${link}</b>`,
    };
    await this.otpService.sendEmail(dataMail);

    return true;
  };

  public resetPassword = async (
    userId: string,
    token: string,
    _pw: string,
    _pwconfirm: string,
    session: ClientSession
  ) => {
    const user = await Users.findOne({
      _id: userId,
    }).session(session);
    if (!user) throw Errors.UserNotFound;

    const secret = process.env.SECRET_KEY_FORGOT_PASSWORD + user._pw;

    verify(token, secret, (err, payload) => {
      if (err) throw Errors.ExpiredToken;
    });

    if (_pw !== _pwconfirm) throw Errors.PwconfirmInvalid;

    const result = await Users.updateOne(
      { _id: userId },
      { _pw: _pw },
      { session }
    );
    if (result.modifiedCount <= 0) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return { message: "Reset password successfully" };
  };

  public updateUser = async (
    userParam: UpdateUserDTO,
    session: ClientSession
  ) => {
    //Check phoneNumber
    const userPhone = await Users.findOne({
      $and: [{ _phone: userParam._phone }, { _id: { $ne: userParam._uId } }],
    }).session(session);
    if (userPhone) throw Errors.PhonenumberDuplicate;

    const userUpdated = await Users.findOneAndUpdate(
      { _id: userParam._uId },
      userParam,
      { session, new: true }
    );

    if (!userUpdated) throw Errors.SaveToDatabaseFail;

    const _dob = convertUTCtoLocal(userUpdated._dob);
    const newUser = {
      ...userUpdated.toObject(),
      _dob,
    };

    await session.commitTransaction();
    return UserResponsesDTO.toResponse(newUser);
  };

  public updateAvatar = async (
    file: Express.Multer.File,
    uId: ObjectId,
    session: ClientSession
  ) => {
    const urlAvatar = await this.imageService.uploadAvatar(file);

    //Update avatar user
    const userUpdated = await Users.findOneAndUpdate(
      { _id: uId },
      { _avatar: urlAvatar },
      {
        session,
        new: true,
      }
    );

    if (!userUpdated) throw Errors.SaveToDatabaseFail;

    const _dob = convertUTCtoLocal(userUpdated._dob);
    const newUser = {
      ...userUpdated.toObject(),
      _dob,
    };

    await session.commitTransaction();
    return UserResponsesDTO.toResponse(newUser);
  };

  public updateEmail = async (
    userParam: UserUpdateEmailOrPassDTO,
    session: ClientSession
  ) => {
    if (userParam._email) {
      const user = await Users.findOne({
        $and: [{ _email: userParam._email }, { _id: { $ne: userParam._uId } }],
      }).session(session);

      if (user) throw Errors.Duplicate;
    }

    const oldUser = await Users.findOne({ _id: userParam._uId }).session(
      session
    );

    if (!oldUser) throw Errors.UserNotFound;

    const isValid = await compare(userParam._pwconfirm, oldUser._pw);

    if (!isValid) throw Errors.PwconfirmInvalid;

    const newUser = await Users.updateOne(
      { _id: userParam._uId },
      { _email: userParam._email, _pw: userParam._pw },
      { session }
    );

    if (newUser.modifiedCount <= 0) throw Errors.SaveToDatabaseFail;

    await RefreshTokens.deleteMany({ _uId: userParam._uId }, { session });

    await session.commitTransaction();
    return { message: "Please login againt!" };
  };

  public getUserById = async (uId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: uId }, { _active: true }, { _role: 0 }],
    });

    if (!user) throw Errors.UserNotFound;

    const _dob = convertUTCtoLocal(user._dob);
    const newUser = {
      ...user.toObject(),
      _dob,
    };

    return UserResponsesDTO.toResponse(newUser);
  };

  public getUserNotDetailById = async (uId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: uId }, { _active: true }],
    });

    if (!user) throw Errors.UserNotFound;

    const newUser = {
      ...user.toObject(),
      _name: `${user._fname} ${user._lname}`,
    };

    return UserNotDetailResponsesDTO.toResponse(newUser);
  };

  public activeHost = async (userParam: UserHostedDTO) => {
    // Check user is Block Host
    const userBlock = await UserBlocked.findOne({
      $or: [{ _uId: userParam._uId }, { _phone: userParam._phone }],
    });
    if (userBlock) throw Errors.UserIsBlocked;

    //Check phoneNumber
    const userPhone = await Users.findOne({
      $and: [{ _phone: userParam._phone }, { _id: { $ne: userParam._uId } }],
    });
    if (userPhone) throw Errors.PhonenumberDuplicate;

    const phone = userParam._phone.replace("0", "+84");

    //Kiểm tra user có quyền host hay chưa
    const user = await Users.findById(userParam._uId);
    if (user._isHost) throw Errors.UserIsHosted;

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: "sms" })
      .then((verification) => console.log(verification));
    return true;
  };

  public verifyHost = async (
    userId: string,
    phone: string,
    otp: string,
    session: ClientSession
  ) => {
    try {
      const _phone = phone.replace("0", "+84");

      const result = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID)
        .verificationChecks.create({ to: _phone, code: otp })
        .then((verification_check) => {
          console.log(
            "🚀 ~ UserService ~ .then ~ verification_check:",
            verification_check
          );
          return verification_check;
        })
        .catch((err) => {
          console.log("🚀 ~ UserService ~ verifyHost= ~ err:", err);
          throw Errors.ExpiredOtp;
        });

      if (!result.valid) throw Errors.OtpInvalid;

      const newUser = await Users.findByIdAndUpdate(
        userId,
        { _phone: phone },
        { session, new: true }
      );

      if (!newUser) Errors.SaveToDatabaseFail;

      await session.commitTransaction();
      return UserResponsesDTO.toResponse(newUser);
    } catch (error) {
      console.log("🚀 ~ UserService ~ verifyHost= ~ error:", error);
      throw error;
    }
    // const checkOTP = await OTP.findOne({
    //   $and: [{ _uId: userId }, { _otp: otp }],
    // });

    // if (!checkOTP) throw Errors.ExpiredOtp;

    // const newUser = await Users.findByIdAndUpdate(
    //   userId,
    //   { _isHost: true },
    //   { new: true }
    // );

    // if (!newUser) Errors.SaveToDatabaseFail;

    // return UserResponsesDTO.toResponse(newUser);
  };

  public verifyIdentity = async (
    userId: string,
    image_front: Express.Multer.File,
    image_back: Express.Multer.File,
    session: ClientSession
  ) => {
    try {
      let result;
      // Check user is Block Host
      const userBlock = await UserBlocked.findOne({
        _uId: new mongoose.Types.ObjectId(userId),
      }).session(session);
      if (userBlock) throw Errors.UserIsBlocked;

      const base64_front = image_front.buffer.toString("base64");
      const base64_back = image_back.buffer.toString("base64");

      const data_front = await fetchIDRecognition(base64_front);

      // Check user is Block Host
      const userBlockIdentity = await UserBlocked.findOne({
        _idCard: data_front.id,
      }).session(session);
      if (userBlockIdentity) throw Errors.UserIsBlocked;
      //Check identity card is duplicate
      const indentity = await Indentities.findOne({
        $and: [{ _uId: { $ne: userId } }, { _idCard: data_front.id }],
      }).session(session);
      if (indentity) throw Errors.IDCardDuplicate;

      const data_back = await fetchIDRecognition(base64_back);
      const resultIndentity = { ...data_front, ...data_back };
      const checkIdentity = await Indentities.findOne({ _uId: userId }).session(
        session
      );

      if (checkIdentity) {
        const updateIndentity = await Indentities.findOneAndUpdate(
          { _uId: new mongoose.Types.ObjectId(userId) },
          {
            _idCard: resultIndentity.id,
            _name: resultIndentity.name,
            _dob: resultIndentity.dob,
            _home: resultIndentity.home,
            _address: resultIndentity.address,
            _gender: resultIndentity.sex,
            _nationality: resultIndentity.nationality
              ? resultIndentity.nationality
              : null,
            _features: resultIndentity.features,
            _issueDate: resultIndentity.issue_date,
            _doe: resultIndentity.doe ? resultIndentity.doe : null,
            _issueLoc: resultIndentity.issue_loc
              ? resultIndentity.issue_loc
              : null,
            _type: data_front.type_new ? data_front.type_new : data_front.type,
            _verified: false,
            _reason: null,
          },
          { session, new: true }
        );
        if (!updateIndentity) throw Errors.SaveToDatabaseFail;

        const updatedUser = await Users.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(userId) },
          { _isHost: false, _temptHostBlocked: true },
          { session, new: true }
        );
        if (!updatedUser) throw Errors.SaveToDatabaseFail;

        result = UserResponsesDTO.toResponse(updatedUser);
      } else {
        const newIndentity = await Indentities.create(
          [
            {
              _uId: new mongoose.Types.ObjectId(userId),
              _idCard: resultIndentity.id,
              _name: resultIndentity.name,
              _dob: resultIndentity.dob,
              _home: resultIndentity.home,
              _address: resultIndentity.address,
              _gender: resultIndentity.sex,
              _nationality: resultIndentity.nationality
                ? resultIndentity.nationality
                : null,
              _features: resultIndentity.features,
              _issueDate: resultIndentity.issue_date,
              _doe: resultIndentity.doe ? resultIndentity.doe : null,
              _issueLoc: resultIndentity.issue_loc
                ? resultIndentity.issue_loc
                : null,
              _type: data_front.type_new
                ? data_front.type_new
                : data_front.type,
            },
          ],
          { session }
        );
        if (newIndentity.length <= 0) throw Errors.SaveToDatabaseFail;

        result = newIndentity[0];
      }
      //Create notification for inspector
      const notification = CreateNotificationInspectorDTO.fromService({
        _uId: new mongoose.Types.ObjectId(userId),
        _type: "ACTIVE_HOST",
        _title: "Yêu cầu quyền host từ người dùng",
        _message: `Người dùng mang id ${userId} đã gửi yêu cầu quyền host. Vui lòng kiểm tra thông tin và cấp quyền cho người dùng này`,
      });
      const newNotification = await this.notificationService.createNotification(
        notification,
        session
      );
      if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

      //Emit event "sendNotification" for inspector
      eventEmitter.emit("sendNotification", {
        ...newNotification[0],
        recipientRole: 2,
      });

      await session.commitTransaction();
      return result;
    } catch (error) {
      console.log("🚀 ~ UserService ~ error:", error);
      throw error;
    }
  };

  public resetOTP = async (userId: string) => {
    const user = await Users.findById(userId);

    if (!user) throw Errors.UserNotFound;
    if (user._isHost) throw Errors.UserIsHosted;

    //Delete old OTP
    await OTP.deleteOne({ _uId: userId });

    //Create otp
    const otp: string = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    }).toString();

    //Create payload for sendEmail
    const payload: SendMailDTO = {
      email: user._email,
      subject: "Reset Otp ✔",
      text: "Here is your new OTP",
      html: `<b>Your code is ${otp}. This OTP will expired after 60 seconds</b>`,
    };
    await this.otpService.sendEmail(payload);

    //Save this otp to database
    const newOTP = await OTP.create({
      _uId: user._id,
      _otp: otp,
      expiredAt: Date.now(),
    });

    if (!newOTP) throw Errors.SaveToDatabaseFail;

    return true;
  };

  public getIdentityUser = async (userId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: userId }, { _active: true }],
    });

    const identity = await Indentities.findOne({
      $and: [{ _uId: userId }, { _verified: true }],
    });
    if (!identity) throw Errors.UserIdentityNotFound;

    return identity;
  };

  public registerAddress = async (
    addressInfo: CreateAddressDTO,
    img: Express.Multer.File[],
    session: ClientSession
  ) => {
    const user = await Users.findOne({ _id: addressInfo._uId });
    if (!user) throw Errors.UserNotFound;
    if (!user._isHost) throw Errors.Unauthorized;

    //Upload certificate images to firebase
    const urlCerf = await this.imageService.uploadCerf(
      img,
      addressInfo._uId.toString()
    );
    if (!urlCerf) throw Errors.UploadImageFail;

    const addressUser = await addressRental.create(
      [
        {
          _uId: addressInfo._uId,
          _address: addressInfo._address,
          _totalRoom: addressInfo._totalRoom ? addressInfo._totalRoom : 1,
          _imgLicense: urlCerf,
        },
      ],
      { session }
    );
    if (addressUser.length <= 0) throw Errors.SaveToDatabaseFail;
    console.log("🚀 ~ UserService ~ addressUser:", addressUser[0]._id);

    //create notification for inspector
    const notification = CreateNotificationRegisterAddressDTO.fromService({
      _uId: user._id,
      _addressId: addressUser[0]._id,
      _type: "REGISTER_ADDRESS",
      _title: "Yêu cầu đăng kí địa chỉ host",
      _message: `Người dùng mang id ${addressUser[0]._uId.toString()} đã gửi yêu cầu đăng kí địa chỉ phòng trọ. Vui lòng kiểm tra thông tin và cấp quyền cho người dùng này`,
    });
    console.log("🚀 ~ UserService ~ notification:", notification);
    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );
    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification" for inspector
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 2,
    });

    await session.commitTransaction();
    return addressUser[0];
  };

  public getAddressesByStatusUser = async (
    userId: string,
    status: number,
    pagination: Pagination
  ) => {
    const user = await Users.findOne({
      $and: [{ _id: userId }, { _active: true }],
    });
    if (!user) throw Errors.UserNotFound;

    if (status < 0 || status > 3) throw Errors.StatusInvalid;

    const count = await addressRental.countDocuments({
      $and: [{ _uId: userId }, { _status: status }],
    });
    if (count <= 0) throw Errors.AddressRentakNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    const addresses = await addressRental
      .find({ $and: [{ _uId: userId }, { _status: status }] })
      .sort({ createdAt: -1 })
      .limit(pagination.limit)
      .skip(pagination.offset);

    if (addresses.length <= 0) throw Errors.AddressRentakNotFound;

    return [
      addresses,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getAddressByIdUser = async (addressId: string, userId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: userId }, { _active: true }],
    });
    if (!user) throw Errors.UserNotFound;

    const address = await addressRental.findOne({
      $and: [{ _id: addressId }, { _uId: userId }],
    });
    if (!address) throw Errors.AddressRentakNotFound;

    return address;
  };

  public manageSatusOfAddressUser = async (
    status: number,
    userId: string,
    addressId: string,
    session: ClientSession
  ) => {
    const user = await Users.findOne({
      $and: [{ _id: userId }, { _active: true }],
    }).session(session);
    if (!user) throw Errors.UserNotFound;

    const address = await addressRental
      .findOne({
        $and: [{ _id: addressId }, { _uId: userId }],
      })
      .session(session);
    if (!address) throw Errors.AddressRentakNotFound;

    if (status !== 1 && status !== 3) throw Errors.StatusInvalid;

    const updateAddress = await addressRental.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressId) },
      { _status: status, _active: status === 1 ? true : false },
      { session, new: true }
    );
    if (!updateAddress) throw Errors.SaveToDatabaseFail;

    const index = user._addressRental.indexOf(updateAddress._address);

    if (status === 1 && index < 0) {
      user._addressRental.push(updateAddress._address);

      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId) },
        { _addressRental: user._addressRental },
        { session, new: true }
      );
      if (!updateUser) throw Errors.SaveToDatabaseFail;
    } else if (status === 3 && index >= 0) {
      user._addressRental.splice(index, 1);

      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId) },
        { _addressRental: user._addressRental },
        { session, new: true }
      );
      if (!updateUser) throw Errors.SaveToDatabaseFail;
    }

    await session.commitTransaction();
    return updateAddress;
  };

  public updateAddress = async (
    img: Express.Multer.File[],
    addressInfo: UpdateAddressDTO,
    session: ClientSession
  ) => {
    const user = await Users.findOne({
      $and: [{ _id: addressInfo._uId }, { _active: true }, { _isHost: true }],
    }).session(session);
    if (!user) throw Errors.UserNotFound;

    const address = await addressRental
      .findOne({
        $and: [
          { _id: addressInfo._id },
          { _uId: addressInfo._uId },
          { _status: 1 },
          { _active: true },
        ],
      })
      .session(session);
    if (!address) throw Errors.AddressRentakNotFound;

    const updateAddress = {
      _address: addressInfo._address || address._address,
      _totalRoom: addressInfo._totalRoom || address._totalRoom,
      _imgLicense: address._imgLicense,
      _status: 0,
      _active: address._active,
      _inspectorId: address._inspectorId,
      _reason: address._reason,
    };

    //Upload certificate images to firebase (if have)
    if (img.length > 0) {
      const urlCerf = await this.imageService.uploadCerf(img, addressInfo._uId);
      if (!urlCerf) throw Errors.UploadImageFail;

      updateAddress._imgLicense = urlCerf;
    }

    //Update address
    const updatedAddress = await addressRental.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(addressInfo._id),
      },
      updateAddress,
      { session, new: true }
    );
    if (!updatedAddress) throw Errors.SaveToDatabaseFail;

    //create notification for inspector
    const notification = CreateNotificationRegisterAddressDTO.fromService({
      _uId: user._id,
      _addressId: updatedAddress._id,
      _type: "UPDATE_ADDRESS",
      _title: "Thông báo cập nhật thông tin địa chỉ host",
      _message: `Người dùng mang id ${user._id} đã cập nhật thông tin địa chỉ phòng trọ. Vui lòng kiểm tra thông tin và cấp quyền cho người dùng này`,
    });
    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );
    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification" for inspector
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 2,
    });

    await session.commitTransaction();
    return updatedAddress;
  };

  public getUserPackages = async (userId: string) => {
    const user = await Users.findOne({
      $and: [{ _id: new mongoose.Types.ObjectId(userId) }, { _active: true }],
    });

    if (!user) throw Errors.UserNotFound;

    return {
      _totalPosts: user._totalPosts,
      _usePosts: user._usePosts,
    };
  };

  //Inspector
  public updateInspectorProfile = async (
    userParam: UpdateUserDTO,
    session: ClientSession
  ) => {
    const inspector = await Users.findOne({
      $and: [{ _id: userParam._uId }, { _role: 2 }, { _active: true }],
    }).session(session);
    if (!inspector) throw Errors.UserNotFound;

    const inspectorPhone = await Users.findOne({
      $and: [
        { _phone: userParam._phone },
        { _role: 2 },
        { _id: { $ne: userParam._uId } },
      ],
    }).session(session);
    if (inspectorPhone) throw Errors.PhonenumberDuplicate;

    const inspectorUpdated = await Users.findOneAndUpdate(
      { _id: userParam._uId },
      userParam,
      { session, new: true }
    );
    if (!inspectorUpdated) throw Errors.SaveToDatabaseFail;

    const _dob = convertUTCtoLocal(inspectorUpdated._dob);
    const newInspector = {
      ...inspectorUpdated.toObject(),
      _dob,
    };

    await session.commitTransaction();
    return UserResponsesDTO.toResponse(newInspector);
  };

  public updateInspectorAvatar = async (
    file: Express.Multer.File,
    uId: ObjectId,
    session: ClientSession
  ) => {
    const urlAvatar = await this.imageService.uploadAvatar(file);

    //Update avatar user
    const inspectorUpdated = await Users.findOneAndUpdate(
      { _id: uId },
      { _avatar: urlAvatar },
      {
        session,
        new: true,
      }
    );

    if (!inspectorUpdated) throw Errors.SaveToDatabaseFail;

    const _dob = convertUTCtoLocal(inspectorUpdated._dob);
    const newInspector = {
      ...inspectorUpdated.toObject(),
      _dob,
    };

    await session.commitTransaction();
    return UserResponsesDTO.toResponse(newInspector);
  };

  public updatePasswordInspector = async (
    userParam: UpdateInspectorPasswordDTO,
    session: ClientSession
  ) => {
    const inspector = await Users.findOne({
      $and: [{ _id: userParam._uId }, { _role: 2 }, { _active: true }],
    }).session(session);
    if (!inspector) throw Errors.UserNotFound;

    //Check old password
    const isValid = await compare(userParam._oldpw, inspector._pw);
    if (!isValid) throw Errors.OldpwInvalid;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const updateInspector = await Users.updateOne(
      { _id: userParam._uId },
      { _pw: userParam._pw },
      { session }
    );
    if (updateInspector.modifiedCount <= 0) throw Errors.SaveToDatabaseFail;

    await RefreshTokens.deleteMany({ _uId: userParam._uId }, { session });

    await session.commitTransaction();
    return { message: "Login againt!" };
  };

  public getActiveHostRequestsByStatus = async (
    status: number,
    pagination: Pagination
  ) => {
    let condition: PipelineStage;
    let count: number = 0;
    // Set condition and count follow status
    if (status === 0) {
      count = await Indentities.countDocuments({
        $and: [{ _verified: false }, { _reason: null }],
      });
      condition = {
        $match: { $and: [{ _verified: false }, { _reason: null }] },
      };
    } else if (status === 1) {
      count = await Indentities.countDocuments({ _verified: true });
      condition = { $match: { _verified: true } };
    } else if (status === 2) {
      count = await Indentities.countDocuments({
        $and: [{ _verified: false }, { _reason: { $ne: null } }],
      });
      condition = {
        $match: { $and: [{ _verified: false }, { _reason: { $ne: null } }] },
      };
    } else throw Errors.StatusInvalid;

    if (count <= 0) throw Errors.UserIdentityNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    if (pagination.page > totalPages) throw Errors.PageNotFound;

    const userIdentities = await Indentities.aggregate([
      condition,
      {
        $lookup: {
          from: "users",
          localField: "_uId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: 1,
          _uId: "$user._id",
          _name: 1,
          _dob: 1,
          _home: 1,
          _address: 1,
          _fullname: { $concat: ["$user._lname", " ", "$user._fname"] },
          updatedAt: 1,
        },
      },
    ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (userIdentities.length <= 0) throw Errors.UserIdentityNotFound;

    userIdentities.forEach((ident) => {
      ident._date = convertUTCtoLocal(ident.updatedAt);
      delete ident.updatedAt;
    });

    return [
      userIdentities,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getActiveHostRequestById = async (userId: string, notiId: string) => {
    const userIdentity = await Indentities.findOne({
      _uId: new mongoose.Types.ObjectId(userId),
    });
    if (!userIdentity) throw Errors.UserIdentityNotFound;

    if (notiId) {
      await Notification.findOneAndUpdate(
        {
          $and: [
            { _id: new mongoose.Types.ObjectId(notiId) },
            { _read: false },
          ],
        },
        { _read: true },
        { new: true }
      );
    }

    return userIdentity;
  };

  public sensorActiveHostRequest = async (
    identId: string,
    status: number,
    reason: string,
    inspectorId: string,
    session: ClientSession
  ) => {
    let updateObj = {};
    let notification: CreateNotificationInspectorDTO;
    const userIdentity = await Indentities.findOne({
      $and: [{ _id: identId }, { _reason: null }, { _verified: false }],
    }).session(session);
    if (!userIdentity) throw Errors.UserIdentityNotFound;

    if (status === 1) {
      updateObj = {
        ...updateObj,
        _verified: true,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: userIdentity._uId,
        _type: "ACTIVE_HOST_SUCCESS",
        _title: "Thông báo xác thực quyền host thành công",
        _message:
          "Thông tin của bạn đã được xác thực. Bạn đã có thể sử dụng quyền host (Đăng kí địa chỉ, Đăng bài)",
      });
    } else if (status === 2) {
      updateObj = {
        ...updateObj,
        _verified: false,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: userIdentity._uId,
        _type: "ACTIVE_HOST_FAIL",
        _title: "Thông báo xác thực quyền host thất bại",
        _message: `Thông tin của bạn không đúng. Lý do: ${reason}. Vui lòng kiểm tra lại thông tin và thử lại`,
      });
    } else throw Errors.StatusInvalid;

    const updateIdentity = await Indentities.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(identId) },
      updateObj,
      { session, new: true }
    );

    if (!updateIdentity) throw Errors.SaveToDatabaseFail;

    if (status === 1) {
      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userIdentity._uId) },
        { _isHost: true, _temptHostBlocked: false },
        { session, new: true }
      );

      if (!updateUser) throw Errors.SaveToDatabaseFail;
    }

    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );

    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;
    //Emit event "sendNotification" for inspector
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 0,
      recipientId: userIdentity._uId,
    });

    await session.commitTransaction();
    return updateIdentity;
  };

  public getAddressRequestsByStatus = async (
    status: number,
    pagination: Pagination
  ) => {
    if (status === -1) throw Errors.StatusInvalid;

    const count: number = await addressRental.countDocuments({
      _status: status,
    });
    if (count <= 0) throw Errors.UserIdentityNotFound;

    const totalPages = Math.ceil(count / pagination.limit);

    if (pagination.page > totalPages) throw Errors.PageNotFound;

    const addressRequests = await addressRental
      .aggregate([
        { $match: { _status: status } },
        {
          $lookup: {
            from: "users",
            localField: "_uId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $sort: { updatedAt: -1 } },
        {
          $project: {
            _id: 1,
            _uId: "$user._id",
            _address: 1,
            _totalRoom: 1,
            _imgLicense: 1,
            _fullname: { $concat: ["$user._lname", " ", "$user._fname"] },
            updatedAt: 1,
          },
        },
      ])
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (addressRequests.length <= 0) throw Errors.PageNotFound;

    addressRequests.forEach((address) => {
      address._date = convertUTCtoLocal(address.updatedAt);
      delete address.updatedAt;
    });

    return [
      addressRequests,
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getAddressRequestById = async (addressId: string, notiId: string) => {
    if (notiId) {
      const userId = await this.notificationService.getNotificationById(notiId);
      if (!userId) throw Errors.SaveToDatabaseFail;
    }
    const addressRequest = await addressRental.findOne({
      _id: new mongoose.Types.ObjectId(addressId),
    });
    if (!addressRequest) throw Errors.AddressRentakNotFound;

    return addressRequest;
  };

  public sensorAddressRequest = async (
    addressId: string,
    status: number,
    reason: string,
    inspectorId: string,
    session: ClientSession
  ) => {
    let updateObj = {};
    let notification: CreateNotificationInspectorDTO;
    let newAddressRental = [];

    const addressRequest = await addressRental
      .findOne({
        $and: [{ _id: addressId }, { _status: 0 }],
      })
      .session(session);
    console.log("🚀 ~ UserService ~ addressRequest:", addressRequest);
    if (!addressRequest) throw Errors.AddressRentakNotFound;

    const user = await Users.findOne({ _id: addressRequest._uId }).session(
      session
    );
    if (!user || !user._isHost) throw Errors.UserNotFound;

    if (status === 1) {
      updateObj = {
        ...updateObj,
        _status: 1,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: addressRequest._uId,
        _type: "REGISTER_ADDRESS_SUCCESS",
        _title: "Thông báo xác thực địa chỉ host thành công",
        _message:
          "Thông tin địa chỉ trọ của bạn đã được xác thực. Bạn đã có thể sử dụng địa chỉ này để đăng bài",
        _address: addressRequest._address,
      });
      console.log("🚀 ~ UserService ~ notification:", notification);
      newAddressRental = [...user._addressRental, addressRequest._address];
    } else if (status === 2) {
      updateObj = {
        ...updateObj,
        _status: 2,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: addressRequest._uId,
        _type: "REGISTER_ADDRESS_FAIL",
        _title: "Thông báo xác thực địa chỉ host thất bại",
        _message: `Thông tin địa chỉ của bạn không đúng. Lý do: ${reason}. Vui lòng kiểm tra lại thông tin và thử lại`,
      });
    } else throw Errors.StatusInvalid;

    const updateAddress = await addressRental.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressId) },
      updateObj,
      { session, new: true }
    );

    if (!updateAddress) throw Errors.SaveToDatabaseFail;

    if (newAddressRental.length > 0) {
      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(addressRequest._uId) },
        { _addressRental: newAddressRental },
        { session, new: true }
      );
      if (!updateUser) throw Errors.SaveToDatabaseFail;
    }

    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );

    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification" for inspector
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 0,
      recipientId: addressRequest._uId,
    });

    await session.commitTransaction();
    return updateAddress;
  };

  //Admin
  public getUserList = async (pagination: Pagination) => {
    const count = await Users.countDocuments({ _role: 0 });
    if (count <= 0) throw Errors.UserNotFound;

    const totalPages = Math.ceil(count / pagination.limit);
    const users = await Users.find({ _role: 0 })
      .sort({ _active: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (users.length <= 0) throw Errors.PageNotFound;

    return [
      UserResponsesDTO.toResponse(users),
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public getInspectorList = async (pagination: Pagination) => {
    const count = await Users.countDocuments({ _role: 2 });
    if (count <= 0) throw Errors.UserNotFound;

    const totalPages = Math.ceil(count / pagination.limit);
    const inspectors = await Users.find({ _role: 2 })
      .sort({ _active: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit);

    if (inspectors.length <= 0) throw Errors.PageNotFound;

    return [
      UserResponsesDTO.toResponse(inspectors),
      { page: pagination.page, limit: pagination.limit, total: totalPages },
    ];
  };

  public createInspector = async (
    userParam: CreateUserRequestDTO,
    session: ClientSession
  ) => {
    const inspector = await Users.findOne({
      $and: [{ _email: userParam._email }, { _role: 2 }, { _active: true }],
    }).session(session);

    if (inspector) throw Errors.Duplicate;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const newInspector = await Users.create(
      [
        {
          _email: userParam._email,
          _pw: userParam._pw,
          _role: 2,
        },
      ],
      { session }
    );
    if (newInspector.length <= 0) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return UserResponsesDTO.toResponse(newInspector[0]);
  };

  public blockInspector = async (inspectID: string, session: ClientSession) => {
    const inspector = await Users.findOne({
      $and: [{ _id: inspectID }, { _role: 2 }],
    }).session(session);
    if (!inspector) throw Errors.UserNotFound;

    const blockInspector = await Users.findOneAndUpdate(
      { _id: inspectID },
      { _active: !inspector._active },
      { session, new: true }
    );
    if (!blockInspector) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return { message: "Block inspector successfully" };
  };

  public getInspectorById = async (inspectId: string) => {
    const inspector = await Users.findOne({
      $and: [{ _id: inspectId }, { _role: 2 }, { _active: true }],
    });
    if (!inspector) throw Errors.UserNotFound;

    const _dob = convertUTCtoLocal(inspector._dob);
    const newInspector = {
      ...inspector.toObject(),
      _dob,
    };

    return UserResponsesDTO.toResponse(newInspector);
  };

  public updatePassInspector = async (
    userParam: UpdateInspectorPassDTO,
    session: ClientSession
  ) => {
    const inspector = await Users.findOne({
      $and: [{ _id: userParam._inspectId }, { _role: 2 }, { _active: true }],
    }).session(session);
    if (!inspector) throw Errors.UserNotFound;

    //Check password and password confirm
    if (userParam._pw !== userParam._pwconfirm) throw Errors.PwconfirmInvalid;

    const updateInspector = await Users.updateOne(
      { _id: userParam._inspectId },
      { _pw: userParam._pw },
      { session }
    );
    if (updateInspector.modifiedCount <= 0) throw Errors.SaveToDatabaseFail;

    await session.commitTransaction();
    return { message: "Update password successfull" };
  };

  public sensorActiveHostRequestAdmin = async (
    identId: string,
    status: number,
    reason: string,
    inspectorId: string,
    session: ClientSession
  ) => {
    let updateObj = {};
    let notification: CreateNotificationInspectorDTO;
    const userIdentity = await Indentities.findOne({
      $and: [{ _id: identId }],
    }).session(session);
    if (!userIdentity) throw Errors.UserIdentityNotFound;

    if (status === 1) {
      updateObj = {
        ...updateObj,
        _verified: true,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: userIdentity._uId,
        _type: "ACTIVE_HOST_SUCCESS",
        _title: "Thông báo xác thực quyền host thành công",
        _message:
          "Thông tin của bạn đã được xác thực. Bạn đã có thể sử dụng quyền host (Đăng kí địa chỉ, Đăng bài)",
      });
    } else if (status === 2) {
      updateObj = {
        ...updateObj,
        _verified: false,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: userIdentity._uId,
        _type: "ACTIVE_HOST_FAIL",
        _title: "Thông báo xác thực quyền host thất bại",
        _message: `Thông tin của bạn không đúng. Lý do: ${reason}. Vui lòng kiểm tra lại thông tin và thử lại`,
      });
    } else throw Errors.StatusInvalid;

    const updateIdentity = await Indentities.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(identId) },
      updateObj,
      { session, new: true }
    );

    if (!updateIdentity) throw Errors.SaveToDatabaseFail;

    if (status === 1) {
      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userIdentity._uId) },
        { _isHost: true, _temptHostBlocked: false },
        { session, new: true }
      );

      if (!updateUser) throw Errors.SaveToDatabaseFail;
    } else {
      const updateUser = await Users.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userIdentity._uId) },
        { _isHost: false },
        { session, new: true }
      );

      if (!updateUser) throw Errors.SaveToDatabaseFail;
    }

    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );

    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification" for inspector
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 0,
      recipientId: userIdentity._uId,
    });

    await session.commitTransaction();
    return updateIdentity;
  };

  public sensorAddressRequestAdmin = async (
    addressId: string,
    status: number,
    reason: string,
    inspectorId: string,
    session: ClientSession
  ) => {
    let updateObj = {};
    let notification: CreateNotificationInspectorDTO;
    let newAddressRental = [];

    const addressRequest = await addressRental
      .findOne({
        $and: [{ _id: addressId }],
      })
      .session(session);
    if (!addressRequest) throw Errors.AddressRentakNotFound;

    const user = await Users.findOne({ _id: addressRequest._uId }).session(
      session
    );
    if (!user || !user._isHost) throw Errors.UserNotFound;

    if (status === 1) {
      updateObj = {
        ...updateObj,
        _status: 1,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: addressRequest._uId,
        _type: "REGISTER_ADDRESS_SUCCESS",
        _title: "Thông báo xác thực địa chỉ host thành công",
        _message:
          "Thông tin địa chỉ trọ của bạn đã được xác thực. Bạn đã có thể sử dụng địa chỉ này để đăng bài",
        _address: addressRequest._address,
      });
      newAddressRental = [...user._addressRental, addressRequest._address];
    } else if (status === 2) {
      updateObj = {
        ...updateObj,
        _status: 2,
        _reason: reason,
        _inspectorId: new mongoose.Types.ObjectId(inspectorId),
      };
      notification = CreateNotificationInspectorDTO.fromService({
        _uId: addressRequest._uId,
        _type: "REGISTER_ADDRESS_FAIL",
        _title: "Thông báo xác thực địa chỉ host thất bại",
        _message: `Thông tin địa chỉ của bạn không đúng. Lý do: ${reason}. Vui lòng kiểm tra lại thông tin và thử lại`,
      });
      const index = user._addressRental.indexOf(addressRequest._address);
      user._addressRental.splice(index, 1);
      newAddressRental = user._addressRental;
    } else throw Errors.StatusInvalid;

    const updateAddress = await addressRental.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressId) },
      updateObj,
      { session, new: true }
    );

    if (!updateAddress) throw Errors.SaveToDatabaseFail;

    const updateUser = await Users.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(addressRequest._uId) },
      { _addressRental: newAddressRental },
      { session, new: true }
    );
    if (!updateUser) throw Errors.SaveToDatabaseFail;

    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );

    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification" for inspector
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 0,
      recipientId: addressRequest._uId,
    });

    await session.commitTransaction();
    return updateAddress;
  };

  public getUserByEmailOrId = async (keyword: string) => {
    const checkEmail = keyword.includes("@");

    if (checkEmail) {
      const user = await Users.findOne({
        $and: [{ _email: keyword }, { _role: 0 }, { _isHost: false }],
      });
      if (!user) throw Errors.UserNotFound;

      return user;
    } else {
      const user = await Users.findOne({
        $and: [
          { _id: new mongoose.Types.ObjectId(keyword) },
          { _role: 0 },
          { _isHost: false },
        ],
      });
      if (!user) throw Errors.UserNotFound;

      return user;
    }
  };

  public getHostByEmailOrId = async (keyword: string) => {
    const checkEmail = keyword.includes("@");

    if (checkEmail) {
      const user = await Users.aggregate([
        {
          $match: {
            $or: [
              { $and: [{ _email: keyword }, { _role: 0 }, { _isHost: true }] },
              {
                $and: [
                  { _email: keyword },
                  { _role: 0 },
                  { _temptHostBlocked: true },
                ],
              },
            ],
          },
        },
        {
          $lookup: {
            from: "address-rentals",
            localField: "_id",
            foreignField: "_uId",
            as: "address",
          },
        },
        {
          $unwind: {
            path: "$address",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            _name: {
              $concat: ["$_lname", " ", "$_fname"],
            },
            _email: 1,
            _avatar: 1,
            _phone: 1,
            _isHost: 1,
            _role: 1,
            _address: {
              $ifNull: ["$address._address", null],
            },
          },
        },
      ]);
      if (!user[0]) throw Errors.UserNotFound;

      return user[0];
    } else {
      const user = await Users.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [
                  { _id: new mongoose.Types.ObjectId(keyword) },
                  { _role: 0 },
                  { _isHost: true },
                ],
              },
              {
                $and: [
                  { _id: new mongoose.Types.ObjectId(keyword) },
                  { _role: 0 },
                  { _temptHostBlocked: true },
                ],
              },
            ],
          },
        },
        {
          $lookup: {
            from: "address-rentals",
            localField: "_id",
            foreignField: "_uId",
            as: "address",
          },
        },
        {
          $unwind: {
            path: "$address",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            _name: {
              $concat: ["$_lname", " ", "$_fname"],
            },
            _email: 1,
            _avatar: 1,
            _phone: 1,
            _isHost: 1,
            _role: 1,
            _address: {
              $ifNull: ["$address._address", null],
            },
          },
        },
      ]);
      if (!user[0]) throw Errors.UserNotFound;

      return user[0];
    }
  };

  public getEmployeeByEmailOrId = async (keyword: string) => {
    const checkEmail = keyword.includes("@");

    if (checkEmail) {
      const user = await Users.findOne({
        $and: [{ _email: keyword }, { _role: 2 }],
      });
      if (!user) throw Errors.UserNotFound;

      return user;
    } else {
      const user = await Users.findOne({
        $and: [{ _id: new mongoose.Types.ObjectId(keyword) }, { _role: 2 }],
      });
      if (!user) throw Errors.UserNotFound;

      return user;
    }
  };

  public getUserBlockedByEmailOrId = async (keyword: string) => {
    const checkEmail = keyword.includes("@");

    if (checkEmail) {
      const user = await UserBlocked.findOne({ _email: keyword });
      if (!user) throw Errors.UserNotFound;

      return user;
    } else {
      const user = await UserBlocked.findOne({ _id: keyword });
      if (!user) throw Errors.UserNotFound;

      return user;
    }
  };

  //For Admin and Inspector
  public searchIdentity = async (numberCard: string, sensor: boolean) => {
    //Check keyword is email or idCard
    const identity = await Indentities.findOne({
      $and: [{ _idCard: numberCard }, { _verified: sensor }],
    });

    if (!identity) throw Errors.UserIdentityNotFound;

    return identity;
  };

  public searchAddress = async (
    keyword: string,
    active: boolean,
    pagination: Pagination
  ) => {
    //Check keyword is email
    const checkEmail = keyword.includes("@");
    if (checkEmail) {
      const user = await Users.findOne({
        $or: [
          { $and: [{ _email: keyword }, { _role: 0 }, { _isHost: true }] },
          {
            $and: [
              { _email: keyword },
              { _role: 0 },
              { _temptHostBlocked: true },
            ],
          },
        ],
      });
      if (!user) throw Errors.UserNotFound;

      //count total address
      const count = await addressRental.countDocuments({
        $and: [{ _uId: user._id }, { _active: active }],
      });
      if (count <= 0) throw Errors.AddressRentakNotFound;

      //Caculate total page
      const totalPages = Math.ceil(count / pagination.limit);
      if (pagination.page > totalPages) throw Errors.PageNotFound;
      //Find address of host
      const addresses = await addressRental
        .aggregate([
          { $match: { $and: [{ _uId: user._id }, { _active: active }] } },
          {
            $lookup: {
              from: "users",
              localField: "_uId",
              foreignField: "_id",
              as: "host",
            },
          },
          { $unwind: "$host" },
          {
            $project: {
              _id: 1,
              _uId: 1,
              _address: 1,
              _totalRoom: 1,
              _imgLicense: 1,
              _status: 1,
              _active: 1,
              _inspectorId: 1,
              _reason: 1,
              createdAt: 1,
              updatedAt: 1,
              _hostName: {
                $concat: ["$host._fname", " ", "$host._lname"],
              },
            },
          },
        ])
        .skip(pagination.offset)
        .limit(pagination.limit);

      if (addresses.length <= 0) throw Errors.AddressRentakNotFound;

      addresses.forEach((address) => {
        address._localCreatedAt = convertUTCtoLocal(address.createdAt);
        delete address.createdAt;
      });

      return [
        addresses,
        { page: pagination.page, limit: pagination.limit, total: totalPages },
      ];
    } else {
      const totalAddresses = await addressRental.countDocuments({
        $or: [
          {
            $and: [
              { _uId: new mongoose.Types.ObjectId(keyword) },
              { _active: active },
            ],
          },
          {
            $and: [
              { _id: new mongoose.Types.ObjectId(keyword) },
              { _active: active },
            ],
          },
        ],
      });
      if (totalAddresses <= 0) throw Errors.AddressRentakNotFound;

      const totalPages = Math.ceil(totalAddresses / pagination.limit);
      if (pagination.page > totalPages) throw Errors.PageNotFound;
      //find address of host
      const addresses = await addressRental
        .aggregate([
          {
            $match: {
              $or: [
                {
                  $and: [
                    { _uId: new mongoose.Types.ObjectId(keyword) },
                    { _active: active },
                  ],
                },
                {
                  $and: [
                    { _id: new mongoose.Types.ObjectId(keyword) },
                    { _active: active },
                  ],
                },
              ],
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_uId",
              foreignField: "_id",
              as: "host",
            },
          },
          { $unwind: "$host" },
          {
            $project: {
              _id: 1,
              _uId: 1,
              _address: 1,
              _totalRoom: 1,
              _imgLicense: 1,
              _status: 1,
              _active: 1,
              _inspectorId: 1,
              _reason: 1,
              createdAt: 1,
              updatedAt: 1,
              _hostName: {
                $concat: ["$host._fname", " ", "$host._lname"],
              },
              _hostEmail: "$host._email",
            },
          },
        ])
        .skip(pagination.offset)
        .limit(pagination.limit);
      if (addresses.length <= 0) throw Errors.AddressRentakNotFound;

      addresses.forEach((address) => {
        address._localCreatedAt = convertUTCtoLocal(address.createdAt);
        delete address.createdAt;
      });
      console.log(
        "🚀 ~ UserService ~ addresses.forEach ~ addresses:",
        addresses
      );

      return [
        addresses,
        { page: pagination.page, limit: pagination.limit, total: totalPages },
      ];
    }
  };

  //Automaticly
  public increaseTotalReported = async (
    userId: string,
    session: ClientSession
  ) => {
    const user = await Users.findOne({ _id: userId }).session(session);
    if (!user) throw Errors.UserNotFound;

    //Increase total reported
    const totalReported = user._totalReported + 1;
    const updateUser = await Users.findOneAndUpdate(
      { _id: userId },
      { _totalReported: totalReported },
      { session, new: true }
    );
    if (!updateUser) throw Errors.SaveToDatabaseFail;

    return true;
  };

  public blockUser = async (userId: string, session: ClientSession) => {
    const user = await Users.findOne({ _id: userId }).session(session);
    if (!user) throw Errors.UserNotFound;
    //console.log("🚀 ~ UserService ~ blockUser= ~ user:", user);

    const identity = await Indentities.findOne({ _uId: userId }).session(
      session
    );

    //Block user
    const updateUser = await Users.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { _isHost: false, _temptHostBlocked: false },
      { session, new: true }
    );
    console.log("🚀 ~ UserService ~ blockUser= ~ identity:", identity);
    if (!updateUser) throw Errors.SaveToDatabaseFail;

    //Create block user
    const userBlock = await UserBlocked.create(
      [
        {
          _uId: new mongoose.Types.ObjectId(userId),
          _idCard: identity ? identity._idCard : null,
          _email: user._email,
          _phone: user._phone,
          _reason: "Có 3 bài viết bị báo cáo",
        },
      ],
      { session }
    );
    if (userBlock.length <= 0) throw Errors.SaveToDatabaseFail;
    console.log("🚀 ~ UserService ~ blockUser= ~ userBlock:", userBlock);

    //Block all posts of user
    await Posts.updateMany(
      { _uId: new mongoose.Types.ObjectId(userId) },
      { _active: false, _status: 4 },
      { session }
    );

    //create notification for user
    const notification = CreateNotificationDTO.fromService({
      _uId: new mongoose.Types.ObjectId(userId),
      _type: "BLOCK_USER",
      _title: "Thông báo khóa tài khoản",
      _message: `Tài khoản của bạn đã bị khóa chức năng host do có 3 bài viết bị báo cáo. Vui lòng liên hệ với admin nếu có sai sót`,
    });
    const newNotification = await this.notificationService.createNotification(
      notification,
      session
    );
    if (newNotification.length <= 0) throw Errors.SaveToDatabaseFail;

    //Emit event "sendNotification" for inspector
    eventEmitter.emit("sendNotification", {
      ...newNotification[0],
      recipientRole: 0,
      recipientId: userId,
    });

    return userBlock[0];
  };

  public blockUserAccount = async (userId: string, session: ClientSession) => {
    const user = await Users.findOne({ _id: userId }).session(session);
    if (!user) throw Errors.UserNotFound;
    console.log("🚀 ~ UserService ~ blockUser= ~ user:", user);

    //Block user
    const updateUser = await Users.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { _active: false },
      { session, new: true }
    );
    if (!updateUser) throw Errors.SaveToDatabaseFail;

    //Create block user
    const userBlock = await UserBlocked.create(
      [
        {
          _uId: new mongoose.Types.ObjectId(userId),
          _email: user._email,
          _phone: user?._phone,
          _reason: "Có 3 bài viết bị báo cáo",
        },
      ],
      { session }
    );
    if (userBlock.length <= 0) throw Errors.SaveToDatabaseFail;

    //Block all social posts of user
    await SocialPosts.updateMany(
      { _uId: new mongoose.Types.ObjectId(userId) },
      { _status: 2, _reason: ["Do tài khoản bị khóa"] },
      { session }
    );

    return userBlock[0];
  };
}
