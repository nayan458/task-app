import { Module } from '@nestjs/common';
import { ProtoModule, AUTH_SERVICE } from 'libs/proto';
import { AuthGatewayController } from './auth.controller';

@Module({
  imports: [ProtoModule.register({ services: [AUTH_SERVICE] })],
  controllers: [AuthGatewayController],
})
export class AuthGatewayModule {}
