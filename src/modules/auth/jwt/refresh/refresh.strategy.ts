import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AppConfig } from "../../../../config/app.config";
import { TokenPayload } from "../../../../common/interfaces";

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token'
) {
  constructor(
    private readonly configService: ConfigService<AppConfig>
  ) {
    const extractJwtFromCookie = (req: Request) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies['refresh_token'];
      }
      return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    };
    super({
      jwtFromRequest: extractJwtFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.refresh.secret', { infer: true }),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload) {
    const refreshToken =
      JwtRefreshTokenStrategy.extractRefreshJwtFromBearer(request) ??
      JwtRefreshTokenStrategy.extractRefreshJwtFromCookie(request);

    if (!refreshToken)
      throw new UnauthorizedException('JWT refresh token unavailable');

    if (!payload.userId) throw new UnauthorizedException()

    return payload;
  }

  private static extractRefreshJwtFromBearer(req: Request): string | null {
    const str = req.get('Authorization');
    if (!str) return null;
    return str.replace('Bearer', '').trim();
  }

  private static extractRefreshJwtFromCookie(req: Request): string | null {
    return req.cookies?.refresh_token ?? null;
  }
}