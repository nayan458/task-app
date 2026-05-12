import { Controller, Get } from '@nestjs/common';
import { TaskManagerService } from './task-manager.service';

@Controller()
export class TaskManagerController {
  constructor(private readonly taskManagerService: TaskManagerService) {}

  @Get()
  getHello(): string {
    return this.taskManagerService.getHello();
  }
}
