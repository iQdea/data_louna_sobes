import { Exclude, Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

@Exclude()
export class Item {
  @Expose()
  @ApiProperty()
  name!: string

  @Expose()
  @ApiProperty()
  quantity!: number
}

@Exclude()
export class ItemTradable extends Item {
  @Expose()
  @ApiProperty()
  min_tradable!: number
}

@Exclude()
export class ItemNonTradable extends Item {
  @Expose()
  @ApiProperty()
  min_non_tradable!: number
}

@Exclude()
export class ItemRemote {
  @Expose()
  @ApiProperty()
  market_hash_name!: string

  @Expose()
  @ApiProperty()
  quantity!: number

  @Expose()
  @ApiProperty()
  min_price!: number

  @Expose()
  @ApiProperty()
  suggested_price!: number
}


@Exclude()
export class ItemResponse {
  @Expose()
  @ApiProperty()
  id!: string

  @Expose()
  @ApiProperty()
  name!: string

  @Expose()
  @ApiProperty()
  min_tradable!: number

  @Expose()
  @ApiProperty()
  min_non_tradable!: number
}

@Exclude()
export class ItemResponsePurchase {
  @Expose()
  @ApiProperty()
  id!: string

  @Expose()
  @ApiProperty()
  quantity!: number

  @Expose()
  @ApiProperty()
  min_tradable!: number | null

  @Expose()
  @ApiProperty()
  min_non_tradable!: number
}
