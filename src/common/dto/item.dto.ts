import { Exclude, Expose } from "class-transformer";
import { ApiProperty, OmitType } from "@nestjs/swagger";

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
export class ItemBase {
  @Expose()
  @ApiProperty()
  name!: string

  @Expose()
  @ApiProperty()
  min_tradable!: number | null

  @Expose()
  @ApiProperty()
  min_non_tradable!: number | null
}



@Exclude()
export class ItemResponse extends ItemBase {
  @Expose()
  @ApiProperty()
  id!: string
}

export type ItemsArrayResponse = Omit<ItemResponse, "id">[]

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
