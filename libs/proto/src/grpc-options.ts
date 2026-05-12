import { ClientProviderOptions, Transport } from '@nestjs/microservices';
import {
  AUTH_PACKAGE,
  AUTH_PROTO_PATH,
  AUTH_SERVICE,
  TASK_PACKAGE,
  TASK_PROTO_PATH,
  TASK_SERVICE,
} from './constants';

export interface GrpcClientConfig {
  url: string;
}

export const authClientOptions = (cfg: GrpcClientConfig): ClientProviderOptions => ({
  name: AUTH_SERVICE,
  transport: Transport.GRPC,
  options: {
    url: cfg.url,
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
});

export const taskClientOptions = (cfg: GrpcClientConfig): ClientProviderOptions => ({
  name: TASK_SERVICE,
  transport: Transport.GRPC,
  options: {
    url: cfg.url,
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
});

export const authServerOptions = (cfg: GrpcClientConfig) => ({
  transport: Transport.GRPC,
  options: {
    url: cfg.url,
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
});

export const taskServerOptions = (cfg: GrpcClientConfig) => ({
  transport: Transport.GRPC,
  options: {
    url: cfg.url,
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
});
