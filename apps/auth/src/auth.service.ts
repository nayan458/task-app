import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import * as bcrypt from 'bcrypt';
import { AuthProto } from 'libs/proto';
import { ConfigService } from 'libs/config';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';

const BCRYPT_ROUNDS = 12;

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: AuthProto.RegisterRequest): Promise<AuthProto.AuthResponse> {
    const email = input.email.toLowerCase().trim();
    if (await this.users.existsByEmail(email)) {
      throw new RpcException({
        code: GrpcStatus.ALREADY_EXISTS,
        message: 'Email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const created = await this.users.create({
      name: input.name.trim(),
      email,
      password: passwordHash,
    });

    return {
      token: await this.signToken({ sub: created.id, email: created.email }),
      user: this.toProtoUser(created),
    };
  }

  async login(input: AuthProto.LoginRequest): Promise<AuthProto.AuthResponse> {
    const user = await this.users.findByEmail(input.email);
    const passwordOk = user
      ? await bcrypt.compare(input.password, user.password)
      : false;
    if (!user || !passwordOk) {
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: 'Invalid email or password',
      });
    }
    return {
      token: await this.signToken({ sub: user.id, email: user.email }),
      user: this.toProtoUser(user),
    };
  }

  async validateToken(
    input: AuthProto.ValidateTokenRequest,
  ): Promise<AuthProto.ValidateTokenResponse> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(input.token, {
        secret: this.config.jwtSecret,
      });
      return { valid: true, userId: payload.sub, email: payload.email };
    } catch {
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: 'Invalid or expired token',
      });
    }
  }

  async getUserById(
    input: AuthProto.GetUserByIdRequest,
  ): Promise<AuthProto.UserResponse> {
    const user = await this.users.findById(input.id);
    if (!user) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'User not found',
      });
    }
    return { user: this.toProtoUser(user) };
  }

  private signToken(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  private toProtoUser(user: UserDocument): AuthProto.User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt:
        (user as UserDocument & { createdAt?: Date }).createdAt?.toISOString() ??
        '',
    };
  }
}
