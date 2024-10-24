import { Module } from '@nestjs/common';
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { DatabaseModule } from "../database/database.module";
import { DatabaseService } from "../database/database.service";

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService, DatabaseService],
  exports: [UserService]
})
export class UserModule {}