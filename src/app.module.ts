import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import config, { getConfigValidationSchema } from "./config/app.config";
import { LoggerModule } from "nestjs-pino";
import pino from "pino";
import { Request, Response } from "express";
// import { postgresConfig } from "./config/postgres.config";
import { UserModule } from "./modules/user/user.module";
import { AuthenticationModule } from "./modules/auth/auth.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CacheModule as CacheModule_ } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";
import { DatabaseModule } from "./modules/database/database.module";
import { ItemsModule } from "./modules/items/items.module";
import { PurchaseModule } from "./modules/purcase/purchase.module";

const ignoredPaths = new Set(['/health', '/metrics', '/favicon.ico']);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
      validationSchema: getConfigValidationSchema()
    }),
    CacheModule_.registerAsync({
      isGlobal: true,
      inject: [
        ConfigService
      ],
      imports: [ConfigModule],
      useFactory: async () => ({
        isGlobal: true,
        max: 10_000,
        store: (): any => redisStore({
          commandsQueueMaxLength: 10_000,
          socket: {
            host: config().redis.host,
            port: config().redis.port,
          }
        })
      })
    }),
    LoggerModule.forRoot({
      pinoHttp: [
        {
          autoLogging: {
            ignore: (req) => {
              return !!req.url && ignoredPaths.has(req.url);
            }
          },
          serializers: {
            req: (req: Request) => ({
              id: req.id,
              method: req.method,
              url: req.url
            }),
            res: (res: Response) => ({
              statusCode: res.statusCode
            })
          }
        },
        pino.multistream(
          [
            { level: 'trace', stream: process.stdout },
            { level: 'debug', stream: process.stdout },
            { level: 'info', stream: process.stdout },
            { level: 'warn', stream: process.stdout },
            { level: 'error', stream: process.stderr },
            { level: 'fatal', stream: process.stderr }
          ],
          { dedupe: true }
        )
      ]
    }),
    UserModule,
    ItemsModule,
    PurchaseModule,
    DatabaseModule,
    AuthenticationModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
