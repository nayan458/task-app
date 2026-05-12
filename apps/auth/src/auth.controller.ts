import { Controller } from '@nestjs/common';
import { AuthProto } from 'libs/proto';
import { AuthService } from './auth.service';

@Controller()
@AuthProto.AuthServiceControllerMethods()
export class AuthController implements AuthProto.AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  register(request: AuthProto.RegisterRequest): Promise<AuthProto.AuthResponse> {
    return this.authService.register(request);
  }

  login(request: AuthProto.LoginRequest): Promise<AuthProto.AuthResponse> {
    return this.authService.login(request);
  }

  validateToken(
    request: AuthProto.ValidateTokenRequest,
  ): Promise<AuthProto.ValidateTokenResponse> {
    return this.authService.validateToken(request);
  }

  getUserById(
    request: AuthProto.GetUserByIdRequest,
  ): Promise<AuthProto.UserResponse> {
    return this.authService.getUserById(request);
  }
}
