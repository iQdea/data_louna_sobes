import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Sql } from "postgres";
import { getConnection } from "../../config/postgres.config";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private sql!: Sql;

  async onModuleInit() {
    try {
      this.sql = getConnection();
      this.logger.log('Connected to database')
    } catch (e) {
      this.logger.error(e)
      throw e;
    }
  }

  async queryUnsafe<T extends any[]>(queryString: string, params: any[]): Promise<T> {
    const sql = this.sql;
    try {
      return await sql.unsafe<T>(queryString, params);
    } catch (e) {
      this.logger.error('Database query error:' + e);
      throw e;
    }
  }

  async query() {
    return this.sql;
  }

  async onModuleDestroy() {
    try {
      await this.sql.end();
      this.logger.log('Disconnected from database')
    } catch (e) {
      this.logger.error(e)
      throw e;
    }
  }
}
