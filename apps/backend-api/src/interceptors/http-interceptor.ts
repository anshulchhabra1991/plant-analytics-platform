import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { httpRequestDurationSeconds } from '../modules/metrics/metrics.service';
  
  @Injectable()
  export class MetricsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const now = Date.now();
      const request = context.switchToHttp().getRequest();
  
      return next.handle().pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          const duration = (Date.now() - now) / 1000;
          httpRequestDurationSeconds
            .labels(request.method, request.route?.path || request.url, response.statusCode)
            .observe(duration);
        }),
      );
    }
  }