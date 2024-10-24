import { Module } from '@nestjs/common';
import { DatabaseModule } from "../database/database.module";
import { DatabaseService } from "../database/database.service";
import { PurchaseService } from "./purchase.service";
import { PurchaseController } from "./purchase.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [PurchaseController],
  providers: [PurchaseService, DatabaseService],
  exports: [PurchaseService]
})
export class PurchaseModule {}