import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from 'libs/database';

@Module({
  imports: [
    DatabaseModule.forRoot('MONGO_URI')
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
