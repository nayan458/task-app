import { NestFactory } from '@nestjs/core';
import { TaskManagerModule } from './task-manager.module';

async function bootstrap() {
  const app = await NestFactory.create(TaskManagerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
