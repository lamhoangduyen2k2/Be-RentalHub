/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request } from "express";
import { ErrorModel } from "./handle-errors";

export class ResponseData {
  data: any;
  error: ErrorModel;
  pagination: any;

  constructor(data: any, error: ErrorModel, pagination: any) {
    this.data = data;
    this.error = error;
    this.pagination = pagination;
  }
}

export class Pagination {
  offset: number;
  page: number;
  limit: number;

  constructor(offset: number, page: number, limit: number) {
    this.offset = offset;
    this.page = page;
    this.limit = limit;
  }

  static getPagination = (req: Request) => {
    const limit = isNaN(Number(req.query.limit)) ? 10 : Number(req.query.limit);
    const page = isNaN(Number(req.query.page)) ? 1 : Number(req.query.page);
    const offset = (page - 1) * limit;

    return { limit, page, offset };
  };
}

export class PaginationNotification {
  offset: number;
  page: number;
  limit: number;

  constructor(offset: number, page: number, limit: number) {
    this.offset = offset;
    this.page = page;
    this.limit = limit;
  }

  static getPagination = (req: Request) => {
    const limit = isNaN(Number(req.query.limit)) ? undefined : Number(req.query.limit);
    const page = isNaN(Number(req.query.page)) ? undefined : Number(req.query.page);
    const offset = (page - 1) * limit;

    return { limit, page, offset };
  };
}
