import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UserModule } from "../user/user.module";
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from "@nestjs/jwt";
import { AuthenticationService } from "./auth.service";
import { AuthenticationController } from "./auth.controller";
import { JwtAuthStrategy } from "./jwt/jwt.strategy";
import { AppConfig } from "../../config/app.config";
import { JwtRefreshTokenStrategy } from "./jwt/refresh/refresh.strategy";

@Module({
  imports: [
    UserModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfig, true>) => ({
        secret: configService.get('auth.jwt.access.secret', { infer: true }),
        signOptions: {
          expiresIn: `${configService.get('auth.jwt.access.expiresIn', { infer: true })}`,
        },
      }),
    }),
  ],
  providers: [AuthenticationService, JwtAuthStrategy, JwtRefreshTokenStrategy],
  controllers: [AuthenticationController]
})
export class AuthenticationModule {}