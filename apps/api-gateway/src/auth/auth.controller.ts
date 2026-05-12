import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { AUTH_SERVICE, AuthProto } from 'libs/proto';
import { Public } from 'libs/common';
import { LoginDto, RegisterDto } from './auth.dto';

@ApiTags('auth')
@Controller('api/auth')
export class AuthGatewayController implements OnModuleInit {
  private authService!: AuthProto.AuthServiceClient;

  constructor(@Inject(AUTH_SERVICE) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.authService = this.client.getService<AuthProto.AuthServiceClient>(
      AuthProto.AUTH_SERVICE_NAME,
    );
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() body: RegisterDto) {
    const response = await firstValueFrom(this.authService.register(body));
    return { token: response.token, user: response.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return JWT' })
  async login(@Body() body: LoginDto) {
    const response = await firstValueFrom(this.authService.login(body));
    return { token: response.token, user: response.user };
  }
}
