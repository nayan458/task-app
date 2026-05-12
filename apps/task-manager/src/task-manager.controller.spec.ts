import { Test, TestingModule } from '@nestjs/testing';
import { TaskManagerController } from './task-manager.controller';
import { TaskManagerService } from './task-manager.service';

describe('TaskManagerController', () => {
  let taskManagerController: TaskManagerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TaskManagerController],
      providers: [TaskManagerService],
    }).compile();

    taskManagerController = app.get<TaskManagerController>(TaskManagerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(taskManagerController.getHello()).toBe('Hello World!');
    });
  });
});
