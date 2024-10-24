import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/app.config';
import { Request } from "express";
import { TokenPayload } from "../../../common/interfaces";

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService<AppConfig, true>
  ) {
    const extractJwtFromCookie = (req: Request) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies['access_token'];
      }
      return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    };

    super({
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.access.secret', { infer: true }),
      jwtFromRequest: extractJwtFromCookie,
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    if (!payload.userId) throw new UnauthorizedException('Please log in to continue');

    return payload;
  }
}