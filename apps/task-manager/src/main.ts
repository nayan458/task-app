import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TaskManagerModule } from './task-manager.module';
import { ConfigService } from 'libs/config';
import { TASK_PACKAGE, TASK_PROTO_PATH } from 'libs/proto';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(TaskManagerModule, {
    bufferLogs: false,
  });
  const config = appCtx.get(ConfigService);
  const url = config.taskGrpcUrl;
  await appCtx.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TaskManagerModule,
    {
      transport: Transport.GRPC,
      options: {
        url,
        package: TASK_PACKAGE,
        protoPath: TASK_PROTO_PATH,
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
  Logger.log(`Task gRPC microservice listening on ${url}`, 'TaskBootstrap');
}

bootstrap();
