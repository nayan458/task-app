import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import {
  AUTH_PACKAGE,
  AUTH_PROTO_PATH,
  AUTH_SERVICE,
  TASK_PACKAGE,
  TASK_PROTO_PATH,
  TASK_SERVICE,
} from './constants';

type ServiceName = typeof AUTH_SERVICE | typeof TASK_SERVICE;

interface RegisterOptions {
  services: ServiceName[];
}

const loaderOptions = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  arrays: true,
  objects: true,
};

@Module({})
export class ProtoModule {
  static register({ services }: RegisterOptions): DynamicModule {
    const clients = ClientsModule.registerAsync({
      isGlobal: false,
      clients: services.map((name) => ({
        name,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          if (name === AUTH_SERVICE) {
            return {
              transport: Transport.GRPC,
              options: {
                url: config.getOrThrow<string>('AUTH_GRPC_URL'),
                package: AUTH_PACKAGE,
                protoPath: AUTH_PROTO_PATH,
                loader: loaderOptions,
              },
            };
          }
          return {
            transport: Transport.GRPC,
            options: {
              url: config.getOrThrow<string>('TASK_GRPC_URL'),
              package: TASK_PACKAGE,
              protoPath: TASK_PROTO_PATH,
              loader: loaderOptions,
            },
          };
        },
      })),
    });

    return {
      module: ProtoModule,
      imports: [clients],
      exports: [clients],
    };
  }
}
