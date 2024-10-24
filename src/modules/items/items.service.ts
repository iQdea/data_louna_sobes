import { Inject, Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { Item, ItemRemote, ItemResponse, QueryGeneric } from "../../common/dto";
import { createHash } from "crypto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name)
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly dataBaseService: DatabaseService,
  ) {
  }

  async initItems() {
    const res = await fetch('https://api.skinport.com/v1/items?app_id=730')
    if (res.status === 200) {
      const itemsRemote: ItemRemote[] = await res.json()
      const items: Item[]
        = itemsRemote.map((x) => (
          {
            name: x.market_hash_name,
            quantity: x.quantity,
            min_tradable: x.min_price,
            min_non_tradable: x.suggested_price
          }));
      const sql = await this.dataBaseService.query();
      await this.clearCache()
      const batchSize = 1000;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await sql`INSERT INTO items ${ sql(batch) } ON CONFLICT (name) DO UPDATE SET 
                            quantity = items.quantity,
                            min_tradable = items.min_tradable,
                            min_non_tradable = items.min_non_tradable`
      }
    } else {
      this.logger.error(res)
      throw new Error('Something went wrong with external api')
    }
  }

  async getItems(filter: QueryGeneric): Promise<ItemResponse[]> {
    const key = await this.getHashKey(filter);
    const cached: ItemResponse[] | undefined = await this.cacheManager.get(key);
    if (cached) {
      this.logger.log('Get items from cache')
      return cached;
    }
    const sql = await this.dataBaseService.query();
    const items: ItemResponse[] = await sql<ItemResponse[]>`
        SELECT * FROM items LIMIT ${filter.pageSize} OFFSET ${(filter.page - 1) * (filter.pageSize)}
    `;
    await this.cacheManager.set(
      key,
      items,
      300e3
    );
    this.logger.log('Get items from request. Result cached')
    return items;
  }

  async getHashKey(params: QueryGeneric) {
    const uniqueString = JSON.stringify(params);
    const hash = createHash('sha256').update(uniqueString).digest('hex');
    const keyString = hash.slice(0, 16);
    return `items_find_${keyString}`;
  }

  async clearCache() {
    const keys = await this.cacheManager.store.keys();
    const keysDel = keys.filter((x) => x.startsWith(`items_find_`))
    for (const key of keysDel) {
      await this.cacheManager.del(key)
    }
  }
}
