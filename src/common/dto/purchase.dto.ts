import { Exclude, Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Nested } from "@qdea/swagger-serializer";

@Exclude()
export class PurchaseItem {
  @Expose()
  @ApiProperty({ default: '254166f2-65ae-4bf7-b49e-22205ff97073'})
  id!: string

  @Expose()
  @ApiProperty({ default: 1 })
  quantity!: number
}

@Exclude()
export class PurchaseRequest {
  @Expose()
  userId!: string

  @Expose()
  @ApiProperty()
  @Nested(PurchaseItem, true)
  items!: PurchaseItem[]
}



@Exclude()
export class PurchaseResponse {
  @Expose()
  @ApiProperty()
  total!: number

  @Expose()
  @ApiProperty()
  balance!: number
}
