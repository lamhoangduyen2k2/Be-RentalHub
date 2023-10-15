/* eslint-disable @typescript-eslint/no-explicit-any */

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
  total: string;
  page: string;
  limit: string;

  constructor(total: string, page: string, limit: string) {
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}
