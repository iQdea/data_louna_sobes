import { Body, Controller, Param } from "@nestjs/common";
import { ApiParam, ApiTags } from "@nestjs/swagger";
import { EmptyEndpointResponse, Endpoint } from "@qdea/swagger-serializer";
import { UserPasswordUpdateRequest } from "../../common/dto";
import { UserService } from "./user.service";
import { JwtGuard } from "../auth/jwt/jwt.guard";

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService
  ) {}

  @Endpoint('patch', {
    path: '/:id',
    request: {
      body: UserPasswordUpdateRequest
    },
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    },
    summary: 'Обновить пароль пользователя',
    additional_decorators: [
      ApiParam({
        name: 'id',
        required: true,
        description: 'ID пользователя',
        example: 'fee87de1-5f34-4cce-b38b-644e2a99f40f'
      })
    ],
  })
  async updateUserPassword(
    @Param('id') id: string,
    @Body('data') data: UserPasswordUpdateRequest
  ): EmptyEndpointResponse {
    await this.userService.updateUserPassword({ ...data, id });
  }
}
