import { Body, Controller, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthenticationService } from "./auth.service";
import {
  AuthRequest, UserGetByIdResponse,
  UserResponse
} from "../../common/dto";
import { EmptyEndpointResponse, Endpoint, EndpointResponse } from "@qdea/swagger-serializer";
import { ApiTags } from "@nestjs/swagger";
import { JwtGuard } from "./jwt/jwt.guard";
import { TokenPayload } from "../../common/interfaces";
import RefreshGuard from "./jwt/refresh/refresh.guard";
import { User } from "../../common/decorators";

@ApiTags('Auth')
@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService
  ) {}


  @Endpoint('post', {
    path: 'sign-in',
    request: {
      body: AuthRequest
    },
    response: UserResponse
  })
  async signIn(
    @Body('data') data: AuthRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const resp = await this.authenticationService.signIn(data)
    if (!resp) {
      return;
    }
    const { tokens, user } = resp;
    await this.authenticationService.storeTokensInCookie(res, tokens);
    return {
      dto: UserResponse,
      data: user
    }
  }

  @Endpoint('post', {
    path: 'sign-out',
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    }
  })
  async signOut(
    @Res({ passthrough: true }) res: Response
  ): EmptyEndpointResponse {
    await this.authenticationService.signOut(res);
  }

  @Endpoint('get', {
    path: 'refresh',
    protect: {
      enabled: true,
      guards: [RefreshGuard],
      security: {
        name: 'refresh'
      }
    },
    response: UserResponse
  })
  async refresh(
    @User() user: TokenPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): EndpointResponse<UserGetByIdResponse> {
    const { tokens, user: userNew } = await this.authenticationService.refreshJwt(user.userId);
    await this.authenticationService.storeTokensInCookie(res, tokens);
    return {
      dto: UserGetByIdResponse,
      data: userNew
    }
  }
}