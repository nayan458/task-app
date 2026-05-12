import { Module } from '@nestjs/common';
import { TaskManagerController } from './task-manager.controller';
import { TaskManagerService } from './task-manager.service';
import { DatabaseModule } from 'libs/database';

@Module({
  imports: [
    DatabaseModule.forRoot('MONGO_URI')
  ],
  controllers: [TaskManagerController],
  providers: [TaskManagerService],
})
export class TaskManagerModule {}
