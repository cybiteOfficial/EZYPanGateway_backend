// error-logging.middleware.ts

import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class ErrorLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode}`);
    next();
  }
}
