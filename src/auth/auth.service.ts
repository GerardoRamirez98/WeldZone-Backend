import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private getRefreshSecret(): string {
    const secret = process.env.REFRESH_TOKEN_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'REFRESH_TOKEN_SECRET/JWT_SECRET no configurados en variables de entorno.',
      );
    }
    return secret;
  }

  private getRefreshExpires(): string {
    return process.env.REFRESH_TOKEN_EXPIRES ?? '7d';
  }

  private buildPayload(user: Pick<User, 'id' | 'username' | 'role'>) {
    return { sub: user.id, username: user.username, role: user.role } as const;
  }

  generateAccessToken(user: Pick<User, 'id' | 'username' | 'role'>): string {
    const payload = this.buildPayload(user);
    return this.jwtService.sign(payload);
  }

  generateRefreshToken(
    user: Pick<User, 'id' | 'username' | 'role'>,
    jti: string,
  ): string {
    const payload = this.buildPayload(user);
    return this.jwtService.sign(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.getRefreshExpires(),
      jwtid: jti,
    });
  }

  private ensureTablePromise: Promise<void> | null = null;
  private ensureTable(): Promise<void> {
    if (!this.ensureTablePromise) {
      this.ensureTablePromise = (async () => {
        // Crear tabla de refresh tokens si no existe
        await this.prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "RefreshToken" ("jti" TEXT PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "isRevoked" BOOLEAN NOT NULL DEFAULT FALSE, "expiresAt" TIMESTAMPTZ NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "revokedAt" TIMESTAMPTZ, "replacedByJti" TEXT)'
        );
        await this.prisma.$executeRawUnsafe(
          'CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken" ("userId")'
        );
      })();
    }
    return this.ensureTablePromise;
  }

  private getRefreshMaxAgeMs(): number {
    const ms = Number(process.env.REFRESH_TOKEN_MAX_AGE_MS);
    if (!Number.isFinite(ms) || ms <= 0) return 7 * 24 * 60 * 60 * 1000; // 7 días
    return ms;
  }

  private async insertRefreshRecord(jti: string, userId: number, expiresAt: Date) {
    await this.prisma.$executeRaw`INSERT INTO "RefreshToken" ("jti", "userId", "expiresAt") VALUES (${jti}, ${userId}, ${expiresAt})`;
  }

  private async findRefreshRecord(jti: string): Promise<
    | { jti: string; userId: number; isRevoked: boolean; expiresAt: Date; replacedByJti: string | null }
    | null
  > {
    const rows = (await this.prisma.$queryRaw<
      { jti: string; userId: number; isRevoked: boolean; expiresAt: Date; replacedByJti: string | null }[]
    >`SELECT "jti", "userId", "isRevoked", "expiresAt", COALESCE("replacedByJti", NULL) as "replacedByJti" FROM "RefreshToken" WHERE "jti" = ${jti} LIMIT 1`) as any;
    return rows && rows.length ? rows[0] : null;
  }

  private async revokeJti(jti: string, replacedByJti?: string) {
    await this.prisma.$executeRaw`UPDATE "RefreshToken" SET "isRevoked" = TRUE, "revokedAt" = NOW(), "replacedByJti" = ${
      replacedByJti ?? null
    } WHERE "jti" = ${jti}`;
  }

  async verifyRefreshToken(token: string): Promise<{
    sub: number;
    username: string;
    role: string;
    iat?: number;
    exp?: number;
  }> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  // Validar usuario
  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid)
      throw new UnauthorizedException('Contraseña incorrecta');

    return user;
  }

  // Login con JWT + Refresh
  async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string; user: Pick<User, 'id' | 'username' | 'role'> }> {
    const user = await this.validateUser(username, password);
    const publicUser = { id: user.id, username: user.username, role: user.role };

    await this.ensureTable();
    const jti = randomUUID();
    const refreshToken = this.generateRefreshToken(publicUser, jti);
    const expiresAt = new Date(Date.now() + this.getRefreshMaxAgeMs());
    await this.insertRefreshRecord(jti, publicUser.id, expiresAt);
    return {
      access_token: this.generateAccessToken(publicUser),
      refresh_token: refreshToken,
      user: publicUser,
    };
  }

  // Refrescar tokens usando refresh token
  async refresh(
    refreshToken: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: { id: number; username: string; role: string };
  }> {
    await this.ensureTable();
    const payload = await this.verifyRefreshToken(refreshToken);
    const jti = (payload as any).jti as string | undefined;
    if (!jti) throw new UnauthorizedException('Refresh token sin jti');
    const record = await this.findRefreshRecord(jti);
    if (!record || record.isRevoked)
      throw new UnauthorizedException('Refresh token inválido');
    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now())
      throw new UnauthorizedException('Refresh token expirado');
    const user = await this.usersService.findByUsername(payload.username);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const publicUser = { id: user.id, username: user.username, role: user.role };
    // Rotar: revocar actual y emitir nuevo
    const newJti = randomUUID();
    const newRefresh = this.generateRefreshToken(publicUser, newJti);
    const expiresAt = new Date(Date.now() + this.getRefreshMaxAgeMs());
    await this.insertRefreshRecord(newJti, publicUser.id, expiresAt);
    await this.revokeJti(jti, newJti);
    return {
      access_token: this.generateAccessToken(publicUser),
      refresh_token: newRefresh,
      user: publicUser,
    };
  }

  async revokeFromToken(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const jti = (payload as any).jti as string | undefined;
      if (!jti) return;
      await this.ensureTable();
      await this.revokeJti(jti);
    } catch {
      // Ignorar errores al revocar
    }
  }
}
