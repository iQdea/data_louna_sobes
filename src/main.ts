import { HttpAdapterHost, NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from './app.module';
import { ConfigService } from "@nestjs/config";
import { expressMiddleware } from 'cls-rtracer';
import { NestExpressApplication } from "@nestjs/platform-express";
import { Request } from 'express';
import { v4 as uuid } from 'uuid';
import { Logger, ValidationPipe } from "@nestjs/common";
import { ResponseSerializerInterceptor } from "@qdea/swagger-serializer";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { LoggerErrorInterceptor } from 'nestjs-pino';
import { HttpExceptionFilter } from "./common/filters/exception.filter";
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true
  });

  const logger = new Logger()
  app.use(cookieParser())
  const configService = app.get(ConfigService);

  app.use(
    expressMiddleware({
      requestIdFactory: (req: Request) => (req.id = uuid())
    })
  );

  app.enableCors({
    origin: true,
    credentials: true
  })

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(
    new ResponseSerializerInterceptor(app.get(Reflector), {
      exposeDefaultValues: true,
      exposeUnsetFields: false,
      enableCircularCheck: true
    }),
    new LoggerErrorInterceptor()
  );

  const swConfig = new DocumentBuilder()
    .setTitle('API')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access'
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'refresh'
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swConfig);
  SwaggerModule.setup('api', app, swaggerDocument, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      filter: true,
      docExpansion: 'none'
    }
  });

  app.enableShutdownHooks();

  const { httpAdapter } = app.get(HttpAdapterHost);
  const config = app.get<ConfigService>(ConfigService);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapter, config));

  const port = configService.get('port', { infer: true });
  await app.listen(port,
    () => {
      logger.log(`App listening on port ${port}`)
    }
  );
}

bootstrap();
