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

//import bodyParser from "body-parser";

(async () => {
  const app = express();
  const port = 3000;
  dayjs.extend(utc);
  dayjs.extend(timezone);
  //dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(compression());
  app.use(helmet());
  app.use(cors());
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

  app.use(erroHandler);

  app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
  });
})();
