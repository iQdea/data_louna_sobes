import config from "./app.config";
import postgres, { Sql } from "postgres";

export function getConnection(): Sql {
  return postgres({
    debug: config().env === 'development',
    prepare: true,
    ...config().database
  })
}