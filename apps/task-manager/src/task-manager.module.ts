import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from 'libs/config';
import { DatabaseModule } from 'libs/database';
import { TaskManagerController } from './task-manager.controller';
import { TaskManagerService } from './task-manager.service';
import { TasksRepository } from './tasks.repository';
import { Task, TaskSchema } from './schemas/task.schema';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule.forRoot('MONGO_URI'),
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  controllers: [TaskManagerController],
  providers: [TaskManagerService, TasksRepository],
})
export class TaskManagerModule {}
