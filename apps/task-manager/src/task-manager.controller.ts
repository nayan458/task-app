import { Controller } from '@nestjs/common';
import { TaskProto } from 'libs/proto';
import { TaskManagerService } from './task-manager.service';

@Controller()
@TaskProto.TaskServiceControllerMethods()
export class TaskManagerController implements TaskProto.TaskServiceController {
  constructor(private readonly taskService: TaskManagerService) {}

  createTask(request: TaskProto.CreateTaskRequest): Promise<TaskProto.TaskResponse> {
    return this.taskService.createTask(request);
  }

  getTasks(request: TaskProto.GetTasksRequest): Promise<TaskProto.GetTasksResponse> {
    return this.taskService.getTasks(request);
  }

  getTaskById(
    request: TaskProto.GetTaskByIdRequest,
  ): Promise<TaskProto.TaskResponse> {
    return this.taskService.getTaskById(request);
  }

  updateTask(request: TaskProto.UpdateTaskRequest): Promise<TaskProto.TaskResponse> {
    return this.taskService.updateTask(request);
  }

  deleteTask(
    request: TaskProto.DeleteTaskRequest,
  ): Promise<TaskProto.DeleteTaskResponse> {
    return this.taskService.deleteTask(request);
  }
}
