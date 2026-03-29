import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private buildResponse(user: {
    id: string;
    email: string;
    name: string;
    currency: string;
    locale: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
      locale: user.locale,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
        locale: user.locale,
      },
    };
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.createUser({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildResponse(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
      locale: user.locale,
    };
  }
}
