import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  UserGetByEmailResponse,
  UserGetByIdResponse,
  UserPasswordUpdateRequest
} from "../../common/dto";
import { DatabaseService } from "../database/database.service";
import { compare, generateSalt, hash } from "../hasher/utils";
import { Sql } from "postgres";

@Injectable()
export class UserService {
  constructor(
    private readonly dataBaseService: DatabaseService
  ) {
  }

  async updateUserPassword(data: UserPasswordUpdateRequest): Promise<void> {
    const user = await this.getUserById(data.id)
    if (!user) {
      throw new NotFoundException(`User not found`)
    }
    const userPassword = user.password;
    if (compare(data.oldPassword, userPassword)) {
      const newPassword = hash(data.newPassword, generateSalt(10))
      const sql: Sql = await this.dataBaseService.query();

      await sql`UPDATE users 
                SET ${
                  sql({ password: newPassword })
                }
                WHERE id = ${ data.id }`;
    } else {
      throw new ForbiddenException('Incorrect old password')
    }
  }

  async getUserByEmail(email: string): Promise<UserGetByEmailResponse | null> {
    const [user]: UserGetByEmailResponse[] =
      // TODO: get safe
      await this.dataBaseService.queryUnsafe<UserGetByEmailResponse[]>(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
    if (!user) {
      return null;
    }
    return user;
  }

  async getUserById(id: string): Promise<UserGetByIdResponse | null> {
    const [user]: UserGetByIdResponse[] =
      // TODO: get safe
      await this.dataBaseService.queryUnsafe<UserGetByIdResponse[]>(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
    if (!user) {
      return null;
    }
    return user;
  }
}
