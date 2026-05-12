import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { ConfigService } from 'libs/config';
import { AUTH_PACKAGE, AUTH_PROTO_PATH } from 'libs/proto';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(AuthModule, {
    bufferLogs: false,
  });
  const config = appCtx.get(ConfigService);
  const url = config.authGrpcUrl;
  await appCtx.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.GRPC,
      options: {
        url,
        package: AUTH_PACKAGE,
        protoPath: AUTH_PROTO_PATH,
        loader: {
          keepCase: false,
          longs: String,
          enums: String,
          defaults: true,
          arrays: true,
          objects: true,
        },
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();
  Logger.log(`Auth gRPC microservice listening on ${url}`, 'AuthBootstrap');
}

bootstrap();
