import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request, Response } from 'express';

interface AuthenticatedUser {
  userId: number;
  username: string;
  role: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ Endpoint de login
  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.login(
      username,
      password,
    );

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = Number(
      process.env.REFRESH_TOKEN_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000,
    );
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      path: '/',
      maxAge,
    });

    return { access_token };
  }

  // ✅ Obtener usuario autenticado
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: { user: AuthenticatedUser }) {
    return { user: req.user };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieHeader = req.headers['cookie'] ?? '';
    const token = this.parseCookie(cookieHeader, 'refresh_token');
    if (!token) throw new UnauthorizedException('No hay refresh token');

    const { access_token, refresh_token } = await this.authService.refresh(
      token,
    );

    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = Number(
      process.env.REFRESH_TOKEN_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000,
    );
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      path: '/',
      maxAge,
    });
    return { access_token };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieHeader = req.headers['cookie'] ?? '';
    const token = this.parseCookie(cookieHeader, 'refresh_token');
    if (token) {
      await this.authService.revokeFromToken(token);
    }
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      path: '/',
    });
    return { ok: true };
  }

  private parseCookie(cookieHeader: string, name: string): string | null {
    const cookies = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean);
    for (const c of cookies) {
      const [k, ...rest] = c.split('=');
      if (k === name) return rest.join('=');
    }
    return null;
  }
}
