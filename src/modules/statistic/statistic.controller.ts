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
}