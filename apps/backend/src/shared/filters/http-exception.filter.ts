import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Đã xảy ra lỗi hệ thống';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        code = (body.code as string) || exception.name;
        message = (body.message as string) || exception.message;
        details = body.details;
        if (Array.isArray(body.message)) {
          message = body.message.join(', ');
        }
      } else {
        message = String(res);
      }
    }

    response.status(status).json({ code, message, details });
  }
}
