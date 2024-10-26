import config from "./app.config";
import postgres, { Sql } from "postgres";
import { Logger } from "@nestjs/common";
const logger = new Logger()

export function getConnection(): Sql {
  logger.log('Connected to database')
  return postgres({
    debug: config().env === 'development',
    prepare: true,
    ...config().database
  })
}