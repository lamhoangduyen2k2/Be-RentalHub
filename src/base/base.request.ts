import { Request } from "express";

export interface BodyResquest<T> extends Request {
  body: T;
}
