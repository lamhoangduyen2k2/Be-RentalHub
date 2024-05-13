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
import { Server } from "socket.io";
//import bodyParser from "body-parser";

(async () => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "http://localhost:4200" } });
  let onlineUsers: { userId: string; socketId: string }[] = [];

  const port = 3000;
  dayjs.extend(utc);
  dayjs.extend(timezone);
  //dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(compression());
  app.use(helmet());
  app.use(
    cors({
      origin: "http://localhost:4200",
    })
  );
  app.use(morgan("combined"));
  app.set("view engine", "ejs");

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

  io.on("connection", (socket) => {
    console.log("New connection: ", socket.id);
  
    //listen to a connection
    socket.on("addNewUser", (userId: string) => {
      if (userId) {
        !onlineUsers.some((user) => user.userId === userId) &&
          onlineUsers.push({
            userId,
            socketId: socket.id,
          });
      }
      io.emit("getOnlineUsers", onlineUsers);
    });
  
    //add message
    socket.on("sendMessage", (message) => {
      const recipient = onlineUsers.find(
        (user) => user.userId === message.recipientId
      );
  
      if (recipient) {
        io.to(recipient.socketId).emit("getMessage", message);
      }
    });
  
    socket.on("disconnect", () => {
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      io.emit("getOnlineUsers", onlineUsers);
    });
  });

  app.use(erroHandler);

  server.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
  });
})();
