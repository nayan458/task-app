import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { TASK_SERVICE, TaskProto } from 'libs/proto';
import { CurrentUser } from 'libs/common';
import type { AuthenticatedUser } from 'libs/common';
import {
  CreateTaskDto,
  GetTasksQueryDto,
  SortOrder,
  UpdateTaskDto,
} from './tasks.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('api/tasks')
export class TasksGatewayController implements OnModuleInit {
  private taskService!: TaskProto.TaskServiceClient;

  constructor(@Inject(TASK_SERVICE) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.taskService = this.client.getService<TaskProto.TaskServiceClient>(
      TaskProto.TASK_SERVICE_NAME,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task' })
  async create(@Body() body: CreateTaskDto, @CurrentUser() user: AuthenticatedUser) {
    const response = await firstValueFrom(
      this.taskService.createTask({
        title: body.title,
        description: body.description,
        status: (body.status ?? 'TODO') as unknown as TaskProto.TaskStatus,
        priority: (body.priority ??
          'MEDIUM') as unknown as TaskProto.TaskPriority,
        dueDate: body.dueDate,
        userId: user.userId,
      }),
    );
    return response.task;
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with pagination, filtering, sorting' })
  async list(
    @Query() query: GetTasksQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const response = await firstValueFrom(
      this.taskService.getTasks({
        userId: user.userId,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        status: query.status as unknown as TaskProto.TaskStatus | undefined,
        priority: query.priority as unknown as
          | TaskProto.TaskPriority
          | undefined,
        search: query.search,
        sortBy: query.sortBy,
        order:
          query.order === SortOrder.ASC
            ? ('ASC' as unknown as TaskProto.SortOrder)
            : query.order === SortOrder.DESC
              ? ('DESC' as unknown as TaskProto.SortOrder)
              : undefined,
      }),
    );
    return {
      items: response.items,
      total: response.total,
      page: response.page,
      limit: response.limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task' })
  async getOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const response = await firstValueFrom(
      this.taskService.getTaskById({ id, userId: user.userId }),
    );
    return response.task;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task (creator only)' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const response = await firstValueFrom(
      this.taskService.updateTask({
        id,
        userId: user.userId,
        title: body.title,
        description: body.description,
        status: body.status as unknown as TaskProto.TaskStatus | undefined,
        priority: body.priority as unknown as
          | TaskProto.TaskPriority
          | undefined,
        dueDate: body.dueDate,
      }),
    );
    return response.task;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task (creator only)' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const response = await firstValueFrom(
      this.taskService.deleteTask({ id, userId: user.userId }),
    );
    return { deleted: response.success };
  }
}
