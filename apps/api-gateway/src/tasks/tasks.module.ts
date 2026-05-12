import { Module } from '@nestjs/common';
import { ProtoModule, TASK_SERVICE } from 'libs/proto';
import { TasksGatewayController } from './tasks.controller';

@Module({
  imports: [ProtoModule.register({ services: [TASK_SERVICE] })],
  controllers: [TasksGatewayController],
})
export class TasksGatewayModule {}
