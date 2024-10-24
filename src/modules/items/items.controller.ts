import { Controller, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ItemsService } from "./items.service";
import { CollectionResponse, EmptyEndpointResponse, Endpoint } from "@qdea/swagger-serializer";
import { JwtGuard } from "../auth/jwt/jwt.guard";
import { ItemResponse, QueryGeneric } from "../../common/dto";

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService
  ) {}

  @Endpoint('get', {
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    },
    summary: 'Отобразить массив объектов с двумя минимальными ценами на предмет',
    response: ItemResponse
  })
  async getItems(@Query() filter: QueryGeneric): CollectionResponse<ItemResponse> {
    const items = await this.itemsService.getItems(filter)
    return {
      dto: ItemResponse,
      data: items
    };
  }

  @Endpoint('post', {
    path: '/init',
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    },
    summary: 'Выгрузка предметов'
  })
  async initItems(): EmptyEndpointResponse {
    await this.itemsService.initItems()
  }
}
