import { AuthRequest, UserGetByEmailResponse, UserGetByIdResponse, UserResponse } from "../../common/dto";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { TokenDto, TokenPayload } from "../../common/interfaces";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../../config/app.config";
import ms from "ms";
import { Response } from "express";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { compare } from "../hasher/utils";


@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async storeTokensInCookie(res: Response, tokens: TokenDto) {
    res.cookie('access_token', tokens.access_token, {
      ...this.configService.get('cookie'),
      maxAge: +ms(this.configService.get('auth.jwt.access.expiresIn', { infer: true }))
    })
    res.cookie('refresh_token', tokens.refresh_token, {
      ...this.configService.get('cookie'),
      maxAge: +ms(this.configService.get('auth.jwt.refresh.expiresIn', { infer: true }))
    })
  }

  async signOut(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  async generateJwt(payload: TokenPayload): Promise<TokenDto> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('auth.jwt.access.secret', { infer: true }),
        expiresIn: this.configService.get('auth.jwt.access.expiresIn', { infer: true })
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('auth.jwt.refresh.secret', { infer: true }),
        expiresIn: this.configService.get('auth.jwt.refresh.expiresIn', { infer: true })
      })
    ])
    return {
      access_token,
      refresh_token
    };
  }

  async refreshJwt(userId: string): Promise<{ tokens: TokenDto, user: UserGetByIdResponse }> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new ForbiddenException('Access Denied: User not found');
    }

    return {
      tokens: await this.generateJwt({
        userId,
        email: user.email,
      }),
      user
    }
  }

  async signIn(authData: AuthRequest):
    Promise<{ tokens: TokenDto, user: UserGetByEmailResponse } | null> {
    if (!authData) {
      throw new Error('Unauthenticated');
    }

    const userExists = await this.getAuthenticatedUser(authData);

    if (!userExists) {
      throw new Error('Unauthenticated');
    }

    return {
      tokens: await this.generateJwt({
        userId: userExists.id,
        email: authData.email
      }),
      user: userExists
    }
  }

  async getAuthenticatedUser(data: AuthRequest): Promise<UserGetByEmailResponse | null> {
    const user = await this.userService.getUserByEmail(data.email);
    if (!user) {
      return null;
    }

    const verified = await this.verify(data.password, user.password);
    if (!verified) {
      throw new BadRequestException('Wrong password');
    }

    return user;
  }

  protected async verify(plain: string, hashed: string) {
    return compare(
      plain,
      hashed
    );
  }
}