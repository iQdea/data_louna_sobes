import { Module } from '@nestjs/common';
import { DatabaseModule } from "../database/database.module";
import { DatabaseService } from "../database/database.service";
import { ItemsService } from "./items.service";
import { ItemsController } from "./items.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [ItemsController],
  providers: [ItemsService, DatabaseService],
  exports: [ItemsService]
})
export class ItemsModule {}