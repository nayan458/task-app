import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class DatabaseModule {
  static forRoot(connectionStringKey: string): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            uri: config.get<string>(connectionStringKey),
          }),
          inject: [ConfigService],
        }),
      ],
      exports: [MongooseModule],
    };
  }
}