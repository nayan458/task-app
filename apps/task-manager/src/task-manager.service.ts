import { Injectable } from '@nestjs/common';

@Injectable()
export class TaskManagerService {
  getHello(): string {
    return 'Hello World!';
  }
}
