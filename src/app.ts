import "reflect-metadata";
import "dotenv/config";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import DBconnect from "./database/database";
import route from "./modules/posts/posts.route";
import routerUser from "./modules/user/user.route";
import erroHandler from "./helpers/handle-errors";
import { initializeApp } from "firebase/app";
import config from "./database/firebase.config";
import routerImg from "./modules/image/image.route";
//import bodyParser from "body-parser";

(async () => {
  const app = express();
  const port = 3000;

  app.use(express.json());
  app.use(compression());
  app.use(helmet());
  app.use(cors());
  app.use(morgan("combined"));

  await DBconnect();

  //Initialize a firebase application
  initializeApp(config.firebaseConfig);

  app.use("/api/users", routerUser);
  app.use("/api/posts", route);
  app.use("/api/upload", routerImg);

  app.use(erroHandler);

  app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
  });
})();
