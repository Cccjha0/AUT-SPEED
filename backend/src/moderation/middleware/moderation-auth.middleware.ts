import type { NestMiddleware } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class ModerationAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ModerationAuthMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // TODO: integrate real authentication/authorization
    this.logger.debug(`Accessing moderation route: ${req.method} ${req.originalUrl}`);
    next();
  }
}
