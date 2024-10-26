import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders, DatabaseService],
  exports: [...databaseProviders, DatabaseService],
})
export class DatabaseModule {}
