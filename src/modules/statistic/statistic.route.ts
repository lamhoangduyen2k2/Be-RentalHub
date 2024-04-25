import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { StatisticController } from "./statistic.controller";

const statisRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare)
const statisticController = Container.get(StatisticController);

statisRoute.get("/count-all-users", authMiddleware.authorizedAdmin, statisticController.countAllUsers);
statisRoute.get("/get-recent-years", authMiddleware.authorizedAdmin, statisticController.getFiveRecentYear);
statisRoute.get("/count-users-month", authMiddleware.authorizedAdmin, statisticController.countNewUserByMonth);
statisRoute.get("/count-users-year", authMiddleware.authorizedAdmin, statisticController.countNewUserByYear);

export default statisRoute;