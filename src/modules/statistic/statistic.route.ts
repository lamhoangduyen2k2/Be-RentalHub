import express from "express";
import Container from "typedi";
import { AuthenMiddWare } from "../auth/auth.middleware";
import { StatisticController } from "./statistic.controller";

const statisRoute = express.Router();
const authMiddleware = Container.get(AuthenMiddWare)
const statisticController = Container.get(StatisticController);

statisRoute.get("/count-all-users", authMiddleware.authorizedAdmin, statisticController.countAllUsers);
statisRoute.get("/get-recent-years", authMiddleware.authorizedAdmin, statisticController.getFiveRecentYear);
// statisRoute.get("/count-users-month", authMiddleware.authorizedAdmin, statisticController.countNewUserByMonth);
// statisRoute.get("/count-users-year", authMiddleware.authorizedAdmin, statisticController.countNewUserByYear);
statisRoute.get("/count-users-status", authMiddleware.authorizedAdmin, statisticController.countUserByStatus);
statisRoute.get("/count-all-posts", authMiddleware.authorizedAdmin, statisticController.countAllPosts);
statisRoute.get("/count-posts-month", authMiddleware.authorizedAdmin, statisticController.countPostsByMonth);
statisRoute.get("/count-posts-year", authMiddleware.authorizedAdmin, statisticController.countPostsByYear);
statisRoute.get("/count-posts-status", authMiddleware.authorizedAdmin, statisticController.countPostsByStatus);
statisRoute.get("/count-all-hosts", authMiddleware.authorizedAdmin, statisticController.countAllHost);
statisRoute.get("/get-host-data", authMiddleware.authorizedAdmin, statisticController.getHostData);
statisRoute.get("/get-user-data", authMiddleware.authorizedAdmin, statisticController.getUserData);
// statisRoute.get("/count-host-month", authMiddleware.authorizedAdmin, statisticController.countHostByMonth);
// statisRoute.get("/count-host-year", authMiddleware.authorizedAdmin, statisticController.countHostByYear);
statisRoute.get("/count-host-status", authMiddleware.authorizedAdmin, statisticController.countHostByStatus);
statisRoute.get("/count-all-inspectors", authMiddleware.authorizedAdmin, statisticController.countAllInspector);
statisRoute.get("/get-inspector-data", authMiddleware.authorizedAdmin, statisticController.getInspectorData);
statisRoute.get("/count-inspector-month", authMiddleware.authorizedAdmin, statisticController.countInspectorByMonth);
statisRoute.get("/count-inspector-year", authMiddleware.authorizedAdmin, statisticController.countInspectorByYear);
statisRoute.get("/count-inspector-status", authMiddleware.authorizedAdmin, statisticController.countInspectorByStatus);
statisRoute.get("/count-host-user-month", authMiddleware.authorizedAdmin, statisticController.countHostandUserByMonth);
statisRoute.get("/count-host-user-year", authMiddleware.authorizedAdmin, statisticController.countHostandUserByYear);
statisRoute.get("/count-employee-user-month", authMiddleware.authorizedAdmin, statisticController.countEmployeeandUserByMonth);
statisRoute.get("/count-employee-user-year", authMiddleware.authorizedAdmin, statisticController.countEmployeeandUserByYear);


export default statisRoute;