import * as Joi from 'joi';

export interface JwtAuth {
  access: {
    secret: string,
    expiresIn: string,
  },
  refresh: {
    secret: string,
    expiresIn: string,
  },
}

export interface AppConfig {
  env: string;
  port: number;
  host: string;
  redis: {
    port: number;
    host: string;
  };
  ssl: string;
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  },
  cookie: {
    maxAge: number,
    secure: boolean,
    httpOnly: boolean
  },
  auth: Record<string, JwtAuth>
}

export function getConfigValidationSchema() {
  return Joi.object({
    NODE_ENV: Joi.string().default('development').valid('test', 'development', 'production'),
    PORT: Joi.number().optional().allow(''),
    POSTGRES_HOST: Joi.string().optional().allow(''),
    POSTGRES_PORT: Joi.number().optional().allow(''),
    POSTGRES_DB: Joi.string().optional().allow(''),
    POSTGRES_USER: Joi.string().optional().allow(''),
    POSTGRES_PASSWORD: Joi.string().optional().allow(''),
    JWT_SECRET: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_EXPIRATION_TIME: Joi.string().optional().default('60m'),
    JWT_REFRESH_EXPIRATION_TIME: Joi.string().optional().default('30d'),
    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.string().required()
  });
}

export default (): AppConfig => {
  const ssl = Boolean(process.env.SSL) ? 'https://' : 'http://';
  const host = process.env.HOST || 'localhost';
  const port = Number.parseInt(process.env.PORT || '', 10) || 3200;
  return {
    redis: {
      host: process.env.REDIS_HOST || '',
      port: Number.parseInt(process.env.REDIS_PORT || '', 10) || 3200
    },
    env: process.env.NODE_ENV || 'development',
    ssl,
    host,
    port,
    database: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number.parseInt(process.env.POSTGRES_PORT || '', 10) || 5432,
      database: process.env.POSTGRES_DB || 'sobes',
      user: process.env.POSTGRES_USER || 'sobes',
      password: process.env.POSTGRES_PASSWORD || 'sobes',
    },
    auth: {
      jwt: {
        access: {
          secret: process.env.JWT_SECRET || '',
          expiresIn: process.env.JWT_EXPIRATION_TIME || ''
        },
        refresh: {
          secret: process.env.JWT_REFRESH_SECRET || '',
          expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME || ''
        }
      }
    },
    cookie: {
      maxAge: 2592000000,
      secure: false,
      httpOnly: false
    }
  }
}