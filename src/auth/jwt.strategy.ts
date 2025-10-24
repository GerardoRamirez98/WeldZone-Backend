import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret =
      process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'test' ? 'test_secret' : undefined);
    if (!secret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: { sub: number; username: string; role: string }) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
