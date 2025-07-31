import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  constructor(private readonly httpService: HttpService) {}

  async proxyRequest(method: string, url: string, data?: any, headers?: any) {
    try {
      const config = {
        method: method.toLowerCase(),
        url,
        ...(data && { data }),
        ...(headers && { headers }),
      };

      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error) {
      if ((error as any)?.response) {
        const data = (error as any).response.data || { error: 'Proxy request failed' };
        const status = (error as any).response.status || HttpStatus.INTERNAL_SERVER_ERROR;
        throw new HttpException(data, status);
      }
      throw new HttpException(
        { error: 'Service unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}