/* eslint-disable @typescript-eslint/no-unused-vars */
import "reflect-metadata";
import "dotenv/config";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import DBconnect from "./database/database";
import route from "./modules/posts/posts.route";
import routerUser from "./modules/user/routes/user.route";
import erroHandler from "./helpers/handle-errors";
import { initializeApp } from "firebase/app";
import config from "./database/firebase.config";
import routerImg from "./modules/image/image.route";
import inspectorRoute from "./modules/user/routes/inspectors.route";
import notifiRoute from "./modules/notification/notification.route";
import adminRoute from "./modules/user/routes/admin.route";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import statisRoute from "./modules/statistic/statistic.route";
import "./modules/auth/passport";
import authRoute from "./modules/auth/auth.route";
import chatRoute from "./modules/chats/chat.route";
import messageRoute from "./modules/messages/message.route";
import http from "http";
//import { Server } from "socket.io";
import eventEmitter from "./modules/socket/socket";
import socialRoute from "./modules/social-posts/social-posts.route";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import commentsRoute from "./modules/comments/comments.route";
import { engine } from "express-handlebars";
import { join } from "path";
import payRoute from "./modules/vnpay/vnpay.route";
//import bodyParser from "body-parser";

(async () => {
  const app = express();

  // Trust the `x-forwarded-for` header, then set it to `req.ip`
  //app.set("trust proxy", true);

  const server = http.createServer(app);
  //Config allow ports
  const allowedOrigins = [
    "http://localhost:4200",
    "http://localhost:4201",
    "http://localhost:4202",
  ];
  //Setup cors options
  const corsOptions = {
    origin: (origin, callback) => {
      console.log("🚀 ~ origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };
  //Config socket.io
  const io = new Server(server, { cors: corsOptions });
  // //List of online users
  let onlineUsers: { userId: string; socketId: string }[] = [];
  let onlineInspectors: { userId: string; socketId: string }[] = [];
  const onlineAdmins = {
    userId: "65418310bec0ba49c4d9a276",
    socketId: "",
  };

  const port = 3000;
  dayjs.extend(utc);
  dayjs.extend(timezone);
  //dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

  //Init socket
  //const io = initSocket(server, corsOptions);

  const hbs = engine({
    extname: "hbs",
    defaultLayout: "main",
    encoding: "utf-8",
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP
      hsts: false, // Disable HSTS
      frameguard: false, // Disable frameguard
      xssFilter: false, // Disable XSS filter
      noSniff: false, // Disable noSniff
      ieNoOpen: false, // Disable ieNoOpen
    })
  );
  app.use(cors({ credentials: true, origin: true }));

  app.use(morgan("combined"));
  app.use(cookieParser());

  app.engine("hbs", hbs);
  app.set("view engine", "hbs");
  app.set("views", join(__dirname, "../", "views"));
  app.set("view layouts", join(__dirname, "../", "views", "layouts"));

  await DBconnect();

  //Initialize a firebase application
  initializeApp(config.firebaseConfig);

  app.use("/api/users", routerUser);
  app.use("/api/posts", route);
  app.use("/api/notification", notifiRoute);
  app.use("/api/upload", routerImg);
  app.use("/api/inspector", inspectorRoute);
  app.use("/api/admin", adminRoute);
  app.use("/api/statistic", statisRoute);
  app.use("/api/auth", authRoute);
  app.use("/api/chat", chatRoute);
  app.use("/api/message", messageRoute);
  app.use("/api/social", socialRoute);
  app.use("/api/reaction", socialRoute);
  app.use("/api/comment", commentsRoute);

  app.use("/order", payRoute);

  io.on("connection", (socket) => {
    console.log("🚀 ~ New connection ~ socket:", socket.id);

    //listen to a connection
    socket.on("addNewUser", (user) => {
      console.log("🚀 ~ socket.on ~ user:", user)
      if (user.userId === onlineAdmins.userId) {
        //Add admin to online of Users
        !onlineUsers.some((u) => u.userId === user.userId) &&
          onlineUsers.push({
            userId: user.userId,
            socketId: socket.id,
          });

        //Add admin to online of Inspectors
        !onlineInspectors.some((u) => u.userId === user.userId) &&
          onlineInspectors.push({
            userId: user.userId,
            socketId: socket.id,
          });
      } else if (user.role === 0) {
        !onlineUsers.some((u) => u.userId === user.userId) &&
          onlineUsers.push({
            userId: user.userId,
            socketId: socket.id,
          });
      } else {
        if (user.userId === onlineAdmins.userId)
          onlineAdmins.socketId = socket.id;
        !onlineInspectors.some((u) => u.userId === user.userId) &&
          onlineInspectors.push({
            userId: user.userId,
            socketId: socket.id,
          });
      }
      //Get users online list for customer
      io.emit("getOnlineUsers", onlineUsers);
      console.log("🚀 ~ socket.on ~ onlineUsers:", onlineUsers);
      console.log("🚀 ~ socket.on ~ onlineInspectors:", onlineInspectors);
      //Get admin online for user
      //io.emit("getOnlineAdmin", onlineAdmins);
    });

    //add message
    socket.on("sendMessage", (message) => {
      const recipient = onlineUsers.find(
        (user) => user.userId === message.recipientId
      );
      console.log("🚀 ~ socket.on ~ recipient:", recipient);

      if (recipient) {
        console.log("🚀 ~ socket.on ~ message:", message);
        io.to(recipient.socketId).emit("getMessage", message);
        io.to(recipient.socketId).emit("getUnreadMessage", {
          chatId: message.chatId,
          isRead: false,
          date: new Date(),
        });
      }
    });

    //send notifications
    if (eventEmitter.listenerCount("sendNotification") === 0) {
      eventEmitter.on("sendNotification", (notification) => {
        if (notification.recipientRole === 2) {
          // Send notification for all inspectors
          onlineInspectors.forEach((inspector) => {
            console.log("🚀 ~ eventEmitter.on ~ notification:", notification);
            io.to(inspector.socketId).emit(
              "getNotification",
              notification._doc
            );
          });
        } else if (notification.recipientRole === 0) {
          // Send notification for a specific user
          const recipient = onlineUsers.find(
            (user) => user.userId === notification.recipientId.toString()
          );
          if (recipient) {
            console.log("🚀 ~ eventEmitter.on ~ notification:", notification);
            io.to(recipient.socketId).emit(
              "getNotification",
              notification._doc
            );
          }
        }
      });
    }

    console.log(
      "Listener count for sendNotification:",
      eventEmitter.listenerCount("sendNotification")
    );

    socket.on("disconnect", () => {
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      onlineInspectors = onlineInspectors.filter(
        (user) => user.socketId !== socket.id
      );
      io.emit("getOnlineUsers", onlineUsers);
      console.log("🚀 ~ socket.on.disconnect ~ onlineUsers:", onlineUsers);
      console.log(
        "🚀 ~ socket.on.disconnect ~ onlineInspectors:",
        onlineInspectors
      );
      //io.emit("getOnlineInspectors", onlineInspectors);
    });
  });

  app.use(erroHandler);

  server.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
  });
})();
