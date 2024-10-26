import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Sql } from "postgres";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject('DATA_SOURCE') private sql: Sql,
  ) {
  }

  async queryUnsafe<T extends any[]>(queryString: string, params: any[]): Promise<T> {
    try {
      return await this.sql.unsafe<T>(queryString, params);
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
