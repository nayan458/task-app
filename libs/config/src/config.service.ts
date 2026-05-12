import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly nest: NestConfigService) {}

  private get<T>(key: string): T {
    return this.nest.getOrThrow<T>(key);
  }

  get nodeEnv(): 'development' | 'production' | 'test' {
    return this.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get gatewayHttpPort(): number {
    return Number(this.get('GATEWAY_HTTP_PORT'));
  }

  get authGrpcUrl(): string {
    return this.get('AUTH_GRPC_URL');
  }

  get taskGrpcUrl(): string {
    return this.get('TASK_GRPC_URL');
  }

  get mongoUri(): string {
    return this.get('MONGO_URI');
  }

  get jwtSecret(): string {
    return this.get('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.get('JWT_EXPIRES_IN');
  }

  get throttleTtl(): number {
    return Number(this.get('THROTTLE_TTL'));
  }

  get throttleLimit(): number {
    return Number(this.get('THROTTLE_LIMIT'));
  }

  get logLevel(): string {
    return this.get('LOG_LEVEL');
  }
}
