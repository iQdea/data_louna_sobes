import { Controller, Query } from "@nestjs/common";
import { ApiTags, OmitType } from "@nestjs/swagger";
import { ItemsService } from "./items.service";
import { CollectionResponse, EmptyEndpointResponse, Endpoint, EndpointResponse } from "@qdea/swagger-serializer";
import { JwtGuard } from "../auth/jwt/jwt.guard";
import { ItemBase, ItemResponse, ItemsArrayResponse, QueryGeneric } from "../../common/dto";

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService
  ) {}

  @Endpoint('get', {
    path: 'pagination/db',
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    },
    summary: 'Отобразить массив объектов с двумя минимальными ценами на предмет с пагинацией с бд',
    response: ItemResponse
  })
  async getItems(@Query() filter: QueryGeneric): CollectionResponse<ItemResponse> {
    const items = await this.itemsService.getItems(filter)
    return {
      dto: ItemResponse,
      data: items
    };
  }

  @Endpoint('get', {
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    },
    summary: 'Отобразить массив объектов с двумя минимальными ценами на предмет',
    response: ItemBase
  })
  async getParsed(): CollectionResponse<ItemBase> {
    const items = await this.itemsService.parseApi()
    return {
      dto: ItemBase,
      data: items
    };
  }

  @Endpoint('get', {
    path: 'pagination/array',
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    },
    summary: 'Отобразить массив объектов с двумя минимальными ценами на предмет с пагинацией без бд',
    response: ItemBase
  })
  async getParsedPaginated(@Query() filter: QueryGeneric): CollectionResponse<ItemBase> {
    const items = await this.itemsService.parseApi(filter)
    return {
      dto: ItemBase,
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
