import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { SortOrder, Types } from 'mongoose';
import { TaskProto } from 'libs/proto';
import { TasksRepository } from './tasks.repository';
import {
  Task,
  TaskDocument,
  TaskPriority,
  TaskStatus,
} from './schemas/task.schema';

const ALLOWED_SORT_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'dueDate',
  'priority',
  'status',
  'title',
]);

@Injectable()
export class TaskManagerService {
  constructor(private readonly tasks: TasksRepository) {}

  async createTask(
    request: TaskProto.CreateTaskRequest,
  ): Promise<TaskProto.TaskResponse> {
    this.assertObjectId(request.userId, 'user');

    const dueDate = this.parseDate(request.dueDate, 'dueDate');
    const created = await this.tasks.create({
      title: request.title,
      description: request.description,
      status: this.mapStatusFromProto(request.status) ?? TaskStatus.TODO,
      priority: this.mapPriorityFromProto(request.priority) ?? TaskPriority.MEDIUM,
      dueDate,
      createdBy: new Types.ObjectId(request.userId),
    });

    return { task: this.toProtoTask(created) };
  }

  async getTaskById(
    request: TaskProto.GetTaskByIdRequest,
  ): Promise<TaskProto.TaskResponse> {
    this.assertObjectId(request.userId, 'user');
    const task = await this.tasks.findOneByIdForUser(request.id, request.userId);
    if (!task) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Task not found',
      });
    }
    return { task: this.toProtoTask(task) };
  }

  async getTasks(
    request: TaskProto.GetTasksRequest,
  ): Promise<TaskProto.GetTasksResponse> {
    this.assertObjectId(request.userId, 'user');

    const page = request.page && request.page > 0 ? request.page : 1;
    const limit =
      request.limit && request.limit > 0 ? Math.min(request.limit, 100) : 10;

    const sortBy =
      request.sortBy && ALLOWED_SORT_FIELDS.has(request.sortBy)
        ? request.sortBy
        : 'createdAt';
    const order: SortOrder = this.mapOrder(request.order);

    const { items, total } = await this.tasks.list(
      {
        createdBy: new Types.ObjectId(request.userId),
        status: this.mapStatusFromProto(request.status),
        priority: this.mapPriorityFromProto(request.priority),
        search: request.search,
      },
      { page, limit, sortBy, order },
    );

    return {
      items: items.map((t) => this.toProtoTask(t)),
      total,
      page,
      limit,
    };
  }

  async updateTask(
    request: TaskProto.UpdateTaskRequest,
  ): Promise<TaskProto.TaskResponse> {
    this.assertObjectId(request.userId, 'user');

    const update: Partial<Task> = {};
    if (request.title !== undefined) update.title = request.title;
    if (request.description !== undefined) update.description = request.description;
    const status = this.mapStatusFromProto(request.status);
    if (status) update.status = status;
    const priority = this.mapPriorityFromProto(request.priority);
    if (priority) update.priority = priority;
    if (request.dueDate !== undefined && request.dueDate !== '') {
      update.dueDate = this.parseDate(request.dueDate, 'dueDate');
    }

    if (Object.keys(update).length === 0) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'No updatable fields provided',
      });
    }

    const updated = await this.tasks.updateOneByIdForUser(
      request.id,
      request.userId,
      update,
    );
    if (!updated) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Task not found or not owned by user',
      });
    }

    return { task: this.toProtoTask(updated) };
  }

  async deleteTask(
    request: TaskProto.DeleteTaskRequest,
  ): Promise<TaskProto.DeleteTaskResponse> {
    this.assertObjectId(request.userId, 'user');
    const result = await this.tasks.deleteOneByIdForUser(
      request.id,
      request.userId,
    );
    if (result.deletedCount === 0) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'Task not found or not owned by user',
      });
    }
    return { success: true };
  }

  private assertObjectId(value: string, label: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: `Invalid ${label} id`,
      });
    }
  }

  private parseDate(value: string, label: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: `Invalid ${label}`,
      });
    }
    return d;
  }

  private mapStatusFromProto(
    value: TaskProto.TaskStatus | undefined,
  ): TaskStatus | undefined {
    if (value === undefined) return undefined;
    const key = String(value);
    if (key === 'TASK_STATUS_UNSPECIFIED' || key === '0') return undefined;
    if (key in TaskStatus) return key as TaskStatus;
    return undefined;
  }

  private mapPriorityFromProto(
    value: TaskProto.TaskPriority | undefined,
  ): TaskPriority | undefined {
    if (value === undefined) return undefined;
    const key = String(value);
    if (key === 'TASK_PRIORITY_UNSPECIFIED' || key === '0') return undefined;
    if (key in TaskPriority) return key as TaskPriority;
    return undefined;
  }

  private mapOrder(value: TaskProto.SortOrder | undefined): SortOrder {
    const key = value === undefined ? '' : String(value);
    if (key === 'ASC' || key === '1') return 'asc';
    return 'desc';
  }

  private toProtoTask(doc: TaskDocument): TaskProto.Task {
    const ts = doc as TaskDocument & { createdAt?: Date; updatedAt?: Date };
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      status: doc.status as unknown as TaskProto.TaskStatus,
      priority: doc.priority as unknown as TaskProto.TaskPriority,
      dueDate: doc.dueDate.toISOString(),
      createdBy: doc.createdBy.toString(),
      createdAt: ts.createdAt?.toISOString() ?? '',
      updatedAt: ts.updatedAt?.toISOString() ?? '',
    };
  }
}
