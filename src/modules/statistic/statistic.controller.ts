import { Inject, Service } from "typedi";
import { StatisticService } from "./statistic.service";
import { NextFunction, Request, Response } from "express";
import { ResponseData } from "../../helpers/response";

@Service()
export class StatisticController {
    constructor(@Inject() private statisticService: StatisticService) {}

    public countAllUsers = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const totalUser = await this.statisticService.CountAllUsers();
            res.json(new ResponseData(totalUser, null, null));
        } catch (error) {
            next(error);
        }
    }

    public getFiveRecentYear = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const listYear = await this.statisticService.getFiveRecentYear();
            res.json(new ResponseData(listYear, null, null));
        } catch (error) {
            next(error);
        }
    }

    public countNewUserByMonth = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const year = isNaN(Number(req.query.year)) ? new Date().getFullYear() : Number(req.query.year);
            const countNewUsers = await this.statisticService.countNewUserByMonth(year);
            res.json(new ResponseData(countNewUsers, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countNewUserByYear = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const year = isNaN(Number(req.query.year)) ? req.query.year.toString() : Number(req.query.year);
            const countNewUsers = await this.statisticService.countNewUserByYear(year);
            res.json(new ResponseData(countNewUsers, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countAllPosts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const totalPost = await this.statisticService.countAllPosts();
            res.json(new ResponseData(totalPost, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countPostsByMonth = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const year = isNaN(Number(req.query.year)) ? new Date().getFullYear() : Number(req.query.year);
            const countPosts = await this.statisticService.countPostByMonth(year);
            res.json(new ResponseData(countPosts, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countPostsByYear = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            console.log("🚀 ~ StatisticController ~ req.query.year:", req.query.year)
            const year = isNaN(Number(req.query.year)) ? req.query.year.toString() : Number(req.query.year);
            const countPosts = await this.statisticService.countPostByYear(year);
            res.json(new ResponseData(countPosts, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countPostsByStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const countPosts = await this.statisticService.countPostByStatus();
            res.json(new ResponseData(countPosts, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public getUserData = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userData = await this.statisticService.getUserData();
            res.json(new ResponseData(userData, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public getHostData = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const hostData = await this.statisticService.getHostData();
            res.json(new ResponseData(hostData, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countAllHost = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const totalHost = await this.statisticService.countAllHost();
            res.json(new ResponseData(totalHost, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countHostByMonth = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const year = isNaN(Number(req.query.year)) ? new Date().getFullYear() : Number(req.query.year);
            const countHosts = await this.statisticService.countHostByMonth(year);
            res.json(new ResponseData(countHosts, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countHostByYear = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const year = isNaN(Number(req.query.year)) ? req.query.year.toString() : Number(req.query.year);
            const countHosts = await this.statisticService.countHostByYear(year);
            res.json(new ResponseData(countHosts, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countHostByStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const countHosts = await this.statisticService.countHostByStatus();
            res.json(new ResponseData(countHosts, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countAllInspector = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const totalInspector = await this.statisticService.countAllInspector();
            res.json(new ResponseData(totalInspector, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public getInspectorData = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const inspectorData = await this.statisticService.getInspectorData();
            res.json(new ResponseData(inspectorData, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countInspectorByMonth = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const year = isNaN(Number(req.query.year)) ? new Date().getFullYear() : Number(req.query.year);
            const countInspectors = await this.statisticService.countInspectorByMonth(year);
            res.json(new ResponseData(countInspectors, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countInspectorByYear = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const year = isNaN(Number(req.query.year)) ? req.query.year.toString() : Number(req.query.year);
            const countInspectors = await this.statisticService.countInspectorByYear(year);
            res.json(new ResponseData(countInspectors, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }

    public countInspectorByStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const countInspectors = await this.statisticService.countInspectorByStatus();
            res.json(new ResponseData(countInspectors, null, null));
        } catch (error) {
            console.log("🚀 ~ StatisticController ~ error:", error)
            next(error);
        }
    }
}