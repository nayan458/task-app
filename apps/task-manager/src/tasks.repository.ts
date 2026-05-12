import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';

export interface ListFilters {
  createdBy: Types.ObjectId;
  status?: string;
  priority?: string;
  search?: string;
}

export interface ListOptions {
  page: number;
  limit: number;
  sortBy: string;
  order: SortOrder;
}

type MongoFilter = Record<string, unknown>;
type MongoUpdate = Record<string, unknown>;

@Injectable()
export class TasksRepository {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  create(data: Partial<Task>): Promise<TaskDocument> {
    return this.taskModel.create(data);
  }

  findOneByIdForUser(
    id: string,
    userId: string,
  ): Promise<TaskDocument | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      return Promise.resolve(null);
    }
    return this.taskModel
      .findOne({
        _id: new Types.ObjectId(id),
        createdBy: new Types.ObjectId(userId),
      })
      .exec();
  }

  updateOneByIdForUser(
    id: string,
    userId: string,
    update: MongoUpdate,
  ): Promise<TaskDocument | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      return Promise.resolve(null);
    }
    return this.taskModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          createdBy: new Types.ObjectId(userId),
        },
        update,
        { new: true, runValidators: true },
      )
      .exec();
  }

  deleteOneByIdForUser(
    id: string,
    userId: string,
  ): Promise<{ deletedCount: number }> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      return Promise.resolve({ deletedCount: 0 });
    }
    return this.taskModel
      .deleteOne({
        _id: new Types.ObjectId(id),
        createdBy: new Types.ObjectId(userId),
      })
      .exec()
      .then((res) => ({ deletedCount: res.deletedCount ?? 0 }));
  }

  async list(
    filters: ListFilters,
    options: ListOptions,
  ): Promise<{ items: TaskDocument[]; total: number }> {
    const query = this.buildFilter(filters);
    const skip = (options.page - 1) * options.limit;

    const [items, total] = await Promise.all([
      this.taskModel
        .find(query)
        .sort({ [options.sortBy]: options.order })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.taskModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  private buildFilter(filters: ListFilters): MongoFilter {
    const query: MongoFilter = { createdBy: filters.createdBy };
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.search) {
      const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escaped, $options: 'i' };
    }
    return query;
  }
}
