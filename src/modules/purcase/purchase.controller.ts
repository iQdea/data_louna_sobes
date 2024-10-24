import { Body, Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PurchaseService } from "./purchase.service";
import { Endpoint, EndpointResponse } from "@qdea/swagger-serializer";
import { JwtGuard } from "../auth/jwt/jwt.guard";
import { User } from "../../common/decorators";
import { TokenPayload } from "../../common/interfaces";
import { PurchaseRequest, PurchaseResponse } from "../../common/dto";

@ApiTags('Purchase')
@Controller('purchase')
export class PurchaseController {
  constructor(
    private readonly purchaseService: PurchaseService
  ) {}

  @Endpoint('post', {
    path: '/buy/block',
    request: {
      body: PurchaseRequest
    },
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    },
    response: PurchaseResponse,
    summary: 'Покупка предметов'
  })
  async buyItemsBlock(
    @User() user: TokenPayload,
    @Body('data') data: PurchaseRequest
  ): EndpointResponse<PurchaseResponse> {
    const purchase = await this.purchaseService.buyItemsWithBlock({
      ...data,
      userId: user.userId,
    })

    return {
      dto: PurchaseResponse,
      data: purchase
    }
  }

  @Endpoint('post', {
    path: '/buy',
    request: {
      body: PurchaseRequest
    },
    protect: {
      enabled: true,
      guards: [JwtGuard],
      security: {
        name: 'access'
      }
    },
    response: PurchaseResponse,
    summary: 'Покупка предметов'
  })
  async buyItems(
    @User() user: TokenPayload,
    @Body('data') data: PurchaseRequest
  ): EndpointResponse<PurchaseResponse> {
    const purchase = await this.purchaseService.buyItemsWithoutBlock({
      ...data,
      userId: user.userId,
    })

    return {
      dto: PurchaseResponse,
      data: purchase
    }
  }
}
